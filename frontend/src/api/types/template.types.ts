export type TemplateType = 'AGENDA' | 'STAFF_REPORT';

export interface TemplateSectionRecord {
  id: string;
  templateId: string;
  title: string;
  description?: string;
  sectionType?: string;
  itemType?: string;
  isRequired: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateRecord {
  id: string;
  type: TemplateType;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
  version: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  sections: TemplateSectionRecord[];
}

export interface CreateTemplatePayload {
  type: TemplateType;
  code: string;
  name: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateTemplatePayload {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface CreateTemplateSectionPayload {
  title: string;
  description?: string;
  sectionType?: string;
  itemType?: string;
  isRequired?: boolean;
}

export interface UpdateTemplateSectionPayload extends CreateTemplateSectionPayload {}
