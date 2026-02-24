import { createFreshInitialState } from './globalState';
import { createInitialBattleState } from './battleState';
import { normalizeInventory } from './inventoryState';
import type { GameState } from '../../types/game';

/**
 * Normalizes the entire game state, including inventory and equipment
 */
export const normalizeGameState = (state: GameState): GameState => {
  const { normalizedBackpack, normalizedCurrent } = normalizeInventory(state.backpack, state.currentEquipment);

  return {
    ...state,
    backpack: normalizedBackpack,
    currentEquipment: normalizedCurrent,
  };
};

// Re-export all state creation and management functions
export { createFreshInitialState } from './globalState';
export { createInitialBattleState } from './battleState';
export { normalizeInventory } from './inventoryState';

// Export the StateManager class
export { StateManager } from './stateManager';