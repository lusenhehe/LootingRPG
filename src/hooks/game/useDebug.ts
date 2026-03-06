import { useCallback } from 'react';
import { createCustomEquipment } from '../../domains/inventory/services/equipment';
import type { Equipment, GameState } from '../../shared/types/game';
import type { GameStateAction } from '../../app/state/actions';

interface UseDebugParams {
  gameState: GameState;
  dispatchGameState: React.Dispatch<GameStateAction>;
  addLog: (msg: string) => void;
}

/**
 * 提供调试工具（目前仅是添加自定义装备）
 */
export function useDebug({ gameState, dispatchGameState, addLog }: UseDebugParams) {
  const handleDebugAddItems = useCallback(
    (quality: string, slot: string, count: number, level?: number) => {
      const items: Equipment[] = [];
      const lv = Math.floor(level ?? gameState.playerStats.level);

      for (let i = 0; i < count; i += 1) {
        items.push(createCustomEquipment(quality, slot, lv));
      }

      dispatchGameState({
        type: 'DEBUG/ADD_ITEMS',
        payload: { ...gameState, backpack: [...gameState.backpack, ...items] },
      });
      addLog(`[Debug] Added ${count} ${quality} ${slot} items (Lv.${lv}) to backpack`);
    },
    [gameState, dispatchGameState, addLog],
  );

  const handleDebugAddItemList = useCallback(
    (items: Equipment[]) => {
      if (items.length === 0) return;
      dispatchGameState({
        type: 'DEBUG/ADD_ITEMS',
        payload: { ...gameState, backpack: [...gameState.backpack, ...items] },
      });
      addLog(`[Debug] Added ${items.length} custom items to backpack`);
    },
    [gameState, dispatchGameState, addLog],
  );

  return { handleDebugAddItems, handleDebugAddItemList } as const;
}
