import { httpGet, httpPatch, httpPost } from './httpClient';
import type { MinutesContent, MinutesRecord } from './types/minutes.types';

export function listMinutes(meetingId?: string): Promise<MinutesRecord[]> {
  const query = meetingId ? `?meetingId=${encodeURIComponent(meetingId)}` : '';
  return httpGet<MinutesRecord[]>(`/minutes${query}`);
}

export function createMinutes(payload: {
  meetingId: string;
  contentJson?: MinutesContent;
}): Promise<MinutesRecord> {
  return httpPost<MinutesRecord, typeof payload>('/minutes', payload);
}

export function updateMinutes(minutesId: string, payload: { contentJson?: MinutesContent; note?: string }) {
  return httpPatch<MinutesRecord, typeof payload>(`/minutes/${minutesId}`, payload);
}

export function startMinutes(minutesId: string): Promise<MinutesRecord> {
  return httpPost<MinutesRecord>(`/minutes/${minutesId}/start`);
}

export function finalizeMinutes(minutesId: string): Promise<MinutesRecord> {
  return httpPost<MinutesRecord>(`/minutes/${minutesId}/finalize`);
}

export function publishMinutes(minutesId: string): Promise<MinutesRecord> {
  return httpPost<MinutesRecord>(`/minutes/${minutesId}/publish`);
}
