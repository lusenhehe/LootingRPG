import { useCallback, useState } from 'react';
import { createFreshInitialState } from './state';
import type { ActiveTab, Equipment, GameState, MapProgressState } from '../types/game';
import { createAutoSellQualityMap } from '../domains/inventory/services/autoSell';
import { createInitialMapProgress } from '../domains/map/services/progress';
import { runBattlePlayerAttack, runBattleRetreat, startBattleSession } from '../domains/battle/services/session';
import { createCustomEquipment } from '../domains/inventory/services/equipment';
import { MAP_CHAPTERS } from '../config/map/ChapterData';
import { useProfileSave } from '../hooks/profile/useProfileSave';
import { useInventoryActions } from '../hooks/game/useInventoryActions';
import { ACTIVE_PROFILE_KEY } from '../config/runtime/storage';

export const useGameOrchestrator = () => {
  const [gameState, setGameState] = useState<GameState>(() => createFreshInitialState());
  const [logs, setLogs] = useState<string[]>(['[System] Game started.']);
  const [autoSellQualities, setAutoSellQualities] = useState<Record<string, boolean>>(createAutoSellQualityMap());
  const [mapProgress, setMapProgress] = useState<MapProgressState>(() => createInitialMapProgress(MAP_CHAPTERS));
  const [activeTab, setActiveTab] = useState<ActiveTab>('map');
  const [forgeSelectedId, setForgeSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [focusMapNode, setFocusMapNode] = useState<string | null>(null);

  const addLog = useCallback((msg: string) => {
    if (!msg) return;
    const time = new Date().toLocaleTimeString();
    setLogs((prev) => [...prev.slice(-99), `[${time}] ${msg}`]);
  }, []);

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

  const reportError = useCallback((err: unknown, context: { action?: string } = {}) => {
    const message = err instanceof Error ? err.message : String(err);
    const parts = [`[Error] ${message}`, `profile=${activeProfileId}`];
    if (context.action) parts.push(`action=${context.action}`);
    addLog(parts.join(' '));
  }, [activeProfileId, addLog]);

  const { quickSellByQualityRange, processAction } = useInventoryActions({
    gameState,
    loading,
    setGameState,
    setLoading,
    addLog,
    reportError,
  });

  const handleEquip = useCallback((id: string) => processAction({ type: 'equip', itemId: id }), [processAction]);
  const handleSell = useCallback((id: string) => processAction({ type: 'sell', itemId: id }), [processAction]);
  const handleForge = useCallback((id: string) => processAction({ type: 'enchant', itemId: id }), [processAction]);
  const handleReroll = useCallback((id: string, lockTypes?: string[]) => processAction({ type: 'reroll', itemId: id, lockTypes }), [processAction]);
  const handleUnequip = useCallback((slot: string) => processAction({ type: 'unequip_slot', slot }), [processAction]);

  const handleToggleAutoSellQuality = useCallback((quality: string) => {
    setAutoSellQualities((prev) => ({ ...prev, [quality]: !prev[quality] }));
  }, []);

  const handleLogoutAction = useCallback(() => {
    handleLogout();
    setLoading(false);
    localStorage.removeItem(ACTIVE_PROFILE_KEY);
  }, [handleLogout]);

  const handleReset = useCallback(() => {
    if (confirm('Are you sure you want to reset this save?')) {
      setGameState(createFreshInitialState());
      setLoading(false);
      setLogs(['[System] Save reset complete.']);
      setMapProgress(createInitialMapProgress(MAP_CHAPTERS));
    }
  }, []);

  const handleBattleAttack = useCallback(() => {
    const result = runBattlePlayerAttack(gameState, mapProgress, MAP_CHAPTERS);
    setGameState(result.nextGameState);
    setMapProgress(result.nextMapProgress);
    if (result.focusNodeId) {
      setFocusMapNode(result.focusNodeId);
      setActiveTab('map');
    }
    result.logs.forEach(addLog);
  }, [gameState, mapProgress, addLog]);

  const handleBattleRetreat = useCallback(() => {
    const result = runBattleRetreat(gameState, mapProgress, MAP_CHAPTERS);
    setGameState(result.nextGameState);
    setMapProgress(result.nextMapProgress);
    setActiveTab('map');
    if (result.focusNodeId) {
      setFocusMapNode(result.focusNodeId);
    }
    result.logs.forEach(addLog);
  }, [gameState, mapProgress, addLog]);

  const handleEnterMapNode = useCallback((node: Parameters<typeof startBattleSession>[2], chapter: Parameters<typeof startBattleSession>[1]) => {
    const battle = startBattleSession(gameState, chapter, node);
    setGameState(battle.nextGameState);
    battle.logs.forEach(addLog);
  }, [gameState, addLog]);

  const handleDebugAddItems = useCallback((quality: string, slot: string, count: number, level?: number) => {
    const items: Equipment[] = [];
    const lv = Math.floor(level ?? gameState.playerStats.level);

    for (let i = 0; i < count; i += 1) {
      items.push(createCustomEquipment(quality, slot, lv));
    }

    setGameState((prev) => ({ ...prev, backpack: [...prev.backpack, ...items] }));
    addLog(`[Debug] Added ${count} ${quality} ${slot} items (Lv.${lv}) to backpack`);
  }, [gameState.playerStats.level, addLog]);

  return {
    profiles,
    activeProfileId,
    isAuthenticated,
    gameState,
    loading,
    activeTab,
    autoSellQualities,
    forgeSelectedId,
    mapProgress,
    focusMapNode,
    setActiveTab,
    setMapProgress,
    setFocusMapNode,
    setForgeSelectedId,
    handleLogin,
    handleCreateProfile,
    handleDeleteProfile,
    handleExportSave,
    handleImportSave,
    handleLogoutAction,
    handleReset,
    handleEnterMapNode,
    handleBattleAttack,
    handleBattleRetreat,
    handleToggleAutoSellQuality,
    quickSellByQualityRange,
    handleEquip,
    handleSell,
    handleForge,
    handleReroll,
    handleUnequip,
    handleDebugAddItems,
  };
};
