import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { fetchCurrentUser } from '../api/auth.api';
import { clearAccessToken, getAccessToken, setAccessToken } from '../auth/tokenStorage';
import { loginWithMicrosoft, logoutMicrosoft } from '../auth/msalClient';
import type { AuthenticatedUser } from '../types/auth.types';

const DEV_BYPASS_TOKEN = 'dev-bypass-token';

const DEV_BYPASS_USER: AuthenticatedUser = {
  id: 'dev-bypass-user',
  microsoftOid: 'dev-bypass-user',
  email: 'dev.user@municipality.local',
  displayName: 'Local Dev User',
  roles: ['ADMIN'],
  permissions: [
    'meeting.read',
    'meeting.read.in_camera',
    'meeting.write',
    'agenda.write',
    'agenda.publish',
    'report.submit',
    'report.approve.director',
    'report.approve.cao',
    'users.manage',
    'roles.manage',
    'minutes.write',
    'minutes.publish',
    'vote.record',
    'public.publish',
  ],
};

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
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    if (authBypassEnabled && token === DEV_BYPASS_TOKEN) {
      setUser(DEV_BYPASS_USER);
      setIsLoading(false);
      return;
    }

    try {
      const me = await fetchCurrentUser();
      setUser(me);
    } catch {
      clearAccessToken();
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
    await refreshUser();
  }, [refreshUser]);

  const loginBypass = useCallback(async (): Promise<void> => {
    if (!authBypassEnabled) {
      throw new Error('Auth bypass is disabled');
    }
    setIsLoading(true);
    setAccessToken(DEV_BYPASS_TOKEN);
    setUser(DEV_BYPASS_USER);
    setIsLoading(false);
  }, [authBypassEnabled]);

  const logout = useCallback(async (): Promise<void> => {
    const token = getAccessToken();
    if (token && token !== DEV_BYPASS_TOKEN) {
      await logoutMicrosoft();
    }
    clearAccessToken();
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
