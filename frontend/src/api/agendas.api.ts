import { httpDelete, httpGet, httpPost } from './httpClient';
import type { AgendaItemRecord, AgendaRecord } from './types/agenda.types';
import type { PaginatedResponse } from './types/pagination.types';

interface CreateAgendaPayload {
  meetingId: string;
  title: string;
  templateId?: string;
}

interface CreateAgendaItemPayload {
  itemType: string;
  title: string;
  description?: string;
  parentItemId?: string;
  isInCamera?: boolean;
  isPublicVisible?: boolean;
  publishAt?: string;
  redactionNote?: string;
  carryForwardToNext?: boolean;
  bylawId?: string;
}

interface RejectAgendaPayload {
  reason: string;
}

export function listAgendas(meetingId?: string): Promise<AgendaRecord[]> {
  const query = meetingId ? `?meetingId=${encodeURIComponent(meetingId)}` : '';
  return httpGet<AgendaRecord[]>(`/agendas${query}`);
}

export function listAgendasPaged(params?: {
  meetingId?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<AgendaRecord>> {
  const query = new URLSearchParams();
  if (params?.meetingId) {
    query.set('meetingId', params.meetingId);
  }
  if (params?.page) {
    query.set('page', String(params.page));
  }
  if (params?.limit) {
    query.set('limit', String(params.limit));
  }
  const queryString = query.toString();
  return httpGet<PaginatedResponse<AgendaRecord>>(`/agendas/paged${queryString ? `?${queryString}` : ''}`);
}

export function createAgenda(payload: CreateAgendaPayload): Promise<AgendaRecord> {
  return httpPost<AgendaRecord, CreateAgendaPayload>('/agendas', payload);
}

export function submitAgendaForDirector(agendaId: string): Promise<AgendaRecord> {
  return httpPost<AgendaRecord>(`/agendas/${agendaId}/submit-director`);
}

export function approveAgendaByDirector(agendaId: string): Promise<AgendaRecord> {
  return httpPost<AgendaRecord>(`/agendas/${agendaId}/approve-director`);
}

export function approveAgendaByCao(agendaId: string): Promise<AgendaRecord> {
  return httpPost<AgendaRecord>(`/agendas/${agendaId}/approve-cao`);
}

export function rejectAgenda(agendaId: string, payload: RejectAgendaPayload): Promise<AgendaRecord> {
  return httpPost<AgendaRecord, RejectAgendaPayload>(`/agendas/${agendaId}/reject`, payload);
}

export function publishAgenda(agendaId: string): Promise<AgendaRecord> {
  return httpPost<AgendaRecord>(`/agendas/${agendaId}/publish`);
}

export function addAgendaItem(
  agendaId: string,
  payload: CreateAgendaItemPayload,
): Promise<AgendaRecord> {
  return httpPost<AgendaRecord, CreateAgendaItemPayload>(`/agendas/${agendaId}/items`, payload);
}

export function deleteAgendaItem(agendaId: string, itemId: string): Promise<AgendaRecord> {
  return httpDelete<AgendaRecord>(`/agendas/${agendaId}/items/${itemId}`);
}

export function deleteAgenda(agendaId: string): Promise<{ ok: true }> {
  return httpDelete<{ ok: true }>(`/agendas/${agendaId}`);
}

export function carryForwardAgendaItems(sourceAgendaId: string, targetAgendaId: string): Promise<AgendaRecord> {
  return httpPost<AgendaRecord>(`/agendas/${sourceAgendaId}/carry-forward/${targetAgendaId}`);
}

export function reorderAgendaItems(agendaId: string, itemIdsInOrder: string[]): Promise<AgendaRecord> {
  return httpPost<AgendaRecord, { itemIdsInOrder: string[] }>(`/agendas/${agendaId}/items/reorder`, {
    itemIdsInOrder,
  });
}

export function runAgendaBulkAction(payload: { agendaIds: string[]; action: 'SUBMIT' | 'PUBLISH'; reason?: string }) {
  return httpPost<{ requested: number; succeeded: number; failed: Array<{ agendaId: string; reason: string }> }, typeof payload>(
    '/agendas/bulk-action',
    payload,
  );
}

export function runAgendaScheduledSweep() {
  return httpPost<{ scanned: number; published: number; runAt: string }>('/agendas/scheduled/sweep');
}

export function getAgendaVersionHistory(agendaId: string): Promise<unknown[]> {
  return httpGet<unknown[]>(`/agendas/${agendaId}/version-history`);
}

export type { CreateAgendaItemPayload, AgendaItemRecord };
