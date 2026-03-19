"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common_1 = require("@nestjs/common");
const minutes_service_1 = require("./minutes.service");
describe('MinutesService finalize readiness', () => {
    it('rejects finalize when no present attendee exists', async () => {
        const service = new minutes_service_1.MinutesService({ exists: jest.fn().mockResolvedValue(true) }, {
            getById: jest.fn().mockResolvedValue({
                id: 'm1',
                meetingId: 'meeting-1',
                status: 'IN_PROGRESS',
                contentJson: {
                    schemaVersion: 1,
                    summary: '',
                    attendance: [],
                    motions: [{ id: 'motion-1', title: 'Motion', outcome: 'CARRIED' }],
                    votes: [],
                    actionItems: [],
                    notes: [],
                },
            }),
        }, { log: jest.fn().mockResolvedValue(undefined) }, { emit: jest.fn().mockResolvedValue(undefined) });
        await expect(service.finalize('m1', {
            id: 'u1',
            microsoftOid: 'u1',
            email: 'test@example.com',
            displayName: 'User',
            roles: ['STAFF'],
            permissions: ['minutes.write'],
        })).rejects.toBeInstanceOf(common_1.BadRequestException);
    });
    it('finalizes when minutes satisfy readiness checks', async () => {
        const update = jest.fn().mockResolvedValue({ id: 'm1', status: 'FINALIZED' });
        const service = new minutes_service_1.MinutesService({ exists: jest.fn().mockResolvedValue(true) }, {
            getById: jest.fn().mockResolvedValue({
                id: 'm1',
                meetingId: 'meeting-1',
                status: 'IN_PROGRESS',
                contentJson: {
                    schemaVersion: 1,
                    summary: '',
                    attendance: [{ id: 'a1', personName: 'Mayor', role: 'CHAIR', present: true }],
                    motions: [{ id: 'motion-1', title: 'Motion', outcome: 'CARRIED' }],
                    votes: [],
                    actionItems: [],
                    notes: [],
                },
            }),
            update,
        }, { log: jest.fn().mockResolvedValue(undefined) }, { emit: jest.fn().mockResolvedValue(undefined) });
        const result = await service.finalize('m1', {
            id: 'u1',
            microsoftOid: 'u1',
            email: 'test@example.com',
            displayName: 'User',
            roles: ['STAFF'],
            permissions: ['minutes.write'],
        });
        expect(update).toHaveBeenCalled();
        expect(result.status).toBe('FINALIZED');
    });
});
//# sourceMappingURL=minutes.service.spec.js.map