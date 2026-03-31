import { httpDelete, httpGet, httpPatch, httpPost } from './httpClient';
import type { ResolutionRecord } from './types/resolution.types';

export function listResolutions(meetingId?: string): Promise<ResolutionRecord[]> {
  const query = meetingId ? `?meetingId=${encodeURIComponent(meetingId)}` : '';
  return httpGet<ResolutionRecord[]>(`/resolutions${query}`);
}

export function createResolution(payload: Partial<ResolutionRecord> & { meetingId: string; resolutionNumber: string; title: string; body: string }): Promise<ResolutionRecord> {
  return httpPost<ResolutionRecord, typeof payload>('/resolutions', payload);
}

export function updateResolution(id: string, payload: Partial<ResolutionRecord>): Promise<ResolutionRecord> {
  return httpPatch<ResolutionRecord, Partial<ResolutionRecord>>(`/resolutions/${id}`, payload);
}

export function deleteResolution(id: string): Promise<{ ok: true }> {
  return httpDelete<{ ok: true }>(`/resolutions/${id}`);
}

export function exportResolutionSheet(meetingId: string): Promise<{ meetingId: string; generatedAt: string; rows: ResolutionRecord[]; sheet: string }> {
  return httpGet(`/resolutions/meeting/${meetingId}/export-sheet`);
}
