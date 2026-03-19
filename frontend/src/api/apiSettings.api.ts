import { httpDelete, httpGet, httpPost } from './httpClient';
import type { ApiRuntimeMetadata, ApiSettingRecord } from './types/api-settings.types';

export function listApiSettings(): Promise<ApiSettingRecord[]> {
  return httpGet<ApiSettingRecord[]>('/api-settings');
}

export function getApiRuntimeMetadata(): Promise<ApiRuntimeMetadata> {
  return httpGet<ApiRuntimeMetadata>('/api-settings/runtime-metadata');
}

export function upsertApiSetting(payload: {
  key: string;
  label: string;
  category?: string;
  value: string;
  isSecret: boolean;
}): Promise<ApiSettingRecord> {
  return httpPost<ApiSettingRecord, typeof payload>('/api-settings', payload);
}

export function deleteApiSetting(id: string): Promise<{ ok: true }> {
  return httpDelete<{ ok: true }>(`/api-settings/${id}`);
}
