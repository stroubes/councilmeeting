export type VoteValue = 'YEA' | 'NAY' | 'ABSTAIN' | 'ABSENT';

export interface VoteRecord {
  id: string;
  motionId: string;
  councilMemberId: string;
  voteValue: VoteValue;
  votedAt: string;
  isConflictDeclared: boolean;
  note?: string;
  createdAt: string;
}

export interface VoteTally {
  motionId: string;
  yesCount: number;
  noCount: number;
  abstainCount: number;
  absentCount: number;
  totalVotes: number;
  recordedVotes: VoteRecord[];
}

export interface CastVotePayload {
  motionId: string;
  councilMemberId: string;
  voteValue: VoteValue;
  isConflictDeclared?: boolean;
  note?: string;
}

export interface UpdateVotePayload {
  voteValue?: VoteValue;
  isConflictDeclared?: boolean;
  note?: string;
}