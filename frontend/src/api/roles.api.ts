import { httpGet } from './httpClient';
import type { SystemRoleRecord } from './types/admin.types';

export function listSystemRoles(): Promise<SystemRoleRecord[]> {
  return httpGet<SystemRoleRecord[]>('/roles');
}
