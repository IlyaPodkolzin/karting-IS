import { useState, useCallback, createContext, useContext } from 'react';
import { authApi } from '@/api/auth';
import type { User } from '@/types';

export interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => void;
  /** Update the stored user (e.g. after avatar upload or profile save) */
  updateUser: (updated: User) => void;
}

function getStoredUser(): User | null {
  try {
    const s = localStorage.getItem('user');
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}

export function useAuthState(): AuthContextValue {
  const [user, setUser] = useState<User | null>(getStoredUser);

  const _persist = useCallback((u: User) => {
    localStorage.setItem('user', JSON.stringify(u));
    setUser(u);
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    const data = await authApi.login(email, password);
    localStorage.setItem('access_token', data.access_token);
    _persist(data.user);
    return data.user;
  }, [_persist]);

  const register = useCallback(async (name: string, email: string, password: string): Promise<User> => {
    const data = await authApi.register(name, email, password);
    localStorage.setItem('access_token', data.access_token);
    _persist(data.user);
    return data.user;
  }, [_persist]);

  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  /**
   * Call this after any mutation (avatar upload, name change).
   * Writes to localStorage AND re-renders all consumers of AuthContext.
   */
  const updateUser = useCallback((updated: User) => {
    _persist(updated);
  }, [_persist]);

  return { user, login, register, logout, updateUser };
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
