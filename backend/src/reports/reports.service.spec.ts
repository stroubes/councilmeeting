import { ForbiddenException } from '@nestjs/common';
import { ReportsService } from './reports.service';

describe('ReportsService publish', () => {
  it('publishes approved report for authorized user', async () => {
    const service = new ReportsService(
      { parseFromBase64: jest.fn() } as never,
      { resolveBase64: jest.fn(), uploadBase64File: jest.fn() } as never,
      { hasAgendaItem: jest.fn().mockResolvedValue(true) } as never,
      {
        getById: jest.fn().mockResolvedValue({ id: 'r1', workflowStatus: 'APPROVED', updatedAt: '2026-03-23T00:00:00.000Z' }),
        transitionWorkflow: jest.fn().mockResolvedValue({ id: 'r1', workflowStatus: 'PUBLISHED' }),
      } as never,
      { log: jest.fn().mockResolvedValue(undefined) } as never,
      { getById: jest.fn() } as never,
      { emit: jest.fn().mockResolvedValue(undefined) } as never,
      { getActiveProfile: jest.fn().mockReturnValue({ id: 'BC_BASELINE' }) } as never,
      { list: jest.fn().mockResolvedValue([]), getById: jest.fn() } as never,
    );

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
    const service = new ReportsService(
      { parseFromBase64: jest.fn() } as never,
      { resolveBase64: jest.fn(), uploadBase64File: jest.fn() } as never,
      { hasAgendaItem: jest.fn().mockResolvedValue(true) } as never,
      {
        getById: jest.fn().mockResolvedValue({ id: 'r1', workflowStatus: 'APPROVED', updatedAt: '2026-03-23T00:00:00.000Z' }),
      } as never,
      { log: jest.fn().mockResolvedValue(undefined) } as never,
      { getById: jest.fn() } as never,
      { emit: jest.fn().mockResolvedValue(undefined) } as never,
      { getActiveProfile: jest.fn().mockReturnValue({ id: 'BC_BASELINE' }) } as never,
      { list: jest.fn().mockResolvedValue([]), getById: jest.fn() } as never,
    );

    await expect(
      service.publish('r1', {
        id: 'u1',
        microsoftOid: 'u1',
        email: 'test@example.com',
        displayName: 'User',
        roles: ['STAFF'],
        permissions: [],
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
