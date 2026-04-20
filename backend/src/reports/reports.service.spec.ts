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
      { list: jest.fn(), listPaged: jest.fn(), getById: jest.fn() } as never,
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
      { list: jest.fn(), listPaged: jest.fn(), getById: jest.fn() } as never,
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

  it('stores attachments locally when SharePoint credentials are unavailable', async () => {
    const service = new ReportsService(
      { parseFromBase64: jest.fn() } as never,
      {
        resolveBase64: jest.fn(),
        uploadBase64File: jest.fn(),
        hasGraphCredentials: jest.fn().mockReturnValue(false),
        storeLocalBase64File: jest.fn().mockResolvedValue({
          itemId: 'local-attachment-1',
          webUrl: 'http://localhost:3000/api/reports/local-attachments/local-attachment-1-sample.pdf',
          sizeBytes: 128,
        }),
      } as never,
      { hasAgendaItem: jest.fn().mockResolvedValue(true) } as never,
      {
        getById: jest.fn().mockResolvedValue({ id: 'report-1' }),
        createAttachment: jest.fn().mockImplementation(async (input) => ({
          id: 'attachment-1',
          reportId: input.reportId,
          fileName: input.fileName,
          mimeType: input.mimeType,
          sizeBytes: input.sizeBytes,
          sourceType: input.sourceType,
          sourceSharePointSiteId: input.sourceSharePointSiteId,
          sourceSharePointDriveId: input.sourceSharePointDriveId,
          sourceSharePointItemId: input.sourceSharePointItemId,
          sourceSharePointWebUrl: input.sourceSharePointWebUrl,
          uploadedBy: input.uploadedBy,
          createdAt: '2026-04-05T00:00:00.000Z',
        })),
      } as never,
      { log: jest.fn().mockResolvedValue(undefined) } as never,
      { getById: jest.fn() } as never,
      { emit: jest.fn().mockResolvedValue(undefined) } as never,
      { getActiveProfile: jest.fn().mockReturnValue({ id: 'BC_BASELINE' }) } as never,
      { list: jest.fn().mockResolvedValue([]), getById: jest.fn() } as never,
      { list: jest.fn(), listPaged: jest.fn(), getById: jest.fn() } as never,
    );

    const created = await service.addAttachment(
      'report-1',
      {
        fileName: 'sample.pdf',
        mimeType: 'application/pdf',
        contentBase64: Buffer.from('sample pdf').toString('base64'),
      },
      {
        id: 'u1',
        microsoftOid: 'u1',
        email: 'test@example.com',
        displayName: 'User',
        roles: ['STAFF'],
        permissions: ['report.submit'],
      },
    );

    expect(created.sourceType).toBe('LOCAL');
    expect(created.sourceSharePointItemId).toBe('local-attachment-1');
    expect(created.sourceSharePointWebUrl).toContain('/api/reports/local-attachments/');
  });
});
