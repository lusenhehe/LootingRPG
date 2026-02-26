import React, { createContext, useContext, useReducer, useState, useCallback } from 'react';
import { createFreshInitialState } from './state';
import type { GameState } from '../shared/types/game';
import { createInitialMapProgress } from '../domains/map/services/progress';
import { MAP_CHAPTERS } from '../config/map/ChapterData';
import { useProfileSave } from '../hooks/profile/useProfileSave';
import { useInventoryActions } from '../hooks/game/useInventoryActions';
import { ACTIVE_PROFILE_KEY } from '../config/runtime/storage';

// smaller hooks
import { useGameLogger } from '../hooks/game/useGameLogger';
import { useAutoSell } from '../hooks/game/useAutoSell';
import { useMapProgress } from '../hooks/game/useMapProgress';
import { useBattleSession } from '../hooks/game/useBattleSession';
import { useDebug } from '../hooks/game/useDebug';

// split contexts for better render isolation
import { AuthContext, type AuthContextValue } from './context/auth';
import { LogContext, type LogContextValue } from './context/log';
import { AutoSellContext, type AutoSellContextValue } from './context/autoSell';
import { MapContext, type MapContextValue } from './context/map';
import { BattleContext, type BattleContextValue } from './context/battle';
import { InventoryContext, type InventoryContextValue } from './context/inventory';
import { DebugContext, type DebugContextValue } from './context/debug';
import { MiscContext, type MiscContextValue } from './context/misc';
import { StateContext, type StateContextValue } from './context/state';

// --- game state reducer --------------------------------------------------

type GameStateAction =
  | { type: 'RESET' }
  | { type: 'SET'; payload: GameState };

function gameReducer(state: GameState, action: GameStateAction): GameState {
  switch (action.type) {
    case 'RESET':
      return createFreshInitialState();
    case 'SET':
      return action.payload;
    default:
      return state;
  }
}
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
    gameReducer,
    undefined,
    () => createFreshInitialState(),
  );
  const setGameState: React.Dispatch<React.SetStateAction<GameState>> = useCallback(
    (value) => {
      if (typeof value === 'function') {
        // cast because TS can't infer from overloaded Dispatch type
        const updater = value as (prev: GameState) => GameState;
        dispatchGameState({ type: 'SET', payload: updater(gameState) });
      } else {
        dispatchGameState({ type: 'SET', payload: value });
      }
    },
    [gameState],
  );

  const [loading, setLoading] = useState(false);
  const [forgeSelectedId, setForgeSelectedId] = useState<string | null>(null);

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

  const { handleBattleAttack, handleBattleRetreat, handleEnterMapNode } = useBattleSession({
    gameState,
    mapProgress,
    setGameState,
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
    setGameState,
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
      setGameState(createFreshInitialState());
      setLoading(false);
      setLogs(['[System] 存档已重置完成。storage 已清除。']);
      setMapProgress(createInitialMapProgress(MAP_CHAPTERS));
    }
  }, [setGameState, setLoading, setLogs, setMapProgress]);

  const { handleDebugAddItems } = useDebug({ gameState, setGameState, addLog });

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
    forgeSelectedId,
    setForgeSelectedId,
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
