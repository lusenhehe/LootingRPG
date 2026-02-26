import { createContext, useContext } from 'react';

export interface AutoSellContextValue {
  autoSellQualities: Record<string, boolean>;
  handleToggleAutoSellQuality: (quality: string) => void;
  setAutoSellQualities: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export const AutoSellContext = createContext<AutoSellContextValue | undefined>(undefined);

export function useAutoSellContext(): AutoSellContextValue {
  const ctx = useContext(AutoSellContext);
  if (!ctx) {
    throw new Error('useAutoSellContext must be used within a GameProvider');
  }
  return ctx;
}