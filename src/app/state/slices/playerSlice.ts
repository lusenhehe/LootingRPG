import type { GameState } from '../../../shared/types/game';
import type { GameStateAction } from '../actions';

/**
 * 预留：未来 PLAYER/GRANT_XP 等动作会在这里做纯函数变更。
 * 当前版本中玩家变化已通过 INVENTORY/BATTLE 等 payload 写回。
 */
export function reducePlayerSlice(state: GameState, _action: GameStateAction): GameState {
  return state;
}
