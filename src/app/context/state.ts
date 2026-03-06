import { createContext, useContext } from 'react';
import type { GameState } from '../../shared/types/game';
import type { GameStateAction } from '../state/actions';

export interface StateContextValue {
  gameState: GameState;
  dispatchGameState: React.Dispatch<GameStateAction>;
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

export const StateContext = createContext<StateContextValue | undefined>(undefined);

export function useStateContext(): StateContextValue {
  const ctx = useContext(StateContext);
  if (!ctx) {
    throw new Error('useStateContext must be used within a GameProvider');
  }
  return ctx;
}