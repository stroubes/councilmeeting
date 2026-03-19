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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiSettingsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const audit_service_1 = require("../audit/audit.service");
const governance_service_1 = require("../governance/governance.service");
const api_settings_repository_1 = require("./api-settings.repository");
let ApiSettingsService = class ApiSettingsService {
    apiSettingsRepository;
    auditService;
    configService;
    governanceService;
    constructor(apiSettingsRepository, auditService, configService, governanceService) {
        this.apiSettingsRepository = apiSettingsRepository;
        this.auditService = auditService;
        this.configService = configService;
        this.governanceService = governanceService;
    }
    health() {
        return { status: 'ok' };
    }
    async list() {
        const records = await this.apiSettingsRepository.list();
        return records.map((record) => this.toView(record));
    }
    async upsert(dto, user) {
        const record = await this.apiSettingsRepository.upsert({
            key: dto.key.trim(),
            label: dto.label.trim(),
            category: dto.category?.trim() || undefined,
            value: dto.value,
            isSecret: dto.isSecret,
            updatedBy: user.id,
        });
        await this.auditService.log({
            actorUserId: user.id,
            action: 'api_settings.upsert',
            entityType: 'api_setting',
            entityId: record.id,
            changesJson: {
                key: record.key,
                category: record.category,
                isSecret: record.isSecret,
            },
        });
        return this.toView(record);
    }
    async remove(id, user) {
        await this.apiSettingsRepository.remove(id);
        await this.auditService.log({
            actorUserId: user.id,
            action: 'api_settings.delete',
            entityType: 'api_setting',
            entityId: id,
        });
        return { ok: true };
    }
    async runtimeMetadata() {
        const activeProfile = await this.governanceService.getActiveProfile();
        const configuredChannels = this.configService.get('notificationChannels') ?? 'IN_APP';
        const integrations = [
            { key: 'MS_TENANT_ID', configured: Boolean(this.configService.get('microsoft.tenantId')) },
            { key: 'MS_CLIENT_ID', configured: Boolean(this.configService.get('microsoft.clientId')) },
            { key: 'MS_API_AUDIENCE', configured: Boolean(this.configService.get('microsoft.apiAudience')) },
            { key: 'SHAREPOINT_SITE_ID', configured: Boolean(this.configService.get('sharepoint.siteId')) },
            { key: 'SHAREPOINT_DRIVE_ID', configured: Boolean(this.configService.get('sharepoint.driveId')) },
        ];
        return {
            profileId: activeProfile.id,
            configuredChannels,
            integrations,
        };
    }
    toView(record) {
        const hasValue = record.value.trim().length > 0;
        return {
            id: record.id,
            key: record.key,
            label: record.label,
            category: record.category,
            valuePreview: record.isSecret ? (hasValue ? '********' : '') : record.value,
            isSecret: record.isSecret,
            hasValue,
            updatedBy: record.updatedBy,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
        };
    }
};
exports.ApiSettingsService = ApiSettingsService;
exports.ApiSettingsService = ApiSettingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [api_settings_repository_1.ApiSettingsRepository,
        audit_service_1.AuditService,
        config_1.ConfigService,
        governance_service_1.GovernanceService])
], ApiSettingsService);
//# sourceMappingURL=api-settings.service.js.map