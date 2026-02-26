import { createContext, useContext } from 'react';
import type { GameState } from '../../types/game';

export interface StateContextValue {
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

export const StateContext = createContext<StateContextValue | undefined>(undefined);

export function useStateContext(): StateContextValue {
  const ctx = useContext(StateContext);
  if (!ctx) {
    throw new Error('useStateContext must be used within a GameProvider');
  }
  return ctx;
}