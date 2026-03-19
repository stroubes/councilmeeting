"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const public_portal_service_1 = require("./public-portal.service");
describe('PublicPortalService', () => {
    it('filters in-camera agenda items from published reports', async () => {
        const service = new public_portal_service_1.PublicPortalService({ listPublic: jest.fn().mockResolvedValue([]) }, {
            list: jest.fn().mockResolvedValue([
                {
                    id: 'a1',
                    title: 'Agenda',
                    status: 'PUBLISHED',
                    items: [
                        { id: 'i1', isInCamera: false, status: 'PUBLISHED' },
                        { id: 'i2', isInCamera: true, status: 'PUBLISHED' },
                    ],
                },
            ]),
        }, {
            list: jest.fn().mockResolvedValue([
                { id: 'r1', agendaItemId: 'i1', workflowStatus: 'PUBLISHED' },
                { id: 'r2', agendaItemId: 'i2', workflowStatus: 'PUBLISHED' },
            ]),
        }, { list: jest.fn().mockResolvedValue([]) }, { listByEmail: jest.fn().mockResolvedValue([]) }, { emit: jest.fn().mockResolvedValue({}) });
        const reports = await service.listReports();
        expect(reports).toHaveLength(1);
        expect(reports[0].id).toBe('r1');
    });
    it('builds keyword preview matches for subscriptions', async () => {
        const service = new public_portal_service_1.PublicPortalService({
            listPublic: jest.fn().mockResolvedValue([{ id: 'm1', title: 'Budget Meeting', meetingTypeCode: 'REGULAR' }]),
        }, {
            list: jest.fn().mockResolvedValue([
                {
                    id: 'a1',
                    title: 'Agenda package',
                    status: 'PUBLISHED',
                    items: [{ id: 'i1', isInCamera: false, status: 'PUBLISHED' }],
                },
            ]),
        }, {
            list: jest.fn().mockResolvedValue([
                { id: 'r1', agendaItemId: 'i1', title: 'Budget amendment', executiveSummary: 'financial plan update' },
            ]),
        }, {
            list: jest.fn().mockResolvedValue([
                { id: 'min1', meetingId: 'm1', status: 'PUBLISHED', contentJson: { summary: 'Budget deliberations' } },
            ]),
        }, {
            getById: jest.fn().mockResolvedValue({
                id: 's1',
                email: 'resident@example.com',
                topics: ['BUDGET'],
                watchKeywords: ['budget'],
                frequency: 'IMMEDIATE',
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }),
        }, { emit: jest.fn().mockResolvedValue({}) });
        const preview = await service.previewSubscriptionAlerts('s1');
        expect(preview.matches.length).toBeGreaterThan(0);
        expect(preview.matches[0].topic).toBe('BUDGET');
    });
    it('runs digest sweep and emits notifications for due subscriptions', async () => {
        const emit = jest.fn().mockResolvedValue({ id: 'n1' });
        const update = jest.fn().mockResolvedValue({});
        const service = new public_portal_service_1.PublicPortalService({
            listPublic: jest.fn().mockResolvedValue([{ id: 'm1', title: 'Parks Meeting', meetingTypeCode: 'REGULAR' }]),
        }, {
            list: jest.fn().mockResolvedValue([
                {
                    id: 'a1',
                    title: 'Parks agenda',
                    status: 'PUBLISHED',
                    items: [{ id: 'i1', isInCamera: false, status: 'PUBLISHED' }],
                },
            ]),
        }, {
            list: jest.fn().mockResolvedValue([{ id: 'r1', agendaItemId: 'i1', title: 'Parks update' }]),
        }, {
            list: jest.fn().mockResolvedValue([
                { id: 'min1', meetingId: 'm1', status: 'PUBLISHED', contentJson: { summary: 'Parks minutes' } },
            ]),
        }, {
            listActiveByFrequency: jest
                .fn()
                .mockResolvedValueOnce([
                {
                    id: 's1',
                    email: 'resident@example.com',
                    topics: ['MEETINGS'],
                    watchKeywords: ['parks'],
                    frequency: 'DAILY_DIGEST',
                    isActive: true,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                },
            ])
                .mockResolvedValueOnce([]),
            update,
        }, { emit });
        const result = await service.runDigestSweep(new Date('2026-03-18T12:00:00.000Z'));
        expect(result.delivered).toBe(1);
        expect(emit).toHaveBeenCalledTimes(1);
        expect(update).toHaveBeenCalled();
    });
});
//# sourceMappingURL=public-portal.service.spec.js.map