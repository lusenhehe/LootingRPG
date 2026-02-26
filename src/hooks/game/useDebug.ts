import { useCallback } from 'react';
import { createCustomEquipment } from '../../domains/inventory/services/equipment';
import type { Equipment, GameState } from '../../shared/types/game';

interface UseDebugParams {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  addLog: (msg: string) => void;
}

/**
 * 提供调试工具（目前仅是添加自定义装备）
 */
export function useDebug({ gameState, setGameState, addLog }: UseDebugParams) {
  const handleDebugAddItems = useCallback(
    (quality: string, slot: string, count: number, level?: number) => {
      const items: Equipment[] = [];
      const lv = Math.floor(level ?? gameState.playerStats.level);

      for (let i = 0; i < count; i += 1) {
        items.push(createCustomEquipment(quality, slot, lv));
      }

      setGameState((prev) => ({ ...prev, backpack: [...prev.backpack, ...items] }));
      addLog(`[Debug] Added ${count} ${quality} ${slot} items (Lv.${lv}) to backpack`);
    },
    [gameState.playerStats.level, setGameState, addLog],
  );

  return { handleDebugAddItems } as const;
}
