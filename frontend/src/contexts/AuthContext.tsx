import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { TOKEN_KEY } from '../lib/api';
import { authApi } from '../lib/endpoints';
import type { UserResponse, BusinessResponse } from '../types';

interface AuthContextValue {
  user: UserResponse | null;
  business: BusinessResponse | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    email: string;
    password: string;
    full_name: string;
    business_name: string;
    industry?: string;
  }) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [business, setBusiness] = useState<BusinessResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function refreshMe() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setUser(null);
      setBusiness(null);
      setIsLoading(false);
      return;
    }
    try {
      const me = await authApi.me();
      setUser(me.user);
      setBusiness(me.business);
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
      setBusiness(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    refreshMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function login(email: string, password: string) {
    const res = await authApi.login({ email, password });
    localStorage.setItem(TOKEN_KEY, res.access_token);
    await refreshMe();
  }

  async function register(payload: {
    email: string;
    password: string;
    full_name: string;
    business_name: string;
    industry?: string;
  }) {
    const res = await authApi.register(payload);
    localStorage.setItem(TOKEN_KEY, res.access_token);
    await refreshMe();
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setBusiness(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, business, isLoading, isAuthenticated: !!user, login, register, logout, refreshMe }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
