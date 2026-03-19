import { httpGet, httpPatch } from './httpClient';

export interface MunicipalProfileRecord {
  id: 'BC_BASELINE' | 'AB_BASELINE' | 'ON_BASELINE';
  displayName: string;
  jurisdiction: string;
  requiresClosedSessionReason: boolean;
}

export function listGovernanceProfiles(): Promise<MunicipalProfileRecord[]> {
  return httpGet<MunicipalProfileRecord[]>('/governance/profiles');
}

export function getGovernanceActiveProfile(): Promise<MunicipalProfileRecord> {
  return httpGet<MunicipalProfileRecord>('/governance/profile');
}

export function setGovernanceActiveProfile(profileId: MunicipalProfileRecord['id']): Promise<MunicipalProfileRecord> {
  return httpPatch<MunicipalProfileRecord, { profileId: MunicipalProfileRecord['id'] }>('/governance/profile', {
    profileId,
  });
}
