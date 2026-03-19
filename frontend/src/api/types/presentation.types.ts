export interface PresentationRecord {
  id: string;
  meetingId: string;
  fileName: string;
  title: string;
  mimeType: string;
  pageCount: number;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePresentationPayload {
  meetingId: string;
  fileName: string;
  mimeType?: string;
  title?: string;
  contentBase64: string;
}
