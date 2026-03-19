export type MinutesStatus = 'DRAFT' | 'IN_PROGRESS' | 'FINALIZED' | 'PUBLISHED';

export type AttendanceRole = 'CHAIR' | 'COUNCIL_MEMBER' | 'STAFF' | 'GUEST';
export type MotionOutcome = 'PENDING' | 'CARRIED' | 'DEFEATED' | 'WITHDRAWN' | 'TABLED' | 'DEFERRED' | 'REFERRED';
export type VoteMethod = 'RECORDED' | 'VOICE' | 'HANDS';
export type RecordedVoteChoice = 'YES' | 'NO' | 'ABSTAIN';
export type ActionItemStatus = 'OPEN' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';

export interface MinutesAttendanceEntry {
  id: string;
  personName: string;
  role: AttendanceRole;
  present: boolean;
  arrivalAt?: string;
  departureAt?: string;
  notes?: string;
}

export interface MinutesRecordedVoteEntry {
  personName: string;
  vote: RecordedVoteChoice;
}

export interface MinutesVoteEntry {
  id: string;
  motionId?: string;
  method: VoteMethod;
  yesCount: number;
  noCount: number;
  abstainCount: number;
  recordedVotes: MinutesRecordedVoteEntry[];
}

export interface MinutesMotionEntry {
  id: string;
  agendaItemId?: string;
  title: string;
  mover?: string;
  seconder?: string;
  outcome: MotionOutcome;
  voteId?: string;
  notes?: string;
}

export interface MinutesActionItem {
  id: string;
  description: string;
  owner?: string;
  dueDate?: string;
  status: ActionItemStatus;
}

export interface MinutesContent {
  schemaVersion: 1;
  summary: string;
  attendance: MinutesAttendanceEntry[];
  motions: MinutesMotionEntry[];
  votes: MinutesVoteEntry[];
  actionItems: MinutesActionItem[];
  notes: string[];
}

export interface MinutesRecord {
  id: string;
  meetingId: string;
  minuteTakerUserId?: string;
  contentJson: MinutesContent;
  status: MinutesStatus;
  startedAt?: string;
  finalizedAt?: string;
  publishedAt?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
