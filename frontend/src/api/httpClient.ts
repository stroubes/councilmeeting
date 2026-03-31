import { getAccessToken, getCsrfToken, getBypassUser, isDevBypassEnabled } from '../auth/tokenStorage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';
const AUTH_BYPASS_ENABLED = import.meta.env.VITE_AUTH_BYPASS === 'true';

function authHeaders(): Record<string, string> {
  const token = getAccessToken();
  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

function bypassHeaders(): Record<string, string> {
  if (!AUTH_BYPASS_ENABLED || !isDevBypassEnabled()) {
    return {};
  }

  const user = getBypassUser();
  const headers: Record<string, string> = {
    'X-Dev-Bypass': 'true',
  };

  if (user) {
    headers['X-Dev-User-Oid'] = user.oid;
    headers['X-Dev-User-Email'] = user.email;
    headers['X-Dev-User-Name'] = user.displayName;
    headers['X-Dev-Roles'] = user.roles.join(',');
    headers['X-Dev-Permissions'] = user.permissions.join(',');
  }

  return headers;
}

export async function httpGet<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, requestInit('GET'));

  if (!response.ok) {
    throw await toHttpError(response);
  }

  return (await parseJsonResponse<T>(response)) as T;
}

export async function httpPost<T, B = unknown>(path: string, body?: B): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, requestInit('POST', body));

  if (!response.ok) {
    throw await toHttpError(response);
  }

  return (await parseJsonResponse<T>(response)) as T;
}

export async function httpPatch<T, B = unknown>(path: string, body?: B): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, requestInit('PATCH', body));

  if (!response.ok) {
    throw await toHttpError(response);
  }

  return (await parseJsonResponse<T>(response)) as T;
}

export async function httpDelete<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, requestInit('DELETE'));

  if (!response.ok) {
    throw await toHttpError(response);
  }

  return (await parseJsonResponse<T>(response)) as T;
}

async function parseJsonResponse<T>(response: Response): Promise<T | null> {
  if (response.status === 204) {
    return null;
  }

  const raw = await response.text();
  if (!raw.trim()) {
    return null;
  }

  return JSON.parse(raw) as T;
}

async function toHttpError(response: Response): Promise<Error> {
  let message = `Request failed: ${response.status}`;

  try {
    const body = (await response.json()) as { message?: string | string[]; issues?: string[] };
    if (Array.isArray(body.issues) && body.issues.length > 0) {
      message = body.issues.join(' ');
    } else if (Array.isArray(body.message)) {
      message = body.message.join(' ');
    } else if (typeof body.message === 'string' && body.message.trim()) {
      message = body.message;
    }
  } catch {
    // ignore parse issues and return generic status
  }

  return new Error(message);
}

function requestInit(method: 'GET' | 'POST' | 'PATCH' | 'DELETE', body?: unknown): RequestInit {
  const headers: Record<string, string> = {
    ...authHeaders(),
    ...bypassHeaders(),
  };

  if (method !== 'GET') {
    headers['X-CMMS-CSRF'] = getCsrfToken();
  }

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  return {
    method,
    credentials: 'omit',
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  };
}
