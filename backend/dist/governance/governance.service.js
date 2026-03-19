"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var GovernanceService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GovernanceService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const municipal_profile_constants_1 = require("./municipal-profile.constants");
const governance_settings_repository_1 = require("./governance-settings.repository");
let GovernanceService = class GovernanceService {
    static { GovernanceService_1 = this; }
    configService;
    governanceSettingsRepository;
    static ACTIVE_PROFILE_KEY = 'active_profile_id';
    constructor(configService, governanceSettingsRepository) {
        this.configService = configService;
        this.governanceSettingsRepository = governanceSettingsRepository;
    }
    health() {
        return { status: 'ok' };
    }
    listProfiles() {
        return municipal_profile_constants_1.MUNICIPAL_PROFILES;
    }
    async getActiveProfile() {
        const activeProfileId = await this.getActiveProfileId();
        return this.resolveProfile(activeProfileId);
    }
    async setActiveProfile(profileId) {
        const resolved = this.resolveProfile(profileId);
        await this.governanceSettingsRepository.setValue(GovernanceService_1.ACTIVE_PROFILE_KEY, resolved.id);
        return resolved;
    }
    async getPolicyPack() {
        const profile = await this.getActiveProfile();
        return {
            profile,
            agendaTemplates: {
                REGULAR_COUNCIL: {
                    requiredSectionTitles: municipal_profile_constants_1.REQUIRED_AGENDA_SECTION_TITLES.REGULAR_COUNCIL,
                },
                SPECIAL_COUNCIL: {
                    requiredSectionTitles: municipal_profile_constants_1.REQUIRED_AGENDA_SECTION_TITLES.SPECIAL_COUNCIL,
                },
                COMMITTEE_OF_WHOLE: {
                    requiredSectionTitles: municipal_profile_constants_1.REQUIRED_AGENDA_SECTION_TITLES.COMMITTEE_OF_WHOLE,
                },
                IN_CAMERA: {
                    requiredSectionTitles: municipal_profile_constants_1.REQUIRED_AGENDA_SECTION_TITLES.IN_CAMERA,
                },
            },
            closedSession: {
                requiresReason: profile.requiresClosedSessionReason,
            },
        };
    }
    async getActiveProfileId() {
        const overrideProfileId = await this.governanceSettingsRepository.getValue(GovernanceService_1.ACTIVE_PROFILE_KEY);
        if (overrideProfileId) {
            return overrideProfileId;
        }
        const configuredProfileId = this.configService.get('municipalProfileId');
        if (configuredProfileId) {
            return configuredProfileId;
        }
        return municipal_profile_constants_1.DEFAULT_MUNICIPAL_PROFILE.id;
    }
    resolveProfile(profileId) {
        const profile = municipal_profile_constants_1.MUNICIPAL_PROFILES.find((candidate) => candidate.id === profileId);
        if (!profile) {
            throw new common_1.BadRequestException(`Unknown municipal profile id: ${profileId}`);
        }
        return profile;
    }
};
exports.GovernanceService = GovernanceService;
exports.GovernanceService = GovernanceService = GovernanceService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        governance_settings_repository_1.GovernanceSettingsRepository])
], GovernanceService);
//# sourceMappingURL=governance.service.js.map