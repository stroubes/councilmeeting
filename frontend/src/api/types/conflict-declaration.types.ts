export interface ConflictDeclarationRecord {
  id: string;
  meetingId: string;
  agendaItemId?: string;
  userId: string;
  reason?: string;
  declaredAt: string;
  recordedByUserId?: string;
  createdAt: string;
  updatedAt: string;
}
