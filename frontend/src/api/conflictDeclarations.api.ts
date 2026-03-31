import { httpDelete, httpGet, httpPatch, httpPost } from './httpClient';
import type { ConflictDeclarationRecord } from './types/conflict-declaration.types';

export function listConflictDeclarationsByMeeting(meetingId: string): Promise<ConflictDeclarationRecord[]> {
  return httpGet<ConflictDeclarationRecord[]>(`/conflict-declarations/meeting/${meetingId}`);
}

export function createConflictDeclaration(payload: {
  meetingId: string;
  agendaItemId?: string;
  userId: string;
  reason?: string;
}): Promise<ConflictDeclarationRecord> {
  return httpPost<ConflictDeclarationRecord, typeof payload>('/conflict-declarations', payload);
}

export function updateConflictDeclaration(
  declarationId: string,
  payload: { reason?: string },
): Promise<ConflictDeclarationRecord> {
  return httpPatch<ConflictDeclarationRecord, typeof payload>(`/conflict-declarations/${declarationId}`, payload);
}

export function deleteConflictDeclaration(declarationId: string): Promise<{ ok: true }> {
  return httpDelete<{ ok: true }>(`/conflict-declarations/${declarationId}`);
}
