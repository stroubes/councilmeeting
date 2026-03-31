import { httpDelete, httpGet, httpPatch, httpPost } from './httpClient';
import type { ActionItemRecord } from './types/action.types';

export function listActionItems(params?: { status?: string; ownerUserId?: string }): Promise<ActionItemRecord[]> {
  const query = new URLSearchParams();
  if (params?.status) {
    query.set('status', params.status);
  }
  if (params?.ownerUserId) {
    query.set('ownerUserId', params.ownerUserId);
  }
  const queryString = query.toString();
  return httpGet<ActionItemRecord[]>(`/actions${queryString ? `?${queryString}` : ''}`);
}

export function getActionDashboard(): Promise<{ open: number; inProgress: number; blocked: number; overdue: number; completed: number }> {
  return httpGet('/actions/dashboard');
}

export function createActionItem(payload: Partial<ActionItemRecord> & { title: string }): Promise<ActionItemRecord> {
  return httpPost<ActionItemRecord, typeof payload>('/actions', payload);
}

export function updateActionItem(id: string, payload: Partial<ActionItemRecord>): Promise<ActionItemRecord> {
  return httpPatch<ActionItemRecord, Partial<ActionItemRecord>>(`/actions/${id}`, payload);
}

export function deleteActionItem(id: string): Promise<{ ok: true }> {
  return httpDelete<{ ok: true }>(`/actions/${id}`);
}
