import { createContext, useContext } from 'react';

export interface LogContextValue {
  logs: string[];
  addLog: (msg: string) => void;
  setLogs: React.Dispatch<React.SetStateAction<string[]>>;
}

export const LogContext = createContext<LogContextValue | undefined>(undefined);

export function useLogContext(): LogContextValue {
  const ctx = useContext(LogContext);
  if (!ctx) {
    throw new Error('useLogContext must be used within a GameProvider');
  }
  return ctx;
}