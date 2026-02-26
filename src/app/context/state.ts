import type { GameState } from '../../types/game';

export interface StateContext {
  gameState: GameState;
  dispatchGameState: React.Dispatch<
    | { type: 'RESET' }
    | { type: 'SET'; payload: GameState }
  >;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  forgeSelectedId: string | null;
  setForgeSelectedId: React.Dispatch<React.SetStateAction<string | null>>;
}