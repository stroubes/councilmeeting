export type ReportWorkflowStatus =
  | 'DRAFT'
  | 'PENDING_DIRECTOR_APPROVAL'
  | 'PENDING_CAO_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'PUBLISHED';

export interface StaffReportRecord {
  id: string;
  agendaItemId: string;
  templateId?: string;
  reportNumber?: string;
  title: string;
  department?: string;
  executiveSummary?: string;
  recommendations?: string;
  financialImpact?: string;
  legalImpact?: string;
  rawDocxFileName?: string;
  sourceSharePointSiteId?: string;
  sourceSharePointDriveId?: string;
  sourceSharePointItemId?: string;
  sourceSharePointWebUrl?: string;
  parsedContentJson: Record<string, unknown>;
  parsingVersion: string;
  parsingWarnings: string[];
  workflowStatus: ReportWorkflowStatus;
  authorUserId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportAttachmentRecord {
  id: string;
  reportId: string;
  fileName: string;
  mimeType?: string;
  sizeBytes?: number;
  sourceType: 'SHAREPOINT';
  sourceSharePointSiteId?: string;
  sourceSharePointDriveId?: string;
  sourceSharePointItemId?: string;
  sourceSharePointWebUrl?: string;
  uploadedBy: string;
  createdAt: string;
}

export interface CreateStaffReportPayload {
  agendaItemId: string;
  templateId?: string;
  reportNumber?: string;
  title: string;
  department?: string;
  executiveSummary?: string;
  recommendations?: string;
  financialImpact?: string;
  legalImpact?: string;
}

export interface ImportDocxReportPayload {
  agendaItemId: string;
  fileName: string;
  contentBase64?: string;
  sharePointSiteId?: string;
  sharePointDriveId?: string;
  sharePointItemId?: string;
  sharePointWebUrl?: string;
}

export interface CreateReportAttachmentPayload {
  fileName: string;
  mimeType?: string;
  sizeBytes?: number;
  contentBase64?: string;
  sharePointSiteId?: string;
  sharePointDriveId?: string;
  sharePointItemId?: string;
  sharePointWebUrl?: string;
}
