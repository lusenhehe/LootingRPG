import { createContext, useContext } from 'react';
import type { SaveProfile } from '../../shared/types/game';
// AuthContext 负责管理用户认证状态和相关操作，如登录、登出、创建/删除角色等
// 设计原则：
// 1. 简单明了：提供清晰的接口，方便组件调用
// 2. 可扩展性：预留接口以便未来添加更多功能（如角色选择、权限管理等）
// 3. 与游戏逻辑解耦：专注于认证相关的状态和操作，不涉及具体的游戏数据结构
export interface AuthContextValue {
  profiles: SaveProfile[];
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