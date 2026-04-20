import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  it('builds executive KPI snapshot with coverage and digest metrics', async () => {
    const service = new AnalyticsService(
      {
        list: jest.fn().mockResolvedValue([{ id: 'm1' }, { id: 'm2' }]),
      } as never,
      {
        list: jest.fn().mockResolvedValue([
          { id: 'a1', status: 'PUBLISHED', createdAt: '2026-03-01T00:00:00.000Z', publishedAt: '2026-03-02T00:00:00.000Z' },
          { id: 'a2', status: 'DRAFT', createdAt: '2026-03-03T00:00:00.000Z' },
        ]),
      } as never,
      {
        list: jest.fn().mockResolvedValue([
          { id: 'r1', workflowStatus: 'PUBLISHED', createdAt: '2026-03-01T00:00:00.000Z' },
          { id: 'r2', workflowStatus: 'REJECTED', createdAt: '2026-03-01T00:00:00.000Z' },
        ]),
        listPendingDirector: jest.fn().mockResolvedValue([{ id: 'r3' }]),
        listPendingCao: jest.fn().mockResolvedValue([]),
        getLatestPublishedAtByReportIds: jest
          .fn()
          .mockResolvedValue(new Map<string, string>([['r1', '2026-03-01T12:00:00.000Z']])),
      } as never,
      {
        list: jest.fn().mockResolvedValue([
          {
            id: 'min1',
            status: 'PUBLISHED',
            createdAt: '2026-03-01T00:00:00.000Z',
            publishedAt: '2026-03-01T06:00:00.000Z',
          },
        ]),
      } as never,
      {
        observability: jest.fn().mockResolvedValue({
          digest: { total: 5, delivered: 4, failed: 1, pending: 0, latestDigestEventAt: '2026-03-18T12:00:00.000Z' },
        }),
      } as never,
    );

    const snapshot = await service.executiveKpis();

    expect(snapshot.totals.meetings).toBe(2);
    expect(snapshot.approvals.totalPending).toBe(1);
    expect(snapshot.publicationCoverage.agendasPublishedPct).toBe(50);
    expect(snapshot.reportWorkflow.rejectedRate).toBe(50);
    expect(snapshot.digest.deliveryRate).toBe(80);
  });
});
