import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../api/client.ts';
import { User } from '../types/index.ts';

interface PermissionActionMap {
  view: boolean;
  add: boolean;
  edit: boolean;
  delete: boolean;
}

interface AuthContextType {
  user: User | null;
  permissions: Record<string, PermissionActionMap>;
  isAuthenticated: boolean;
  isInitializing: boolean;
  isSystemInitialized: boolean | null;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  logout: () => void;
  hasPermission: (moduleKey: string, action: 'view' | 'add' | 'edit' | 'delete') => boolean;
  refreshUserProfile: () => Promise<void>;
  checkSetupStatus: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  permissions: {},
  isAuthenticated: false,
  isInitializing: true,
  isSystemInitialized: null,
  login: async () => {},
  logout: () => {},
  hasPermission: () => false,
  refreshUserProfile: async () => {},
  checkSetupStatus: async () => true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Record<string, PermissionActionMap>>({});
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSystemInitialized, setIsSystemInitialized] = useState<boolean | null>(null);

  const checkSetupStatus = useCallback(async (): Promise<boolean> => {
    try {
      const res = await api.get<{ isInitialized: boolean }>('/system/setup-status');
      const initialized = Boolean(res.data?.isInitialized);
      setIsSystemInitialized(initialized);
      return initialized;
    } catch {
      setIsSystemInitialized(true);
      return true;
    }
  }, []);

  const refreshUserProfile = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setUser(null);
      setPermissions({});
      setIsInitializing(false);
      return;
    }

    try {
      const res = await api.get<{ user: User; permissions: Record<string, PermissionActionMap> }>('/auth/me');
      if (res.data) {
        setUser(res.data.user);
        setPermissions(res.data.permissions || {});
      }
    } catch {
      api.clearTokens();
      setUser(null);
      setPermissions({});
    } finally {
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      const isSetup = await checkSetupStatus();
      if (isSetup) {
        await refreshUserProfile();
      } else {
        setIsInitializing(false);
      }
    };

    init();

    const handleExpired = () => {
      setUser(null);
      setPermissions({});
    };

    window.addEventListener('auth:expired', handleExpired);
    return () => window.removeEventListener('auth:expired', handleExpired);
  }, [checkSetupStatus, refreshUserProfile]);

  const login = async (emailOrUsername: string, password: string) => {
    const res = await api.post('/auth/login', { emailOrUsername, password });
    if (res.data) {
      api.setTokens(res.data.accessToken, res.data.refreshToken);
      setUser(res.data.user);
      setPermissions(res.data.permissions || {});
    }
  };

  const logout = () => {
    api.post('/auth/logout').catch(() => {});
    api.clearTokens();
    setUser(null);
    setPermissions({});
  };

  const hasPermission = (moduleKey: string, action: 'view' | 'add' | 'edit' | 'delete'): boolean => {
    if (!user) return false;
    if (user.roleSlug === 'admin') return true;

    const modulePerms = permissions[moduleKey];
    if (!modulePerms) return false;

    return Boolean(modulePerms[action]);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        permissions,
        isAuthenticated: Boolean(user),
        isInitializing,
        isSystemInitialized,
        login,
        logout,
        hasPermission,
        refreshUserProfile,
        checkSetupStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
