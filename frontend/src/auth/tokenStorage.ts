const TOKEN_KEY = 'cmms.access_token';
const DEV_BYPASS_KEY = 'cmms.dev_bypass';
const DEV_BYPASS_USER_KEY = 'cmms.dev_bypass_user';
const CSRF_KEY = 'cmms.csrf';

export function getAccessToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAccessToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function enableDevBypass(): void {
  localStorage.setItem(DEV_BYPASS_KEY, 'true');
}

export function disableDevBypass(): void {
  localStorage.removeItem(DEV_BYPASS_KEY);
  localStorage.removeItem(DEV_BYPASS_USER_KEY);
}

export function isDevBypassEnabled(): boolean {
  return localStorage.getItem(DEV_BYPASS_KEY) === 'true';
}

export interface BypassUser {
  oid: string;
  email: string;
  displayName: string;
  roles: string[];
  permissions: string[];
}

export function getBypassUser(): BypassUser | null {
  const raw = localStorage.getItem(DEV_BYPASS_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as BypassUser;
  } catch {
    return null;
  }
}

export function setBypassUser(user: BypassUser): void {
  localStorage.setItem(DEV_BYPASS_USER_KEY, JSON.stringify(user));
}

export function getCsrfToken(): string {
  const existing = sessionStorage.getItem(CSRF_KEY);
  if (existing && existing.length >= 16) {
    return existing;
  }

  const token = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  sessionStorage.setItem(CSRF_KEY, token);
  return token;
}
