import { createFreshInitialState } from './globalState';
import { createInitialBattleState } from './battleState';
import { normalizeInventory } from './inventoryState';
import type { GameState } from '../../types/game';

/**
 * Normalizes the entire game state, including inventory and equipment
 */
export const normalizeGameState = (state: GameState): GameState => {
  const { normalizedBackpack, normalizedCurrent } = normalizeInventory(state.背包, state.当前装备);

  return {
    ...state,
    背包: normalizedBackpack,
    当前装备: normalizedCurrent,
  };
};

// Re-export all state creation and management functions
export { createFreshInitialState } from './globalState';
export { createInitialBattleState } from './battleState';
export { normalizeInventory } from './inventoryState';

// Export the StateManager class
export { StateManager } from './stateManager';