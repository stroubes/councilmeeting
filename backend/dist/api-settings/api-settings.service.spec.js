"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const api_settings_service_1 = require("./api-settings.service");
describe('ApiSettingsService', () => {
    it('masks secret setting values in list response', async () => {
        const service = new api_settings_service_1.ApiSettingsService({
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
        }, { log: jest.fn().mockResolvedValue(undefined) }, { get: jest.fn().mockReturnValue(undefined) }, { getActiveProfile: jest.fn().mockResolvedValue({ id: 'BC_BASELINE' }) });
        const result = await service.list();
        expect(result).toHaveLength(1);
        expect(result[0].isSecret).toBe(true);
        expect(result[0].valuePreview).toBe('********');
    });
    it('returns runtime metadata without secret values', async () => {
        const service = new api_settings_service_1.ApiSettingsService({ list: jest.fn() }, { log: jest.fn().mockResolvedValue(undefined) }, {
            get: jest.fn((key) => {
                if (key === 'municipalProfileId')
                    return 'BC_BASELINE';
                if (key === 'notificationChannels')
                    return 'IN_APP,TEAMS';
                if (key === 'microsoft.tenantId')
                    return 'tenant';
                if (key === 'microsoft.clientId')
                    return 'client';
                if (key === 'microsoft.apiAudience')
                    return 'audience';
                if (key === 'sharepoint.siteId')
                    return undefined;
                if (key === 'sharepoint.driveId')
                    return 'drive';
                return undefined;
            }),
        }, { getActiveProfile: jest.fn().mockResolvedValue({ id: 'AB_BASELINE' }) });
        const metadata = await service.runtimeMetadata();
        expect(metadata.profileId).toBe('AB_BASELINE');
        expect(metadata.integrations.find((entry) => entry.key === 'MS_TENANT_ID')?.configured).toBe(true);
        expect(metadata.integrations.find((entry) => entry.key === 'SHAREPOINT_SITE_ID')?.configured).toBe(false);
    });
});
//# sourceMappingURL=api-settings.service.spec.js.map