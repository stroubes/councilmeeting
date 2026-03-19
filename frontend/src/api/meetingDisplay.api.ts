import { httpGet, httpPost } from './httpClient';
import type { MeetingDisplayState } from './types/meeting-display.types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export function getMeetingDisplayState(meetingId: string): Promise<MeetingDisplayState> {
  return httpGet<MeetingDisplayState>(`/meeting-display?meetingId=${encodeURIComponent(meetingId)}`);
}

export function getPublicMeetingDisplayState(meetingId: string): Promise<MeetingDisplayState> {
  return httpGet<MeetingDisplayState>(`/meeting-display/public/state?meetingId=${encodeURIComponent(meetingId)}`);
}

export function setLiveAgendaItem(meetingId: string, agendaItemId: string): Promise<MeetingDisplayState> {
  return httpPost<MeetingDisplayState, { agendaItemId: string }>(`/meeting-display/${meetingId}/set-agenda-item`, {
    agendaItemId,
  });
}

export function showAgendaDisplay(meetingId: string): Promise<MeetingDisplayState> {
  return httpPost<MeetingDisplayState>(`/meeting-display/${meetingId}/show-agenda`);
}

export function showMotionDisplay(meetingId: string): Promise<MeetingDisplayState> {
  return httpPost<MeetingDisplayState>(`/meeting-display/${meetingId}/show-motion`);
}

export function nextAgendaDisplayItem(meetingId: string): Promise<MeetingDisplayState> {
  return httpPost<MeetingDisplayState>(`/meeting-display/${meetingId}/next`);
}

export function previousAgendaDisplayItem(meetingId: string): Promise<MeetingDisplayState> {
  return httpPost<MeetingDisplayState>(`/meeting-display/${meetingId}/previous`);
}

export function setLivePresentation(meetingId: string, presentationId: string): Promise<MeetingDisplayState> {
  return httpPost<MeetingDisplayState, { presentationId: string }>(`/meeting-display/${meetingId}/set-presentation`, {
    presentationId,
  });
}

export function showPresentationDisplay(meetingId: string): Promise<MeetingDisplayState> {
  return httpPost<MeetingDisplayState>(`/meeting-display/${meetingId}/show-presentation`);
}

export function nextPresentationSlide(meetingId: string): Promise<MeetingDisplayState> {
  return httpPost<MeetingDisplayState>(`/meeting-display/${meetingId}/presentation/next`);
}

export function previousPresentationSlide(meetingId: string): Promise<MeetingDisplayState> {
  return httpPost<MeetingDisplayState>(`/meeting-display/${meetingId}/presentation/previous`);
}

export function setPresentationSlide(meetingId: string, slideNumber: number): Promise<MeetingDisplayState> {
  return httpPost<MeetingDisplayState, { slideNumber: number }>(`/meeting-display/${meetingId}/presentation/set-slide`, {
    slideNumber,
  });
}

export function getPublicPresentationContentUrl(meetingId: string, cacheBust?: string): string {
  const base = `${API_BASE_URL}/meeting-display/public/presentation-content?meetingId=${encodeURIComponent(meetingId)}`;
  if (!cacheBust) {
    return base;
  }
  return `${base}&v=${encodeURIComponent(cacheBust)}`;
}

export function getPublicMeetingDisplayStreamUrl(meetingId: string): string {
  return `${API_BASE_URL}/meeting-display/public/stream?meetingId=${encodeURIComponent(meetingId)}`;
}
