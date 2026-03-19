import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DEFAULT_MUNICIPAL_PROFILE,
  MUNICIPAL_PROFILES,
  REQUIRED_AGENDA_SECTION_TITLES,
  type AgendaTemplateProfile,
  type MunicipalBaselineProfile,
  type MunicipalProfile,
} from './municipal-profile.constants';
import { GovernanceSettingsRepository } from './governance-settings.repository';

export interface MunicipalPolicyPack {
  profile: MunicipalProfile;
  agendaTemplates: Record<AgendaTemplateProfile, { requiredSectionTitles: string[] }>;
  closedSession: {
    requiresReason: boolean;
  };
}

@Injectable()
export class GovernanceService {
  private static readonly ACTIVE_PROFILE_KEY = 'active_profile_id';

  constructor(
    private readonly configService: ConfigService,
    private readonly governanceSettingsRepository: GovernanceSettingsRepository,
  ) {}

  health(): { status: string } {
    return { status: 'ok' };
  }

  listProfiles(): MunicipalProfile[] {
    return MUNICIPAL_PROFILES;
  }

  async getActiveProfile(): Promise<MunicipalProfile> {
    const activeProfileId = await this.getActiveProfileId();
    return this.resolveProfile(activeProfileId);
  }

  async setActiveProfile(profileId: MunicipalBaselineProfile): Promise<MunicipalProfile> {
    const resolved = this.resolveProfile(profileId);
    await this.governanceSettingsRepository.setValue(GovernanceService.ACTIVE_PROFILE_KEY, resolved.id);
    return resolved;
  }

  async getPolicyPack(): Promise<MunicipalPolicyPack> {
    const profile = await this.getActiveProfile();

    return {
      profile,
      agendaTemplates: {
        REGULAR_COUNCIL: {
          requiredSectionTitles: REQUIRED_AGENDA_SECTION_TITLES.REGULAR_COUNCIL,
        },
        SPECIAL_COUNCIL: {
          requiredSectionTitles: REQUIRED_AGENDA_SECTION_TITLES.SPECIAL_COUNCIL,
        },
        COMMITTEE_OF_WHOLE: {
          requiredSectionTitles: REQUIRED_AGENDA_SECTION_TITLES.COMMITTEE_OF_WHOLE,
        },
        IN_CAMERA: {
          requiredSectionTitles: REQUIRED_AGENDA_SECTION_TITLES.IN_CAMERA,
        },
      },
      closedSession: {
        requiresReason: profile.requiresClosedSessionReason,
      },
    };
  }

  private async getActiveProfileId(): Promise<MunicipalBaselineProfile> {
    const overrideProfileId = await this.governanceSettingsRepository.getValue(GovernanceService.ACTIVE_PROFILE_KEY);
    if (overrideProfileId) {
      return overrideProfileId as MunicipalBaselineProfile;
    }

    const configuredProfileId = this.configService.get<string>('municipalProfileId');
    if (configuredProfileId) {
      return configuredProfileId as MunicipalBaselineProfile;
    }

    return DEFAULT_MUNICIPAL_PROFILE.id;
  }

  private resolveProfile(profileId: MunicipalBaselineProfile): MunicipalProfile {
    const profile = MUNICIPAL_PROFILES.find((candidate) => candidate.id === profileId);
    if (!profile) {
      throw new BadRequestException(`Unknown municipal profile id: ${profileId}`);
    }
    return profile;
  }
}
