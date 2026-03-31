import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { fetchCurrentUser } from '../api/auth.api';
import {
  clearAccessToken,
  disableDevBypass,
  enableDevBypass,
  getAccessToken,
  isDevBypassEnabled,
  setAccessToken,
} from '../auth/tokenStorage';
import { loginWithMicrosoft, logoutMicrosoft } from '../auth/msalClient';
import type { AuthenticatedUser } from '../types/auth.types';

interface AuthContextValue {
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  loginBypass: () => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const authBypassEnabled = import.meta.env.VITE_AUTH_BYPASS === 'true';
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async (): Promise<void> => {
    const token = getAccessToken();
    const bypassEnabled = authBypassEnabled && isDevBypassEnabled();

    if (!token && !bypassEnabled) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const me = await fetchCurrentUser();
      setUser(me);
    } catch {
      clearAccessToken();
      disableDevBypass();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [authBypassEnabled]);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    const token = await loginWithMicrosoft();
    setAccessToken(token);
    disableDevBypass();
    await refreshUser();
  }, [refreshUser]);

  const loginBypass = useCallback(async (): Promise<void> => {
    if (!authBypassEnabled) {
      throw new Error('Auth bypass is disabled');
    }
    setIsLoading(true);
    clearAccessToken();
    enableDevBypass();
    await refreshUser();
  }, [authBypassEnabled, refreshUser]);

  const logout = useCallback(async (): Promise<void> => {
    const token = getAccessToken();
    if (token) {
      await logoutMicrosoft();
    }
    clearAccessToken();
    disableDevBypass();
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      loginBypass,
      logout,
    }),
    [user, isLoading, login, loginBypass, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
