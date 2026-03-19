export interface MeetingTypeRecord {
  id: string;
  code: string;
  name: string;
  description?: string;
  isInCamera: boolean;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMeetingTypePayload {
  code: string;
  name: string;
  description?: string;
  isInCamera?: boolean;
  isActive?: boolean;
}
