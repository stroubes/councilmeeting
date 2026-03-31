export interface MeetingTypeRecord {
  id: string;
  code: string;
  name: string;
  description?: string;
  isInCamera: boolean;
  isActive: boolean;
  wizardConfig?: {
    defaultAgendaTemplateId?: string;
    defaultWorkflowCode?: string;
    publishWindowHours?: number;
    carryForwardEnabled?: boolean;
  };
  standingItems?: Array<{
    itemType: string;
    title: string;
    description?: string;
    isInCamera?: boolean;
    carryForwardToNext?: boolean;
  }>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMeetingTypePayload {
  code: string;
  name: string;
  description?: string;
  isInCamera?: boolean;
  isActive?: boolean;
  wizardConfig?: MeetingTypeRecord['wizardConfig'];
  standingItems?: MeetingTypeRecord['standingItems'];
}

export interface UpdateMeetingTypePayload {
  name?: string;
  description?: string;
  isInCamera?: boolean;
  isActive?: boolean;
  wizardConfig?: MeetingTypeRecord['wizardConfig'];
  standingItems?: MeetingTypeRecord['standingItems'];
}
