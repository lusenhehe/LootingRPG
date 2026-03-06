import type { GameState } from '../../../shared/types/game';
import type { GameStateAction } from '../actions';

const INVENTORY_ACTIONS = new Set<GameStateAction['type']>([
  'INVENTORY/APPLY',
  'INVENTORY/QUICK_SELL',
  'DEBUG/ADD_ITEMS',
]);

export function reduceInventorySlice(state: GameState, action: GameStateAction): GameState {
  if (INVENTORY_ACTIONS.has(action.type) && 'payload' in action) {
    return action.payload;
  }
  return state;
}
