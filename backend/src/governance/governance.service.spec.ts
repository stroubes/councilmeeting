import { GovernanceService } from './governance.service';

describe('GovernanceService', () => {
  it('returns configured default profile when no override exists', async () => {
    const service = new GovernanceService(
      { get: jest.fn().mockReturnValue('ON_BASELINE') } as never,
      { getValue: jest.fn().mockResolvedValue(null) } as never,
    );

    const profile = await service.getActiveProfile();

    expect(profile.id).toBe('ON_BASELINE');
    expect(profile.requiresClosedSessionReason).toBe(false);
  });

  it('sets and returns active profile override', async () => {
    const setValue = jest.fn().mockResolvedValue(undefined);
    const service = new GovernanceService(
      { get: jest.fn().mockReturnValue('BC_BASELINE') } as never,
      {
        getValue: jest.fn().mockResolvedValue('AB_BASELINE'),
        setValue,
      } as never,
    );

    const selected = await service.setActiveProfile('AB_BASELINE');
    const active = await service.getActiveProfile();

    expect(setValue).toHaveBeenCalledWith('active_profile_id', 'AB_BASELINE');
    expect(selected.id).toBe('AB_BASELINE');
    expect(active.id).toBe('AB_BASELINE');
  });

  it('returns policy pack with required agenda sections', async () => {
    const service = new GovernanceService(
      { get: jest.fn().mockReturnValue('BC_BASELINE') } as never,
      { getValue: jest.fn().mockResolvedValue('BC_BASELINE') } as never,
    );

    const pack = await service.getPolicyPack();

    expect(pack.profile.id).toBe('BC_BASELINE');
    expect(pack.agendaTemplates.REGULAR_COUNCIL.requiredSectionTitles.length).toBeGreaterThan(0);
    expect(pack.closedSession.requiresReason).toBe(true);
  });
});
