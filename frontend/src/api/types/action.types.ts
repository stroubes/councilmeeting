export type ActionStatus = 'OPEN' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED' | 'CANCELLED';
export type ActionPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface ActionItemRecord {
  id: string;
  title: string;
  description?: string;
  status: ActionStatus;
  priority: ActionPriority;
  ownerUserId?: string;
  dueDate?: string;
  meetingId?: string;
  resolutionId?: string;
  motionId?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}
