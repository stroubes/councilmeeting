import { httpGet } from './httpClient';
import type { AuthenticatedUser } from '../types/auth.types';

export function fetchCurrentUser(): Promise<AuthenticatedUser> {
  return httpGet<AuthenticatedUser>('/auth/me');
}
