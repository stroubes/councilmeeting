import { ConfigService } from '@nestjs/config';
import { type AgendaTemplateProfile, type MunicipalBaselineProfile, type MunicipalProfile } from './municipal-profile.constants';
import { GovernanceSettingsRepository } from './governance-settings.repository';
export interface MunicipalPolicyPack {
    profile: MunicipalProfile;
    agendaTemplates: Record<AgendaTemplateProfile, {
        requiredSectionTitles: string[];
    }>;
    closedSession: {
        requiresReason: boolean;
    };
}
export declare class GovernanceService {
    private readonly configService;
    private readonly governanceSettingsRepository;
    private static readonly ACTIVE_PROFILE_KEY;
    constructor(configService: ConfigService, governanceSettingsRepository: GovernanceSettingsRepository);
    health(): {
        status: string;
    };
    listProfiles(): MunicipalProfile[];
    getActiveProfile(): Promise<MunicipalProfile>;
    setActiveProfile(profileId: MunicipalBaselineProfile): Promise<MunicipalProfile>;
    getPolicyPack(): Promise<MunicipalPolicyPack>;
    private getActiveProfileId;
    private resolveProfile;
}
