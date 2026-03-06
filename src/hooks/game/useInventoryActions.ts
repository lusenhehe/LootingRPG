import { useCallback } from 'react';
import type { GameState } from '../../shared/types/game';
import type { GameStateAction } from '../../app/state/actions';
import { quickSellByQualityRange as quickSellBackpackByRange } from '../../domains/inventory/services/quickSell';
import { applyInventoryAction, type InventoryAction } from '../../domains/inventory/services/actions';
import { recalculatePlayerStats } from '../../domains/player/services/recalculatePlayerStats';

interface UseInventoryActionsParams {
  /** 返回最新 gameState 的函数（通过 ref 实现，避免闭包陈旧值） */
  getGameState: () => GameState;
  loading: boolean;
  dispatchGameState: React.Dispatch<GameStateAction>;
  setLoading: (loading: boolean) => void;
  addLog: (msg: string) => void;
  reportError: (err: unknown, context?: { action?: string }) => void;
}

export const useInventoryActions = ({
  getGameState,
  setLoading,
  dispatchGameState,
  addLog,
  reportError,
}: UseInventoryActionsParams) => {
  const quickSellByQualityRange = useCallback((minQuality: string, maxQuality: string) => {
    const current = getGameState();
    const result = quickSellBackpackByRange(current, minQuality, maxQuality);
    addLog(result.message);
    dispatchGameState({ type: 'INVENTORY/QUICK_SELL', payload: recalculatePlayerStats(result.nextState) });
  }, [getGameState, dispatchGameState, addLog]);

  const processAction = useCallback((action: InventoryAction) => {
    setLoading(true);

    setTimeout(() => {
      try {
        const current = getGameState();
        const result = applyInventoryAction(current, action);
        result.logs.forEach(addLog);
        dispatchGameState({ type: 'INVENTORY/APPLY', payload: recalculatePlayerStats(result.nextState) });
      } catch (error) {
        reportError(error, { action: action.type });
      } finally {
        setLoading(false);
      }
    });
  }, [getGameState, setLoading, dispatchGameState, addLog, reportError]);

  return {
    quickSellByQualityRange,
    processAction,
  };
};
