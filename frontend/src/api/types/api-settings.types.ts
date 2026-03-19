export interface ApiSettingRecord {
  id: string;
  key: string;
  label: string;
  category?: string;
  valuePreview: string;
  isSecret: boolean;
  hasValue: boolean;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiRuntimeMetadata {
  profileId: string;
  configuredChannels: string;
  integrations: Array<{
    key: string;
    configured: boolean;
  }>;
}
