import { httpDelete, httpGet, httpPatch, httpPost } from './httpClient';
import type { CreateMeetingPayload, MeetingPageResult, MeetingRecord } from './types/meeting.types';

export function listMeetings(params?: { inCamera?: boolean }): Promise<MeetingRecord[]> {
  const query = params?.inCamera ? '?inCamera=true' : '';
  return httpGet<MeetingRecord[]>(`/meetings${query}`);
}

export function listMeetingsPaged(params: {
  q?: string;
  status?: MeetingRecord['status'] | 'ALL';
  sortField?: 'title' | 'startsAt' | 'status';
  sortDirection?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
  inCamera?: boolean;
}): Promise<MeetingPageResult> {
  const query = new URLSearchParams();

  if (params.q && params.q.trim()) {
    query.set('q', params.q.trim());
  }
  if (params.status && params.status !== 'ALL') {
    query.set('status', params.status);
  }
  if (params.sortField) {
    query.set('sortField', params.sortField);
  }
  if (params.sortDirection) {
    query.set('sortDirection', params.sortDirection);
  }
  if (params.page) {
    query.set('page', String(params.page));
  }
  if (params.pageSize) {
    query.set('pageSize', String(params.pageSize));
  }
  if (params.inCamera) {
    query.set('inCamera', 'true');
  }

  const queryString = query.toString();
  return httpGet<MeetingPageResult>(`/meetings/paged${queryString ? `?${queryString}` : ''}`);
}

export function listPublicMeetings(): Promise<MeetingRecord[]> {
  return httpGet<MeetingRecord[]>('/meetings/public');
}

export function getMeetingById(meetingId: string): Promise<MeetingRecord> {
  return httpGet<MeetingRecord>(`/meetings/${meetingId}`);
}

export function createMeeting(payload: CreateMeetingPayload): Promise<MeetingRecord> {
  return httpPost<MeetingRecord, CreateMeetingPayload>('/meetings', payload);
}

export function updateMeeting(
  meetingId: string,
  payload: Partial<CreateMeetingPayload>,
): Promise<MeetingRecord> {
  return httpPatch<MeetingRecord, Partial<CreateMeetingPayload>>(`/meetings/${meetingId}`, payload);
}

export function deleteMeeting(meetingId: string): Promise<{ ok: true }> {
  return httpDelete<{ ok: true }>(`/meetings/${meetingId}`);
}
