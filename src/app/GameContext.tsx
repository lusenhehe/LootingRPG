// 统一的游戏上下文，集中管理所有游戏相关的状态和操作
import React, { createContext, useContext, useReducer, useState, useCallback, useRef } from 'react';
import { createFreshInitialState } from './state';
import { rootReducer } from './state';
import { createInitialMapProgress } from '../domains/map/services/progress';
import { MAP_CHAPTERS } from '../config/map/ChapterData';
import { useProfileSave } from '../hooks/profile/useProfileSave';
import { useInventoryActions } from '../hooks/game/useInventoryActions';
import { ACTIVE_PROFILE_KEY } from '../config/runtime/storage';

//  更小的上下文拆分，减少不必要的重渲染
import { useGameLogger } from '../hooks/game/useGameLogger';
import { useAutoSell } from '../hooks/game/useAutoSell';
import { useMapProgress } from '../hooks/game/useMapProgress';
import { useBattleSession } from '../hooks/game/useBattleSession';
import { useDebug } from '../hooks/game/useDebug';

// 集中导出所有 context，提供一个统一的 useGame() hook 供组件使用
import { AuthContext, type AuthContextValue } from './context/auth';
import { LogContext, type LogContextValue } from './context/log';
import { AutoSellContext, type AutoSellContextValue } from './context/autoSell';
import { MapContext, type MapContextValue } from './context/map';
import { BattleContext, type BattleContextValue } from './context/battle';
import { InventoryContext, type InventoryContextValue } from './context/inventory';
import { DebugContext, type DebugContextValue } from './context/debug';
import { MiscContext, type MiscContextValue } from './context/misc';
import { StateContext, type StateContextValue } from './context/state';

// ---  GameState  --------------------------------------------------

export interface GameContextValue
  extends AuthContextValue,
    LogContextValue,
    AutoSellContextValue,
    MapContextValue,
    BattleContextValue,
    InventoryContextValue,
    DebugContextValue,
    MiscContextValue,
    StateContextValue {}

const GameContext = createContext<GameContextValue | undefined>(undefined);

