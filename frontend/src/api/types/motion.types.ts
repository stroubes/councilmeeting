export type MotionStatus = 'DRAFT' | 'LIVE' | 'CARRIED' | 'DEFEATED' | 'WITHDRAWN';

export interface MotionRecord {
  id: string;
  meetingId: string;
  agendaItemId?: string;
  sortOrder: number;
  title: string;
  body: string;
  status: MotionStatus;
  isCurrentLive: boolean;
  resultNote?: string;
  liveAt?: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMotionPayload {
  meetingId: string;
  agendaItemId?: string;
  title: string;
  body: string;
}

export interface UpdateMotionPayload {
  agendaItemId?: string;
  title?: string;
  body?: string;
}

export interface SetMotionOutcomePayload {
  status: 'CARRIED' | 'DEFEATED' | 'WITHDRAWN';
  resultNote?: string;
}

export interface PublicMotionState {
  liveMotion: MotionRecord | null;
  recentOutcomeMotion: MotionRecord | null;
}
