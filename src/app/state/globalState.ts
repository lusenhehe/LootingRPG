import { INITIAL_STATE } from '../../config/game/gameConfig';
import type { GameState } from '../../types/game';

/**
 * Creates a fresh initial game state for a new player
 */
export const createFreshInitialState = (): GameState => structuredClone(INITIAL_STATE);