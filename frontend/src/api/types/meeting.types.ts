export type MeetingStatus =
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'ADJOURNED'
  | 'CANCELLED'
  | 'COMPLETED';

export interface MeetingRecord {
  id: string;
  title: string;
  description?: string;
  meetingTypeCode: string;
  startsAt: string;
  endsAt?: string;
  location?: string;
  status: MeetingStatus;
  isPublic: boolean;
  isInCamera: boolean;
  videoUrl?: string;
  recurrenceGroupId?: string;
  recurrenceIndex?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMeetingPayload {
  title: string;
  meetingTypeCode: string;
  startsAt: string;
  endsAt?: string;
  location?: string;
  description?: string;
  isPublic?: boolean;
  videoUrl?: string;
  recurrenceGroupId?: string;
  recurrenceIndex?: number;
}

export interface MeetingPageResult {
  items: MeetingRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
