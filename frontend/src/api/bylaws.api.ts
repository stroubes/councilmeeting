import { httpDelete, httpGet, httpPatch, httpPost } from './httpClient';
import type { BylawRecord, CreateBylawPayload, UpdateBylawPayload } from './types/bylaw.types';

export function listBylaws(status?: 'ACTIVE'): Promise<BylawRecord[]> {
  return httpGet<BylawRecord[]>(`/bylaws${status ? `?status=${status}` : ''}`);
}

export function getBylawById(id: string): Promise<BylawRecord> {
  return httpGet<BylawRecord>(`/bylaws/${id}`);
}

export function getBylawByNumber(bylawNumber: string): Promise<BylawRecord> {
  return httpGet<BylawRecord>(`/bylaws/number/${bylawNumber}`);
}

export function createBylaw(payload: CreateBylawPayload): Promise<BylawRecord> {
  return httpPost<BylawRecord, CreateBylawPayload>('/bylaws', payload);
}

export function updateBylaw(id: string, payload: UpdateBylawPayload): Promise<BylawRecord> {
  return httpPatch<BylawRecord, UpdateBylawPayload>(`/bylaws/${id}`, payload);
}

export function amendBylaw(id: string, payload: UpdateBylawPayload): Promise<BylawRecord> {
  return httpPost<BylawRecord, UpdateBylawPayload>(`/bylaws/${id}/amend`, payload);
}

export function repealBylaw(id: string, meetingId: string): Promise<BylawRecord> {
  return httpPost<BylawRecord, { meetingId: string }>(`/bylaws/${id}/repeal`, { meetingId });
}

export function deleteBylaw(id: string): Promise<{ ok: true }> {
  return httpDelete<{ ok: true }>(`/bylaws/${id}`);
}
