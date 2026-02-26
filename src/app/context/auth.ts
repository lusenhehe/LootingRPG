import { createContext, useContext } from 'react';

export interface AuthContextValue {
  profiles: any[];
  activeProfileId: string | null;
  isAuthenticated: boolean;
  handleLogin: (id: string) => void;
  handleCreateProfile: (name: string) => void;
  handleDeleteProfile: (id: string) => void;
  handleExportSave: () => void;
  handleImportSave: () => void;
  handleLogoutAction: () => void;
  loadProfile: (id: string) => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used within a GameProvider');
  }
  return ctx;
}