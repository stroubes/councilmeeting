"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const reports_service_1 = require("./reports.service");
describe('ReportsService publish', () => {
    it('publishes approved report for authorized user', async () => {
        const service = new reports_service_1.ReportsService({ parseFromBase64: jest.fn() }, { resolveBase64: jest.fn(), uploadBase64File: jest.fn() }, { hasAgendaItem: jest.fn().mockResolvedValue(true) }, {
            getById: jest.fn().mockResolvedValue({ id: 'r1', workflowStatus: 'APPROVED' }),
            updateWorkflowStatus: jest.fn().mockResolvedValue({ id: 'r1', workflowStatus: 'PUBLISHED' }),
            appendApproval: jest.fn().mockResolvedValue({}),
        }, { log: jest.fn().mockResolvedValue(undefined) }, { getById: jest.fn() }, { emit: jest.fn().mockResolvedValue(undefined) }, { getActiveProfile: jest.fn().mockReturnValue({ id: 'BC_BASELINE' }) });
        const result = await service.publish('r1', {
            id: 'u1',
            microsoftOid: 'u1',
            email: 'test@example.com',
            displayName: 'User',
            roles: [],
            permissions: ['public.publish'],
        });
        expect(result.workflowStatus).toBe('PUBLISHED');
    });
    it('rejects publish without permission', async () => {
        const service = new reports_service_1.ReportsService({ parseFromBase64: jest.fn() }, { resolveBase64: jest.fn(), uploadBase64File: jest.fn() }, { hasAgendaItem: jest.fn().mockResolvedValue(true) }, {
            getById: jest.fn().mockResolvedValue({ id: 'r1', workflowStatus: 'APPROVED' }),
        }, { log: jest.fn().mockResolvedValue(undefined) }, { getById: jest.fn() }, { emit: jest.fn().mockResolvedValue(undefined) }, { getActiveProfile: jest.fn().mockReturnValue({ id: 'BC_BASELINE' }) });
        await expect(service.publish('r1', {
            id: 'u1',
            microsoftOid: 'u1',
            email: 'test@example.com',
            displayName: 'User',
            roles: ['STAFF'],
            permissions: [],
        })).rejects.toBeInstanceOf(common_1.ForbiddenException);
    });
});
//# sourceMappingURL=reports.service.spec.js.map