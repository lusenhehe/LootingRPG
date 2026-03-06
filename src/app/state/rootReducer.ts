import type { GameState } from '../../shared/types/game';
import type { GameStateAction } from './actions';
import { createFreshInitialState } from './globalState';
import { reduceInventorySlice } from './slices/inventorySlice';
import { reduceBattleSlice } from './slices/battleSlice';
import { reducePlayerSlice } from './slices/playerSlice';

function applyPayload(state: GameState, action: GameStateAction): GameState {
  if (
    (action.type === 'SET' ||
      action.type === 'LOAD_SAVE' ||
      action.type === 'SYSTEM/RESET_SAVE') &&
    'payload' in action
  ) {
    return action.payload;
  }
  return state;
}

/**
 * rootReducer：按系统 -> inventory -> battle -> player 顺序组合。
 */
export function rootReducer(state: GameState, action: GameStateAction): GameState {
  if (action.type === 'RESET') {
    return createFreshInitialState();
  }

  let next = applyPayload(state, action);
  next = reduceInventorySlice(next, action);
  next = reduceBattleSlice(next, action);
  next = reducePlayerSlice(next, action);

  return next;
}
