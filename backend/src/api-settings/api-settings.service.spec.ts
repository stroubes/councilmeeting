import { ApiSettingsService } from './api-settings.service';

describe('ApiSettingsService', () => {
  it('masks secret setting values in list response', async () => {
    const service = new ApiSettingsService(
      {
        list: jest.fn().mockResolvedValue([
          {
            id: 's1',
            key: 'MS_CLIENT_SECRET',
            label: 'Microsoft Client Secret',
            category: 'AUTH',
            value: 'top-secret',
            isSecret: true,
            updatedBy: 'admin',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ]),
      } as never,
      { log: jest.fn().mockResolvedValue(undefined) } as never,
      { get: jest.fn().mockReturnValue(undefined) } as never,
      { getActiveProfile: jest.fn().mockResolvedValue({ id: 'BC_BASELINE' }) } as never,
    );

    const result = await service.list();

    expect(result).toHaveLength(1);
    expect(result[0].isSecret).toBe(true);
    expect(result[0].valuePreview).toBe('********');
  });

  it('returns runtime metadata without secret values', async () => {
    const service = new ApiSettingsService(
      { list: jest.fn() } as never,
      { log: jest.fn().mockResolvedValue(undefined) } as never,
      {
        get: jest.fn((key: string) => {
          if (key === 'municipalProfileId') return 'BC_BASELINE';
          if (key === 'notificationChannels') return 'IN_APP,TEAMS';
          if (key === 'microsoft.tenantId') return 'tenant';
          if (key === 'microsoft.clientId') return 'client';
          if (key === 'microsoft.apiAudience') return 'audience';
          if (key === 'sharepoint.siteId') return undefined;
          if (key === 'sharepoint.driveId') return 'drive';
          return undefined;
        }),
      } as never,
      { getActiveProfile: jest.fn().mockResolvedValue({ id: 'AB_BASELINE' }) } as never,
    );

    const metadata = await service.runtimeMetadata();
    expect(metadata.profileId).toBe('AB_BASELINE');
    expect(metadata.integrations.find((entry) => entry.key === 'MS_TENANT_ID')?.configured).toBe(true);
    expect(metadata.integrations.find((entry) => entry.key === 'SHAREPOINT_SITE_ID')?.configured).toBe(false);
  });
});
