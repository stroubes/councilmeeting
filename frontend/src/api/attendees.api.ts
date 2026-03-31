import { httpDelete, httpGet, httpPatch, httpPost } from './httpClient';
import type { AttendeeRecord, CreateAttendeePayload, QuorumStatus, UpdateAttendeePayload } from './types/attendee.types';

export function listMeetingAttendees(meetingId: string): Promise<AttendeeRecord[]> {
  return httpGet<AttendeeRecord[]>(`/attendees/meeting/${meetingId}`);
}

export function getQuorumStatus(meetingId: string): Promise<QuorumStatus> {
  return httpGet<QuorumStatus>(`/attendees/meeting/${meetingId}/quorum`);
}

export function getAttendeeById(id: string): Promise<AttendeeRecord> {
  return httpGet<AttendeeRecord>(`/attendees/${id}`);
}

export function createAttendee(payload: CreateAttendeePayload): Promise<AttendeeRecord> {
  return httpPost<AttendeeRecord, CreateAttendeePayload>('/attendees', payload);
}

export function updateAttendee(id: string, payload: UpdateAttendeePayload): Promise<AttendeeRecord> {
  return httpPatch<AttendeeRecord, UpdateAttendeePayload>(`/attendees/${id}`, payload);
}

export function deleteAttendee(id: string): Promise<{ ok: true }> {
  return httpDelete<{ ok: true }>(`/attendees/${id}`);
}

export function recordArrival(meetingId: string, userId: string): Promise<AttendeeRecord> {
  return httpPost<AttendeeRecord, Record<string, never>>(`/attendees/meeting/${meetingId}/arrival/${userId}`, {});
}

export function recordDeparture(meetingId: string, userId: string): Promise<AttendeeRecord> {
  return httpPost<AttendeeRecord, Record<string, never>>(`/attendees/meeting/${meetingId}/departure/${userId}`, {});
}