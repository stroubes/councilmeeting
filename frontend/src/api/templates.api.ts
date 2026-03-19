import { httpDelete, httpGet, httpPatch, httpPost } from './httpClient';
import type {
  CreateTemplatePayload,
  CreateTemplateSectionPayload,
  TemplateRecord,
  TemplateType,
  UpdateTemplatePayload,
  UpdateTemplateSectionPayload,
} from './types/template.types';

export function listTemplates(params?: { type?: TemplateType; includeInactive?: boolean }): Promise<TemplateRecord[]> {
  const query = new URLSearchParams();
  if (params?.type) {
    query.set('type', params.type);
  }
  if (params?.includeInactive) {
    query.set('includeInactive', 'true');
  }
  const queryString = query.toString();
  return httpGet<TemplateRecord[]>(`/templates${queryString ? `?${queryString}` : ''}`);
}

export function createTemplate(payload: CreateTemplatePayload): Promise<TemplateRecord> {
  return httpPost<TemplateRecord, CreateTemplatePayload>('/templates', payload);
}

export function updateTemplate(templateId: string, payload: UpdateTemplatePayload): Promise<TemplateRecord> {
  return httpPatch<TemplateRecord, UpdateTemplatePayload>(`/templates/${templateId}`, payload);
}

export function addTemplateSection(templateId: string, payload: CreateTemplateSectionPayload): Promise<TemplateRecord> {
  return httpPost<TemplateRecord, CreateTemplateSectionPayload>(`/templates/${templateId}/sections`, payload);
}

export function updateTemplateSection(
  templateId: string,
  sectionId: string,
  payload: UpdateTemplateSectionPayload,
): Promise<TemplateRecord> {
  return httpPatch<TemplateRecord, UpdateTemplateSectionPayload>(
    `/templates/${templateId}/sections/${sectionId}`,
    payload,
  );
}

export function reorderTemplateSections(templateId: string, sectionIdsInOrder: string[]): Promise<TemplateRecord> {
  return httpPost<TemplateRecord, { sectionIdsInOrder: string[] }>(`/templates/${templateId}/sections/reorder`, {
    sectionIdsInOrder,
  });
}

export function removeTemplateSection(templateId: string, sectionId: string): Promise<TemplateRecord> {
  return httpDelete<TemplateRecord>(`/templates/${templateId}/sections/${sectionId}`);
}

export function deleteTemplate(templateId: string): Promise<{ ok: true }> {
  return httpDelete<{ ok: true }>(`/templates/${templateId}`);
}
