import { useState } from 'react';
import {
  ACTIVE_PROFILE_KEY,
  createAutoSellQualityMap,
} from './constants/game';
import type { ActiveTab, GameState, MapProgressState } from './types/game';
import { useBattleFlow } from './hooks/battle/useBattleFlow';
import { useProfileSave } from './hooks/profile/useProfileSave';
import { useBattleActions } from './hooks/game/useBattleActions';
import { useMapActions } from './hooks/game/useMapActions';
import { useAutoBattle } from './hooks/game/useAutoBattle';
import { useInventoryActions } from './hooks/game/useInventoryActions';
import { LoginScreen } from './components/auth/LoginScreen';
import { GameScreen } from './components/game/GameScreen';
import { createFreshInitialState, createInitialBattleState } from './logic/gameState';
import { applySingleBattleReward } from './logic/battleRewards';
import { createInitialMapProgress } from './logic/mapProgress';
import { MAP_CHAPTERS } from './config/mapChapters';

export default function App() {
  // Core state
  const [gameState, setGameState] = useState<GameState>(() => createFreshInitialState());
  const [logs, setLogs] = useState<string[]>(['[系统] 游戏已启动。']);
  const [autoSellQualities, setAutoSellQualities] = useState<Record<string, boolean>>(createAutoSellQualityMap());
  const [mapProgress, setMapProgress] = useState<MapProgressState>(() => createInitialMapProgress(MAP_CHAPTERS));
  const [activeTab, setActiveTab] = useState<ActiveTab>('status');
  const [forgeSelectedId, setForgeSelectedId] = useState<string | null>(null);
  const [autoBattleEnabled, setAutoBattleEnabled] = useState(false);

  // Logging utility
  const addLog = (msg: string) => {
    if (!msg) return;
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev.slice(-99), `[${time}] ${msg}`]);
  };

  // Error reporting
  const reportError = (err: unknown, context: { action?: string } = {}) => {
    const message = err instanceof Error ? err.message : String(err);
    const parts = [`[错误] ${message}`, `profile=${activeProfileId}`];
    if (context.action) parts.push(`action=${context.action}`);
    addLog(parts.join(' '));
  };

  // Battle system hooks
  const {
    battleState,
    loading,
    setLoading,
    startBattleSequence: hookStartBattleSequence,
    clearBattleTimers,
    scheduleBattleStep,
    setBattleState,
  } = useBattleFlow({ gameState, addLog });

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
    setBattleState,
    addLog,
  });

  // Map actions first to get resolveMapChallengeResult
  const { resolveMapChallengeResult, startMapNodeBattle: mapNodeBattle } = useMapActions({
    gameState,
    battleState,
    loading,
    mapProgress,
    hookStartBattleSequence,
    scheduleBattleStep,
    setGameState,
    setBattleState,
    setLoading,
    setMapProgress,
    addLog,
    applyBatchBattleRewards: (state, monsters) => {
      let nextState = state;
      const allLogs: string[] = [];
      let droppedName = '未知战利品';

      monsters.forEach((monster) => {
        const result = applySingleBattleReward(nextState, !!monster.isBoss, autoSellQualities);
        nextState = result.nextState;
        droppedName = result.droppedName;
        allLogs.push(...result.logs);
      });

      return {
        nextState,
        droppedName,
        logs: allLogs,
      };
    },
    reportError,
    onSetTab: setActiveTab,
  });

  // Battle actions with resolveMapChallengeResult dependency
  const { startBattleSequence: battleStartSequence, startMonsterWaveBattle: battleWaveSequence } = useBattleActions({
    gameState,
    battleState,
    loading,
    autoSellQualities,
    hookStartBattleSequence,
    scheduleBattleStep,
    setGameState,
    setBattleState,
    setLoading,
    addLog,
    resolveMapChallengeResult,
    reportError,
  });

  // Auto battle with proper battle sequence
  const { toggleAutoBattle, clearAutoBattleTimer } = useAutoBattle({
    autoBattleEnabled,
    loading,
    battleState,
    setAutoBattleEnabled,
    startBattleSequence: battleStartSequence,
    addLog,
  });

  // Inventory actions
  const { quickSellByQualityRange, processAction } = useInventoryActions({
    gameState,
    loading,
    setGameState,
    setLoading,
    addLog,
    reportError,
  });

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
    <GameScreen
      gameState={gameState}
      battleState={battleState}
      activeTab={activeTab}
      loading={loading}
      playerName={currentProfile?.name || '未知玩家'}
      autoBattleEnabled={autoBattleEnabled}
      autoSellQualities={autoSellQualities}
      forgeSelectedId={forgeSelectedId}
      playerStats={gameState.玩家状态}
      onExportSave={handleExportSave}
      onImportSave={handleImportSave}
      onLogout={() => {
        clearBattleTimers();
        clearAutoBattleTimer();
        handleLogout();
        setBattleState(createInitialBattleState());
        setLoading(false);
        setAutoBattleEnabled(false);
        localStorage.removeItem(ACTIVE_PROFILE_KEY);
      }}
      onReset={() => {
        if (confirm('确定要重置存档吗？')) {
          clearBattleTimers();
          clearAutoBattleTimer();
          setGameState(createFreshInitialState());
          setBattleState(createInitialBattleState());
          setLoading(false);
          setAutoBattleEnabled(false);
          setLogs(['[系统] 存档已重置。']);
          setMapProgress(createInitialMapProgress(MAP_CHAPTERS));
        }
      }}
      mapProgress={mapProgress}
      onSelectMapChapter={(chapterId) => {
        setMapProgress((prev) => ({ ...prev, selectedChapterId: chapterId }));
      }}
      onSetTab={setActiveTab}
      onChallengeMonster={() => battleStartSequence(false)}
      onChallengeBoss={() => battleStartSequence(true)}
      onChallengeWave={() => battleWaveSequence(5)}
      onEnterMapNode={mapNodeBattle}
      onToggleAutoBattle={toggleAutoBattle}
      onQuickSellByQualityRange={quickSellByQualityRange}
      onEquip={(id) => processAction(`装备 ${id}`)}
      onSell={(id) => processAction(`出售 ${id}`)}
      onForge={(id) => processAction(`强化 ${id}`)}
      onToggleAutoSellQuality={(quality) => {
        setAutoSellQualities((prev) => ({ ...prev, [quality]: !prev[quality] }));
      }}
      onReroll={(id) => processAction(`洗练 ${id}`)}
      onSelectForgeItem={setForgeSelectedId}
      onUnequip={(slot) => processAction(`卸下槽位 ${slot}`)}
    />
  );
}
