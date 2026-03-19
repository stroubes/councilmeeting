import { httpGet, httpPost } from './httpClient';
import type { ManagedUserRecord } from './types/admin.types';

export function listManagedUsers(): Promise<ManagedUserRecord[]> {
  return httpGet<ManagedUserRecord[]>('/users');
}

export function upsertManagedUser(payload: {
  microsoftOid: string;
  email: string;
  displayName: string;
  roles?: string[];
}): Promise<ManagedUserRecord> {
  return httpPost<ManagedUserRecord, typeof payload>('/users', payload);
}

export function assignManagedUserRole(userId: string, roleCode: string): Promise<ManagedUserRecord> {
  return httpPost<ManagedUserRecord, { roleCode: string }>(`/users/${userId}/roles`, { roleCode });
}
