import { createContext, useContext } from 'react';

export interface MiscContextValue {
  handleReset: () => void;
}

export const MiscContext = createContext<MiscContextValue | undefined>(undefined);

export function useMiscContext(): MiscContextValue {
  const ctx = useContext(MiscContext);
  if (!ctx) {
    throw new Error('useMiscContext must be used within a GameProvider');
  }
  return ctx;
}