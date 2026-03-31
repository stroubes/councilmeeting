export type ResolutionStatus = 'DRAFT' | 'ADOPTED' | 'DEFEATED' | 'WITHDRAWN';

export interface ResolutionRecord {
  id: string;
  meetingId: string;
  agendaItemId?: string;
  motionId?: string;
  resolutionNumber: string;
  title: string;
  body: string;
  bylawNumber?: string;
  movedBy?: string;
  secondedBy?: string;
  voteFor: number;
  voteAgainst: number;
  voteAbstain: number;
  status: ResolutionStatus;
  isActionRequired: boolean;
  dueDate?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
