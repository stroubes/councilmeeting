import { httpDelete, httpGet, httpPatch, httpPost } from './httpClient';
import type {
  CreateMeetingTypePayload,
  MeetingTypeRecord,
  UpdateMeetingTypePayload,
} from './types/meeting-type.types';

export function listMeetingTypes(params?: { includeInactive?: boolean }): Promise<MeetingTypeRecord[]> {
  const query = params?.includeInactive ? '?includeInactive=true' : '';
  return httpGet<MeetingTypeRecord[]>(`/meeting-types${query}`);
}

export function createMeetingType(payload: CreateMeetingTypePayload): Promise<MeetingTypeRecord> {
  return httpPost<MeetingTypeRecord, CreateMeetingTypePayload>('/meeting-types', payload);
}

export function getMeetingType(meetingTypeId: string): Promise<MeetingTypeRecord> {
  return httpGet<MeetingTypeRecord>(`/meeting-types/${meetingTypeId}`);
}

export function updateMeetingType(
  meetingTypeId: string,
  payload: UpdateMeetingTypePayload,
): Promise<MeetingTypeRecord> {
  return httpPatch<MeetingTypeRecord, UpdateMeetingTypePayload>(`/meeting-types/${meetingTypeId}`, payload);
}

export function deleteMeetingType(meetingTypeId: string): Promise<{ ok: true }> {
  return httpDelete<{ ok: true }>(`/meeting-types/${meetingTypeId}`);
}
