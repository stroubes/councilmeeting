import { ConfigService } from '@nestjs/config';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { GovernanceService } from '../governance/governance.service';
import { ApiSettingsRepository } from './api-settings.repository';
import type { UpsertApiSettingDto } from './dto/upsert-api-setting.dto';
export interface ApiSettingView {
    id: string;
    key: string;
    label: string;
    category?: string;
    valuePreview: string;
    isSecret: boolean;
    hasValue: boolean;
    updatedBy: string;
    createdAt: string;
    updatedAt: string;
}
export declare class ApiSettingsService {
    private readonly apiSettingsRepository;
    private readonly auditService;
    private readonly configService;
    private readonly governanceService;
    constructor(apiSettingsRepository: ApiSettingsRepository, auditService: AuditService, configService: ConfigService, governanceService: GovernanceService);
    health(): {
        status: string;
    };
    list(): Promise<ApiSettingView[]>;
    upsert(dto: UpsertApiSettingDto, user: AuthenticatedUser): Promise<ApiSettingView>;
    remove(id: string, user: AuthenticatedUser): Promise<{
        ok: true;
    }>;
    runtimeMetadata(): Promise<{
        profileId: string;
        configuredChannels: string;
        integrations: Array<{
            key: string;
            configured: boolean;
        }>;
    }>;
    private toView;
}
