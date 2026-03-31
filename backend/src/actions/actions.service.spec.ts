import { ActionsService } from './actions.service';

describe('ActionsService dashboard', () => {
  it('counts overdue action items', async () => {
    const service = new ActionsService(
      {
        list: jest.fn().mockResolvedValue([
          {
            id: 'a1',
            title: 'Overdue follow-up',
            status: 'OPEN',
            priority: 'MEDIUM',
            dueDate: '2024-01-01',
          },
          {
            id: 'a2',
            title: 'Completed follow-up',
            status: 'COMPLETED',
            priority: 'MEDIUM',
            dueDate: '2024-01-01',
          },
        ]),
      } as never,
      { log: jest.fn() } as never,
    );

    const dashboard = await service.dashboard();
    expect(dashboard.open).toBe(1);
    expect(dashboard.completed).toBe(1);
    expect(dashboard.overdue).toBe(1);
  });
});
