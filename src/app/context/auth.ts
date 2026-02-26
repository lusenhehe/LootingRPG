export interface AuthContext {
  profiles: any[]; // same as result from useProfileSave
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