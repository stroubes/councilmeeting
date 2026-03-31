import { httpGet, httpPatch, httpPost } from './httpClient';
import type { MinutesContent, MinutesRecord } from './types/minutes.types';

export function listMinutes(meetingId?: string, isInCamera?: boolean): Promise<MinutesRecord[]> {
  const params = new URLSearchParams();
  if (meetingId) params.set('meetingId', meetingId);
  if (isInCamera !== undefined) params.set('isInCamera', String(isInCamera));
  const query = params.toString() ? `?${params.toString()}` : '';
  return httpGet<MinutesRecord[]>(`/minutes${query}`);
}

export function createMinutes(payload: {
  meetingId: string;
  contentJson?: MinutesContent;
  isInCamera?: boolean;
}): Promise<MinutesRecord> {
  return httpPost<MinutesRecord, typeof payload>('/minutes', payload);
}

export function updateMinutes(minutesId: string, payload: { contentJson?: MinutesContent; richTextSummary?: Record<string, unknown>; note?: string }) {
  return httpPatch<MinutesRecord, typeof payload>(`/minutes/${minutesId}`, payload);
}

export function startMinutes(minutesId: string): Promise<MinutesRecord> {
  return httpPost<MinutesRecord>(`/minutes/${minutesId}/start`);
}

export function finalizeMinutes(minutesId: string): Promise<MinutesRecord> {
  return httpPost<MinutesRecord>(`/minutes/${minutesId}/finalize`);
}

export function adoptMinutes(minutesId: string): Promise<MinutesRecord> {
  return httpPost<MinutesRecord>(`/minutes/${minutesId}/adopt`);
}

export function publishMinutes(minutesId: string): Promise<MinutesRecord> {
  return httpPost<MinutesRecord>(`/minutes/${minutesId}/publish`);
}

export function autoPopulateMinutes(minutesId: string): Promise<MinutesRecord> {
  return httpPost<MinutesRecord>(`/minutes/${minutesId}/auto-populate`);
}

export function recordInCameraMinutes(meetingId: string): Promise<MinutesRecord> {
  return httpPost<MinutesRecord>(`/minutes/in-camera/${meetingId}`);
}
