export type AttendanceRole = 'CHAIR' | 'COUNCIL_MEMBER' | 'STAFF' | 'GUEST';
export type AttendeeStatus = 'PRESENT' | 'ABSENT' | 'EXCUSED' | 'LATE' | 'EARLY_DEPARTURE';

export interface AttendeeRecord {
  id: string;
  meetingId: string;
  userId: string;
  role: AttendanceRole;
  status: AttendeeStatus;
  arrivedAt?: string;
  departedAt?: string;
  isConflictOfInterest: boolean;
  notes?: string;
  recordedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuorumStatus {
  meetingId: string;
  councilSize: number;
  requiredCount: number;
  presentCount: number;
  isQuorumMet: boolean;
}

export interface CreateAttendeePayload {
  meetingId: string;
  userId: string;
  role?: AttendanceRole;
  status?: AttendeeStatus;
  arrivedAt?: string;
  departedAt?: string;
  isConflictOfInterest?: boolean;
  notes?: string;
}

export interface UpdateAttendeePayload {
  role?: AttendanceRole;
  status?: AttendeeStatus;
  arrivedAt?: string;
  departedAt?: string;
  isConflictOfInterest?: boolean;
  notes?: string;
}