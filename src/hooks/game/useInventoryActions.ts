import { useCallback } from 'react';
import type { GameState } from '../../types/game';
import { quickSellByQualityRange as quickSellBackpackByRange } from '../../logic/inventory';
import { applyInventoryAction, type InventoryAction } from '../../logic/inventory/actions';
import { recalculatePlayerStats } from '../../logic/playerStats';

interface UseInventoryActionsParams {
  gameState: GameState;
  loading: boolean;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  setLoading: (loading: boolean) => void;
  addLog: (msg: string) => void;
  reportError: (err: unknown, context?: { action?: string }) => void;
}

export const useInventoryActions = ({
  setGameState,
  setLoading,
  addLog,
  reportError,
}: UseInventoryActionsParams) => {
  const quickSellByQualityRange = useCallback((minQuality: string, maxQuality: string) => {
    setGameState((prev) => {
      const result = quickSellBackpackByRange(prev, minQuality, maxQuality);
      addLog(result.message);
      return recalculatePlayerStats(result.nextState);
    });
  }, [setGameState, addLog]);

  const processAction = useCallback((action: InventoryAction) => {
    setLoading(true);

    setTimeout(() => {
      try {
        setGameState((prev) => {
          try {
            const result = applyInventoryAction(prev, action);
            result.logs.forEach(addLog);
            return recalculatePlayerStats(result.nextState);
          } catch (error) {
            reportError(error, { action: action.type });
            return prev;
          }
        });
      } finally {
        setLoading(false);
      }
    }, 500);
  }, [setLoading, setGameState, addLog, reportError]);

  return {
    quickSellByQualityRange,
    processAction,
  };
};