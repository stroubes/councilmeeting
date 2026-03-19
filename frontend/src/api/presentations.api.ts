import { httpDelete, httpGet, httpPost } from './httpClient';
import type { CreatePresentationPayload, PresentationRecord } from './types/presentation.types';

export function listPresentations(meetingId?: string): Promise<PresentationRecord[]> {
  if (!meetingId) {
    return httpGet<PresentationRecord[]>('/presentations');
  }
  return httpGet<PresentationRecord[]>(`/presentations?meetingId=${encodeURIComponent(meetingId)}`);
}

export function createPresentation(payload: CreatePresentationPayload): Promise<PresentationRecord> {
  return httpPost<PresentationRecord, CreatePresentationPayload>('/presentations', payload);
}

export function deletePresentation(presentationId: string): Promise<{ ok: true }> {
  return httpDelete<{ ok: true }>(`/presentations/${presentationId}`);
}
