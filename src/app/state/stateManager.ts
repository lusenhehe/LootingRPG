import { createFreshInitialState, normalizeGameState } from './index';
import type { GameState } from '../../types/game';

/**
 * State Manager - Unified interface for all game state operations
 * This provides a single entry point for state creation and management
 * to prevent the gameState.ts from becoming a God Object.
 */
export class StateManager {
  /**
   * Creates a complete fresh game state including player and inventory state
   */
  static createFreshGameState(): GameState {
    return createFreshInitialState();
  }

  /**
   * Normalizes game state data (e.g., after loading from save)
   */
  static normalizeState(state: GameState): GameState {
    return normalizeGameState(state);
  }
}

// Re-export for convenience
export { createFreshInitialState, normalizeGameState } from './index';