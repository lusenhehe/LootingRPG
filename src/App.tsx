import { createFreshInitialState } from './app/state';
import type { ActiveTab, GameState, MapProgressState, Equipment } from './types/game';
import { useInventoryActions } from './hooks/game/useInventoryActions';
import { createAutoSellQualityMap } from './domains/inventory/services/autoSell';
import { useProfileSave } from './hooks/profile/useProfileSave';
import { createInitialMapProgress } from './domains/map/services/progress';
import { runBattlePlayerAttack, runBattleRetreat, startBattleSession } from './domains/battle/services/session';
import { ACTIVE_PROFILE_KEY } from './config/runtime/storage';
import { LoginScreen } from './components/auth/LoginScreen';
import { GameScreen  } from './components/game/GameScreen';
import { createCustomEquipment } from './domains/inventory/services/equipment';
import { MAP_CHAPTERS } from './config/map/ChapterData';
import { useState, useCallback } from 'react';
import { ThemeProvider } from './config/themes/ThemeContext';
export default function App() {
  // Core state
  const [gameState, setGameState] = useState<GameState>(() => createFreshInitialState());
  const [logs, setLogs] = useState<string[]>(['[System] Game started.']);
  const [autoSellQualities, setAutoSellQualities] = useState<Record<string, boolean>>(createAutoSellQualityMap());
  const [mapProgress, setMapProgress] = useState<MapProgressState>(() => createInitialMapProgress(MAP_CHAPTERS));
  const [activeTab, setActiveTab] = useState<ActiveTab>('map');
  const [forgeSelectedId, setForgeSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [focusMapNode, setFocusMapNode] = useState<string | null>(null);

  // Logging utility
  const addLog = (msg: string) => {
    if (!msg) return;
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev.slice(-99), `[${time}] ${msg}`]);
  };

  // Error reporting
  const reportError = (err: unknown, context: { action?: string } = {}) => {
    const message = err instanceof Error ? err.message : String(err);
    const parts = [`[Error] ${message}`, `profile=${activeProfileId}`];
    if (context.action) parts.push(`action=${context.action}`);
    addLog(parts.join(' '));
  };

  // Profile management
  const {
    profiles,
    activeProfileId,
    isAuthenticated,
    handleLogin,
    handleCreateProfile,
    handleDeleteProfile,
    handleExportSave,
    handleImportSave,
    handleLogout,
  } = useProfileSave({
    gameState,
    logs,
    autoSellQualities,
    mapProgress,
    setGameState,
    setLogs,
    setAutoSellQualities,
    setMapProgress,
    addLog,
  });
  const { quickSellByQualityRange, processAction } = useInventoryActions({
    gameState,
    loading,
    setGameState,
    setLoading,
    addLog,
    reportError,
  });

  const handleEquip   = useCallback((id: string) => processAction({ type: 'equip', itemId: id }), [processAction]);
  const handleSell    = useCallback((id: string) => processAction({ type: 'sell', itemId: id }), [processAction]);
  const handleForge   = useCallback((id: string) => processAction({ type: 'enchant', itemId: id }), [processAction]);
  const handleReroll  = useCallback((id: string, lockTypes?: string[]) => processAction({ type: 'reroll', itemId: id, lockTypes }), [processAction]);
  const handleUnequip = useCallback((slot: string) => processAction({ type: 'unequip_slot', slot }), [processAction]);
  const handleToggleAutoSellQuality = useCallback((quality: string) => {
    setAutoSellQualities((prev) => ({ ...prev, [quality]: !prev[quality] }));
  }, []);

  const handleLogoutAction = useCallback(() => {
    handleLogout();
    setLoading(false);
    localStorage.removeItem(ACTIVE_PROFILE_KEY);
  }, [handleLogout, setLoading]);

  const handleReset = useCallback(() => {
    if (confirm('Are you sure you want to reset this save?')) {
      setGameState(createFreshInitialState());
      setLoading(false);
      setLogs(['[System] Save reset complete.']);
      setMapProgress(createInitialMapProgress(MAP_CHAPTERS));
    }
  }, [setGameState, setLoading, setLogs, setMapProgress]);

  const handleBattleAttack = useCallback(() => {
    const result = runBattlePlayerAttack(gameState, mapProgress, MAP_CHAPTERS);
    setGameState(result.nextGameState);
    setMapProgress(result.nextMapProgress);
    if (result.focusNodeId) {
      setFocusMapNode(result.focusNodeId);
      setActiveTab('map');
    }
    result.logs.forEach(addLog);
  }, [gameState, mapProgress, setGameState, setMapProgress, setFocusMapNode, setActiveTab]);

  const handleBattleRetreat = useCallback(() => {
    const result = runBattleRetreat(gameState, mapProgress, MAP_CHAPTERS);
    setGameState(result.nextGameState);
    setMapProgress(result.nextMapProgress);
    setActiveTab('map');
    if (result.focusNodeId) {
      setFocusMapNode(result.focusNodeId);
    }
    result.logs.forEach(addLog);
  }, [gameState, mapProgress, setGameState, setMapProgress, setActiveTab, setFocusMapNode]);

  if (!isAuthenticated) {
    return (
      <LoginScreen
        profiles={profiles}
        onLogin={handleLogin}
        onCreate={handleCreateProfile}
        onDelete={handleDeleteProfile}
      />
    );
  }
  const currentProfile = profiles.find((profile) => profile.id === activeProfileId);

  return (
    <ThemeProvider>
    <GameScreen
      gameState={gameState}
      activeTab={activeTab}
      loading={loading}
      playerName={currentProfile?.name || 'Unknown Player'}
      autoSellQualities={autoSellQualities}
      forgeSelectedId={forgeSelectedId}
      battleSession={gameState.battle.activeSession}
      playerStats={gameState.playerStats}
      onExportSave={handleExportSave}
      onImportSave={handleImportSave}
      onLogout={handleLogoutAction}
      onReset={handleReset}
      mapProgress={mapProgress}
      onSelectMapChapter={(chapterId) => {
        setMapProgress((prev) => ({ ...prev, selectedChapterId: chapterId }));
      }}
      focusMapNode={focusMapNode}
      onClearFocusMapNode={() => setFocusMapNode(null)}
      onSetTab={setActiveTab}
      onEnterMapNode={(node, chapter) => {
        const battle = startBattleSession(gameState, chapter, node);
        setGameState(battle.nextGameState);
        battle.logs.forEach(addLog);
      }}
      onBattleAttack={handleBattleAttack}
      onBattleRetreat={handleBattleRetreat}
      onQuickSellByQualityRange={quickSellByQualityRange}
      onEquip={handleEquip}
      onSell={handleSell}
      onForge={handleForge}
      onToggleAutoSellQuality={handleToggleAutoSellQuality}
      onReroll={handleReroll}
      onSelectForgeItem={setForgeSelectedId}
      onUnequip={handleUnequip}
      onDebugAddItems={(quality, slot, count, level) => {
        const items: Equipment[] = [];
        const lv  = Math.floor(level ?? gameState.playerStats.level);
        for (let i = 0; i < count; i++) {
          items.push(createCustomEquipment(quality, slot, lv));
        }
        setGameState((prev) => ({ ...prev, backpack: [...prev.backpack, ...items] }));
        addLog(`[Debug] Added ${count} ${quality} ${slot} items (Lv.${lv}) to backpack`);
      }}
    />
    </ThemeProvider>
  );
}
