export type BylawStatus = 'ACTIVE' | 'INACTIVE' | 'DELETED';

export interface BylawRecord {
  id: string;
  bylawNumber: string;
  title: string;
  description?: string;
  contentJson: Record<string, unknown>;
  adoptedAt?: string;
  amendedAt?: string;
  repealingMeetingId?: string;
  status: BylawStatus;
  createdBy?: string;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBylawPayload {
  bylawNumber: string;
  title: string;
  description?: string;
  contentJson?: Record<string, unknown>;
  adoptedAt?: string;
}

export interface UpdateBylawPayload {
  bylawNumber?: string;
  title?: string;
  description?: string;
  contentJson?: Record<string, unknown>;
  status?: BylawStatus;
  amendedAt?: string;
  repealingMeetingId?: string;
}