export const GameProvider: React.FC<React.PropsWithChildren<unknown>> = ({ children }) => {
  const [gameState, dispatchGameState] = useReducer(
    rootReducer,
    undefined,
    () => createFreshInitialState(),
  );
  // Ref 供需要 "最新状态" 的回调使用（避免闭包捕获到旧值）
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  const [loading, setLoading] = useState(false);

  const { logs, setLogs, addLog } = useGameLogger();
  const {
    autoSellQualities,
    toggleQuality: handleToggleAutoSellQuality,
    setAutoSellQualities,
  } = useAutoSell();
  const {
    mapProgress,
    setMapProgress,
    activeTab,
    setActiveTab,
    focusMapNode,
    setFocusMapNode,
  } = useMapProgress();

  const { handleBattleAttack, handleBattleRetreat, handleBattleCloseResult, handleBattleUseSkill, handleEnterMapNode } = useBattleSession({
    gameState,
    mapProgress,
    dispatchGameState,
    setMapProgress,
    addLog,
    setActiveTab,
    setFocusMapNode,
  });

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
    loadProfile,
  } = useProfileSave({
    gameState,
    logs,
    autoSellQualities,
    mapProgress,
    dispatchGameState,
    setLogs,
    setAutoSellQualities,
    setMapProgress,
    addLog,
  });

  const reportError = useCallback(
    (err: unknown, context: { action?: string } = {}) => {
      const message = err instanceof Error ? err.message : String(err);
      const parts = [`[Error] ${message}`, `profile=${activeProfileId}`];
      if (context.action) parts.push(`action=${context.action}`);
      addLog(parts.join(' '));
    },
    [activeProfileId, addLog],
  );

  const { quickSellByQualityRange, processAction } = useInventoryActions({
    getGameState: () => gameStateRef.current,
    loading,
    dispatchGameState,
    setLoading,
    addLog,
    reportError,
  });

  const handleEquip = useCallback((id: string) => processAction({ type: 'equip', itemId: id }), [processAction]);
  const handleSell = useCallback((id: string) => processAction({ type: 'sell', itemId: id }), [processAction]);
  const handleForge = useCallback((id: string) => processAction({ type: 'enchant', itemId: id }), [processAction]);
  const handleReroll = useCallback(
    (id: string, lockTypes?: string[]) => processAction({ type: 'reroll', itemId: id, lockTypes }),
    [processAction],
  );
  const handleUnequip = useCallback((slot: string) => processAction({ type: 'unequip_slot', slot }), [processAction]);

  const handleLogoutAction = useCallback(() => {
    handleLogout();
    setLoading(false);
    localStorage.removeItem(ACTIVE_PROFILE_KEY);
  }, [handleLogout]);

  const handleReset = useCallback(() => {
    if (confirm('你确定要重置当前存档吗？此操作无法撤销。')) {
      dispatchGameState({ type: 'SYSTEM/RESET_SAVE', payload: createFreshInitialState() });
      setLoading(false);
      setLogs(['[System] 存档已重置完成。storage 已清除。']);
      setMapProgress(createInitialMapProgress(MAP_CHAPTERS));
    }
  }, [setLoading, setLogs, setMapProgress]);

  const { handleDebugAddItems } = useDebug({ gameState, dispatchGameState, addLog });

  const authValue: AuthContextValue = {
    profiles,
    activeProfileId,
    isAuthenticated,
    handleLogin,
    handleCreateProfile,
    handleDeleteProfile,
    handleExportSave,
    handleImportSave,
    handleLogoutAction,
    loadProfile,
  };

  const logValue: LogContextValue = {
    logs,
    addLog,
    setLogs,
  };

  const autoSellValue: AutoSellContextValue = {
    autoSellQualities,
    handleToggleAutoSellQuality,
    setAutoSellQualities,
  };

  const mapValue: MapContextValue = {
    mapProgress,
    setMapProgress,
    activeTab,
    setActiveTab,
    focusMapNode,
    setFocusMapNode,
  };

  const battleValue: BattleContextValue = {
    handleEnterMapNode,
    handleBattleAttack,
    handleBattleRetreat,
    handleBattleCloseResult,
    handleBattleUseSkill,
  };

  const inventoryValue: InventoryContextValue = {
    quickSellByQualityRange,
    handleEquip,
    handleSell,
    handleForge,
    handleReroll,
    handleUnequip,
  };

  const debugValue: DebugContextValue = {
    handleDebugAddItems,
  };

  const miscValue: MiscContextValue = {
    handleReset,
  };

  const stateValue: StateContextValue = {
    gameState,
    dispatchGameState,
    loading,
    setLoading,
  };

  const gameValue: GameContextValue = {
    ...authValue,
    ...logValue,
    ...autoSellValue,
    ...mapValue,
    ...battleValue,
    ...inventoryValue,
    ...debugValue,
    ...miscValue,
    ...stateValue,
  };

  return (
    <AuthContext.Provider value={authValue}>
    <LogContext.Provider value={logValue}>
    <AutoSellContext.Provider value={autoSellValue}>
    <MapContext.Provider value={mapValue}>
    <BattleContext.Provider value={battleValue}>
    <InventoryContext.Provider value={inventoryValue}>
    <DebugContext.Provider value={debugValue}>
    <MiscContext.Provider value={miscValue}>
    <StateContext.Provider value={stateValue}>
    <GameContext.Provider value={gameValue}>{children}</GameContext.Provider>
    </StateContext.Provider>
    </MiscContext.Provider>
    </DebugContext.Provider>
    </InventoryContext.Provider>
    </BattleContext.Provider>
    </MapContext.Provider>
    </AutoSellContext.Provider>
    </LogContext.Provider>
    </AuthContext.Provider>
  );
};

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return ctx;
}
