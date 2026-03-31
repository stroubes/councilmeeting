import { BadRequestException } from '@nestjs/common';
import { MinutesService } from './minutes.service';

describe('MinutesService finalize readiness', () => {
  it('rejects finalize when no present attendee exists', async () => {
    const service = new MinutesService(
      { exists: jest.fn().mockResolvedValue(true) } as never,
      {
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
      } as never,
      { log: jest.fn().mockResolvedValue(undefined) } as never,
      { emit: jest.fn().mockResolvedValue(undefined) } as never,
      { listByMeeting: jest.fn().mockResolvedValue([]) } as never,
      { list: jest.fn().mockResolvedValue([]) } as never,
      { getTally: jest.fn().mockResolvedValue({ totalVotes: 0 } as never) } as never,
      { getUserDisplayName: jest.fn().mockResolvedValue('User') } as never,
    );

    await expect(
      service.finalize('m1', {
        id: 'u1',
        microsoftOid: 'u1',
        email: 'test@example.com',
        displayName: 'User',
        roles: ['STAFF'],
        permissions: ['minutes.write'],
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('finalizes when minutes satisfy readiness checks', async () => {
    const update = jest.fn().mockResolvedValue({ id: 'm1', status: 'FINALIZED' });
    const service = new MinutesService(
      { exists: jest.fn().mockResolvedValue(true) } as never,
      {
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
      } as never,
      { log: jest.fn().mockResolvedValue(undefined) } as never,
      { emit: jest.fn().mockResolvedValue(undefined) } as never,
      { listByMeeting: jest.fn().mockResolvedValue([]) } as never,
      { list: jest.fn().mockResolvedValue([]) } as never,
      { getTally: jest.fn().mockResolvedValue({ totalVotes: 0 } as never) } as never,
      { getUserDisplayName: jest.fn().mockResolvedValue('User') } as never,
    );

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
