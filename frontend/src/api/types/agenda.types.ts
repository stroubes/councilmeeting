export type AgendaStatus =
  | 'DRAFT'
  | 'PENDING_DIRECTOR_APPROVAL'
  | 'PENDING_CAO_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'PUBLISHED';

export interface AgendaItemRecord {
  id: string;
  agendaId: string;
  itemType: string;
  title: string;
  description?: string;
  parentItemId?: string;
  isInCamera: boolean;
  sortOrder: number;
  status: AgendaStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface AgendaRecord {
  id: string;
  meetingId: string;
  templateId?: string;
  title: string;
  status: AgendaStatus;
  version: number;
  rejectionReason?: string;
  items: AgendaItemRecord[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}
