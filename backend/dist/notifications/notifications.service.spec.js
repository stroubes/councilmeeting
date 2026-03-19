"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const notifications_service_1 = require("./notifications.service");
function createConfig(overrides) {
    return {
        get: jest.fn((key) => overrides?.[key]),
    };
}
describe('NotificationsService', () => {
    const originalFetch = global.fetch;
    afterEach(() => {
        global.fetch = originalFetch;
        jest.restoreAllMocks();
    });
    it('emits and marks in-app event delivered', async () => {
        const create = jest.fn().mockResolvedValue({
            id: 'n1',
            eventType: 'REPORT_SUBMITTED',
            entityType: 'report',
            entityId: 'r1',
            actorUserId: 'u1',
            payloadJson: {},
            channels: ['IN_APP'],
            status: 'PENDING',
            deliveryAttempts: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
        const updateDelivery = jest.fn().mockResolvedValue({
            id: 'n1',
            status: 'DELIVERED',
            deliveryAttempts: 1,
        });
        const service = new notifications_service_1.NotificationsService({
            create,
            updateDelivery,
        }, createConfig({ notificationChannels: 'IN_APP', notificationRetryMaxAttempts: 1 }));
        const result = await service.emit({
            eventType: 'REPORT_SUBMITTED',
            entityType: 'report',
            entityId: 'r1',
            actorUserId: 'u1',
        });
        expect(create).toHaveBeenCalled();
        expect(updateDelivery).toHaveBeenCalledTimes(1);
        expect(result.status).toBe('DELIVERED');
    });
    it('marks event failed after retry budget exhaustion', async () => {
        const create = jest.fn().mockResolvedValue({
            id: 'n1',
            eventType: 'AGENDA_PUBLISHED',
            entityType: 'agenda',
            entityId: 'a1',
            actorUserId: 'u1',
            payloadJson: {},
            channels: ['WEBHOOK'],
            status: 'PENDING',
            deliveryAttempts: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
        const updateDelivery = jest
            .fn()
            .mockResolvedValueOnce({ id: 'n1', status: 'PENDING', deliveryAttempts: 1 })
            .mockResolvedValueOnce({ id: 'n1', status: 'FAILED', deliveryAttempts: 2 });
        const service = new notifications_service_1.NotificationsService({
            create,
            updateDelivery,
        }, createConfig({
            notificationChannels: 'WEBHOOK',
            notificationRetryMaxAttempts: 2,
            notificationRetryBaseDelayMs: 1,
        }));
        const result = await service.emit({
            eventType: 'AGENDA_PUBLISHED',
            entityType: 'agenda',
            entityId: 'a1',
            actorUserId: 'u1',
        });
        expect(updateDelivery).toHaveBeenCalledTimes(2);
        expect(updateDelivery).toHaveBeenNthCalledWith(1, 'n1', expect.objectContaining({ status: 'PENDING', deliveryAttempts: 1 }));
        expect(updateDelivery).toHaveBeenNthCalledWith(2, 'n1', expect.objectContaining({ status: 'FAILED', deliveryAttempts: 2 }));
        expect(result.status).toBe('FAILED');
    });
    it('retry resets attempts and redelivers', async () => {
        const getById = jest.fn().mockResolvedValue({ id: 'n1', deliveryAttempts: 5 });
        const updateDelivery = jest
            .fn()
            .mockResolvedValueOnce({
            id: 'n1',
            eventType: 'REPORT_PUBLISHED',
            entityType: 'report',
            entityId: 'r1',
            actorUserId: 'u1',
            payloadJson: {},
            channels: ['IN_APP'],
            status: 'PENDING',
            deliveryAttempts: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        })
            .mockResolvedValueOnce({ id: 'n1', status: 'DELIVERED', deliveryAttempts: 1 });
        const service = new notifications_service_1.NotificationsService({
            getById,
            updateDelivery,
        }, createConfig({ notificationChannels: 'IN_APP', notificationRetryMaxAttempts: 1 }));
        const result = await service.retry('n1');
        expect(updateDelivery).toHaveBeenNthCalledWith(1, 'n1', expect.objectContaining({ status: 'PENDING', deliveryAttempts: 0 }));
        expect(result.status).toBe('DELIVERED');
    });
    it('sends digest-shaped payload to email channel adapter', async () => {
        const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200 });
        global.fetch = fetchMock;
        const create = jest.fn().mockResolvedValue({
            id: 'n1',
            eventType: 'PUBLIC_DIGEST_DAILY_DIGEST',
            entityType: 'public_subscription',
            entityId: 's1',
            actorUserId: undefined,
            payloadJson: {
                recipientEmail: 'resident@example.com',
                frequency: 'DAILY_DIGEST',
                topics: ['MEETINGS'],
                watchKeywords: ['parks'],
                matches: [{ topic: 'MEETINGS', title: 'Parks Meeting', id: 'm1', source: 'meeting' }],
            },
            channels: ['EMAIL'],
            status: 'PENDING',
            deliveryAttempts: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });
        const updateDelivery = jest.fn().mockResolvedValue({ id: 'n1', status: 'DELIVERED', deliveryAttempts: 1 });
        const service = new notifications_service_1.NotificationsService({ create, updateDelivery }, createConfig({
            notificationChannels: 'EMAIL',
            notificationEmailWebhookUrl: 'https://example.com/email-webhook',
            notificationRetryMaxAttempts: 1,
        }));
        const result = await service.emit({
            eventType: 'PUBLIC_DIGEST_DAILY_DIGEST',
            entityType: 'public_subscription',
            entityId: 's1',
            payloadJson: {
                recipientEmail: 'resident@example.com',
                frequency: 'DAILY_DIGEST',
                topics: ['MEETINGS'],
                watchKeywords: ['parks'],
                matches: [{ topic: 'MEETINGS', title: 'Parks Meeting', id: 'm1', source: 'meeting' }],
            },
        });
        expect(fetchMock).toHaveBeenCalledWith('https://example.com/email-webhook', expect.objectContaining({ method: 'POST' }));
        const callBody = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body ?? '{}');
        expect(callBody.template).toBe('public-digest-v1');
        expect(callBody.subject).toContain('Daily');
        expect(callBody.to).toBe('resident@example.com');
        expect(callBody.text).toContain('Parks Meeting');
        expect(result.status).toBe('DELIVERED');
    });
    it('returns observability aggregates', async () => {
        const now = new Date().toISOString();
        const service = new notifications_service_1.NotificationsService({
            list: jest.fn().mockResolvedValue([
                {
                    id: 'n1',
                    eventType: 'PUBLIC_DIGEST_DAILY_DIGEST',
                    entityType: 'public_subscription',
                    entityId: 's1',
                    channels: ['EMAIL'],
                    status: 'DELIVERED',
                    deliveryAttempts: 1,
                    createdAt: now,
                },
                {
                    id: 'n2',
                    eventType: 'REPORT_SUBMITTED',
                    entityType: 'report',
                    entityId: 'r1',
                    channels: ['TEAMS'],
                    status: 'FAILED',
                    deliveryAttempts: 3,
                    createdAt: now,
                },
            ]),
        }, createConfig({}));
        const metrics = await service.observability();
        expect(metrics.totals.total).toBe(2);
        expect(metrics.digest.total).toBe(1);
        expect(metrics.backlog.highRetryCount).toBe(1);
        expect(metrics.byChannel.find((entry) => entry.channel === 'EMAIL')?.delivered).toBe(1);
    });
});
//# sourceMappingURL=notifications.service.spec.js.map