import { randomUUID } from 'node:crypto';

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

const ATTENDANCE_ROLES: AttendanceRole[] = ['CHAIR', 'COUNCIL_MEMBER', 'STAFF', 'GUEST'];
const MOTION_OUTCOMES: MotionOutcome[] = ['PENDING', 'CARRIED', 'DEFEATED', 'WITHDRAWN', 'TABLED', 'DEFERRED', 'REFERRED'];
const VOTE_METHODS: VoteMethod[] = ['RECORDED', 'VOICE', 'HANDS'];
const RECORDED_VOTES: RecordedVoteChoice[] = ['YES', 'NO', 'ABSTAIN'];
const ACTION_STATUSES: ActionItemStatus[] = ['OPEN', 'IN_PROGRESS', 'DONE', 'CANCELLED'];

function asObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

export function createDefaultMinutesContent(): MinutesContent {
  return {
    schemaVersion: 1,
    summary: '',
    attendance: [],
    motions: [],
    votes: [],
    actionItems: [],
    notes: [],
  };
}

export function normalizeMinutesContent(raw: unknown): MinutesContent {
  const source = asObject(raw);
  if (!source) {
    return createDefaultMinutesContent();
  }

  const attendanceSource = Array.isArray(source.attendance) ? source.attendance : [];
  const motionsSource = Array.isArray(source.motions) ? source.motions : [];
  const votesSource = Array.isArray(source.votes) ? source.votes : [];
  const actionItemsSource = Array.isArray(source.actionItems) ? source.actionItems : [];
  const notesSource = Array.isArray(source.notes) ? source.notes : [];

  const attendance = attendanceSource
    .map((entry) => asObject(entry))
    .filter((entry): entry is Record<string, unknown> => Boolean(entry))
    .map((entry) => {
      const roleCandidate = asString(entry.role, 'COUNCIL_MEMBER').toUpperCase() as AttendanceRole;
      return {
        id: asString(entry.id, randomUUID()),
        personName: asString(entry.personName),
        role: ATTENDANCE_ROLES.includes(roleCandidate) ? roleCandidate : 'COUNCIL_MEMBER',
        present: Boolean(entry.present),
        arrivalAt: asOptionalString(entry.arrivalAt),
        departureAt: asOptionalString(entry.departureAt),
        notes: asOptionalString(entry.notes),
      } satisfies MinutesAttendanceEntry;
    })
    .filter((entry) => entry.personName.trim().length > 0);

  const votes = votesSource
    .map((entry) => asObject(entry))
    .filter((entry): entry is Record<string, unknown> => Boolean(entry))
    .map((entry) => {
      const methodCandidate = asString(entry.method, 'VOICE').toUpperCase() as VoteMethod;
      const recordedVotesSource = Array.isArray(entry.recordedVotes) ? entry.recordedVotes : [];
      const recordedVotes = recordedVotesSource
        .map((item) => asObject(item))
        .filter((item): item is Record<string, unknown> => Boolean(item))
        .map((item) => {
          const voteCandidate = asString(item.vote, 'ABSTAIN').toUpperCase() as RecordedVoteChoice;
          return {
            personName: asString(item.personName),
            vote: RECORDED_VOTES.includes(voteCandidate) ? voteCandidate : 'ABSTAIN',
          } satisfies MinutesRecordedVoteEntry;
        })
        .filter((item) => item.personName.trim().length > 0);

      return {
        id: asString(entry.id, randomUUID()),
        motionId: asOptionalString(entry.motionId),
        method: VOTE_METHODS.includes(methodCandidate) ? methodCandidate : 'VOICE',
        yesCount: Math.max(0, asNumber(entry.yesCount, 0)),
        noCount: Math.max(0, asNumber(entry.noCount, 0)),
        abstainCount: Math.max(0, asNumber(entry.abstainCount, 0)),
        recordedVotes,
      } satisfies MinutesVoteEntry;
    });

  const motions = motionsSource
    .map((entry) => asObject(entry))
    .filter((entry): entry is Record<string, unknown> => Boolean(entry))
    .map((entry) => {
      const outcomeCandidate = asString(entry.outcome, 'PENDING').toUpperCase() as MotionOutcome;
      return {
        id: asString(entry.id, randomUUID()),
        agendaItemId: asOptionalString(entry.agendaItemId),
        title: asString(entry.title),
        mover: asOptionalString(entry.mover),
        seconder: asOptionalString(entry.seconder),
        outcome: MOTION_OUTCOMES.includes(outcomeCandidate) ? outcomeCandidate : 'PENDING',
        voteId: asOptionalString(entry.voteId),
        notes: asOptionalString(entry.notes),
      } satisfies MinutesMotionEntry;
    })
    .filter((entry) => entry.title.trim().length > 0);

  const actionItems = actionItemsSource
    .map((entry) => asObject(entry))
    .filter((entry): entry is Record<string, unknown> => Boolean(entry))
    .map((entry) => {
      const statusCandidate = asString(entry.status, 'OPEN').toUpperCase() as ActionItemStatus;
      return {
        id: asString(entry.id, randomUUID()),
        description: asString(entry.description),
        owner: asOptionalString(entry.owner),
        dueDate: asOptionalString(entry.dueDate),
        status: ACTION_STATUSES.includes(statusCandidate) ? statusCandidate : 'OPEN',
      } satisfies MinutesActionItem;
    })
    .filter((entry) => entry.description.trim().length > 0);

  const notes = notesSource
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);

  return {
    schemaVersion: 1,
    summary: asString(source.summary),
    attendance,
    motions,
    votes,
    actionItems,
    notes,
  };
}

export function ensureMinutesFinalizeReadiness(content: MinutesContent): string[] {
  const issues: string[] = [];
  if (content.attendance.filter((entry) => entry.present).length === 0) {
    issues.push('At least one present attendee is required before finalizing minutes.');
  }
  if (content.motions.length === 0) {
    issues.push('At least one motion record is required before finalizing minutes.');
  }
  const unresolvedMotions = content.motions.filter((motion) => motion.outcome === 'PENDING');
  if (unresolvedMotions.length > 0) {
    issues.push('All motions must have an outcome before finalizing minutes.');
  }
  return issues;
}
