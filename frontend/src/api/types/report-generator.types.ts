export interface AttendanceEntry {
  userId: string;
  displayName: string;
  voteRecorded: boolean;
  voteValue?: string;
  coiDeclared: boolean;
}

export interface AttendanceMeetingEntry {
  id?: string;
  meetingId: string;
  meetingTitle: string;
  meetingDate: string;
  meetingType: string;
  status: string;
  attendees: AttendanceEntry[];
  absentMembers: AttendanceEntry[];
}

export interface MotionReportEntry {
  motionId: string;
  meetingId: string;
  meetingTitle: string;
  meetingDate: string;
  agendaItemTitle?: string;
  title: string;
  body: string;
  status: string;
  outcome?: string;
  moverUserId?: string;
  moverName?: string;
  seconderName?: string;
  createdAt: string;
}

export interface VotingReportEntry {
  voteId: string;
  motionId: string;
  motionTitle: string;
  meetingId: string;
  meetingTitle: string;
  meetingDate: string;
  councilMemberId: string;
  memberName: string;
  voteValue: string;
  isConflictDeclared: boolean;
  votedAt: string;
}

export interface ConflictReportEntry {
  declarationId: string;
  meetingId: string;
  meetingTitle: string;
  meetingDate: string;
  userId: string;
  userName: string;
  agendaItemId?: string;
  agendaItemTitle?: string;
  reason?: string;
  declaredAt: string;
}

export interface ForecastReportEntry {
  meetingId: string;
  title: string;
  meetingType: string;
  startsAt: string;
  location?: string;
  status: string;
  expectedItems: number;
}