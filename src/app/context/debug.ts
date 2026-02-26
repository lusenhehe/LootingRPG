import { createContext, useContext } from 'react';

export interface DebugContextValue {
  handleDebugAddItems: (quality: string, slot: string, count: number, level?: number) => void;
}

export const DebugContext = createContext<DebugContextValue | undefined>(undefined);

export function useDebugContext(): DebugContextValue {
  const ctx = useContext(DebugContext);
  if (!ctx) {
    throw new Error('useDebugContext must be used within a GameProvider');
  }
  return ctx;
}