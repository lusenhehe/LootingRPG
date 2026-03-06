import type { GameState } from '../../../shared/types/game';
import type { GameStateAction } from '../actions';

const BATTLE_ACTIONS = new Set<GameStateAction['type']>([
  'BATTLE/START',
  'BATTLE/UPDATE',
  'BATTLE/RETREAT',
  'BATTLE/CLOSE_RESULT',
]);

export function reduceBattleSlice(state: GameState, action: GameStateAction): GameState {
  if (BATTLE_ACTIONS.has(action.type) && 'payload' in action) {
    return action.payload;
  }
  return state;
}
