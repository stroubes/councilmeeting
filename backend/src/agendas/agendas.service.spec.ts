import { AgendasService } from './agendas.service';

describe('AgendasService create', () => {
  it('uses meeting type default agenda template when dto.templateId is missing', async () => {
    const templatesGetById = jest.fn().mockResolvedValue({
      id: 'tpl-default',
      type: 'AGENDA',
      sections: [],
    });

    const service = new AgendasService(
      {
        create: jest.fn().mockResolvedValue({
          id: 'agenda-1',
          meetingId: 'meeting-1',
          templateId: 'tpl-default',
          title: 'Regular Council Agenda',
          status: 'DRAFT',
          version: 1,
          items: [],
          createdBy: 'u1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
        getById: jest.fn().mockResolvedValue({
          id: 'agenda-1',
          meetingId: 'meeting-1',
          templateId: 'tpl-default',
          title: 'Regular Council Agenda',
          status: 'DRAFT',
          version: 1,
          items: [],
          createdBy: 'u1',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }),
        update: jest.fn().mockResolvedValue({}),
      } as never,
      {
        exists: jest.fn().mockResolvedValue(true),
        getById: jest.fn().mockResolvedValue({ id: 'meeting-1', meetingTypeCode: 'REGULAR_COUNCIL' }),
      } as never,
      { log: jest.fn().mockResolvedValue(undefined) } as never,
      { getById: templatesGetById } as never,
      { emit: jest.fn().mockResolvedValue(undefined) } as never,
      { getPolicyPack: jest.fn(), getActiveProfile: jest.fn() } as never,
      {
        getByCode: jest.fn().mockResolvedValue({
          code: 'REGULAR_COUNCIL',
          name: 'Regular Council',
          wizardConfig: { defaultAgendaTemplateId: 'tpl-default' },
          standingItems: [],
        }),
      } as never,
    );

    await service.create(
      { meetingId: 'meeting-1', title: 'Regular Council Agenda' },
      {
        id: 'u1',
        microsoftOid: 'u1',
        email: 'user@example.com',
        displayName: 'User',
        roles: ['STAFF'],
        permissions: ['agenda.write'],
      },
    );

    expect(templatesGetById).toHaveBeenCalledWith('tpl-default');
  });
});
