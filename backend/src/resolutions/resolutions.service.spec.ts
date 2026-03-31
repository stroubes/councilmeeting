import { ResolutionsService } from './resolutions.service';

describe('ResolutionsService', () => {
  it('creates follow-up action when adopting an action-required resolution', async () => {
    const createAction = jest.fn().mockResolvedValue({});
    const service = new ResolutionsService(
      {
        getById: jest.fn().mockResolvedValue({
          id: 'res-1',
          meetingId: 'meeting-1',
          resolutionNumber: '2026-01',
          title: 'Budget Approval',
          body: 'Approve budget',
          voteFor: 0,
          voteAgainst: 0,
          voteAbstain: 0,
          status: 'DRAFT',
          isActionRequired: true,
          createdBy: 'u1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
        update: jest.fn().mockResolvedValue({
          id: 'res-1',
          meetingId: 'meeting-1',
          resolutionNumber: '2026-01',
          title: 'Budget Approval',
          body: 'Approve budget',
          voteFor: 5,
          voteAgainst: 1,
          voteAbstain: 0,
          status: 'ADOPTED',
          isActionRequired: true,
          dueDate: '2026-06-30',
          createdBy: 'u1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
      } as never,
      { log: jest.fn().mockResolvedValue(undefined) } as never,
      { create: createAction } as never,
    );

    await service.update(
      'res-1',
      { status: 'ADOPTED', voteFor: 5, voteAgainst: 1, voteAbstain: 0 },
      {
        id: 'u1',
        microsoftOid: 'u1',
        email: 'user@example.com',
        displayName: 'User',
        roles: ['DIRECTOR'],
        permissions: ['resolution.manage'],
      },
    );

    expect(createAction).toHaveBeenCalledTimes(1);
    expect(createAction.mock.calls[0][0]).toMatchObject({
      resolutionId: 'res-1',
      meetingId: 'meeting-1',
      title: expect.stringContaining('Budget Approval'),
    });
  });
});
