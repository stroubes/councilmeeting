import { Injectable } from '@nestjs/common';
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

@Injectable()
export class ApiSettingsService {
  constructor(
    private readonly apiSettingsRepository: ApiSettingsRepository,
    private readonly auditService: AuditService,
    private readonly configService: ConfigService,
    private readonly governanceService: GovernanceService,
  ) {}

  health(): { status: string } {
    return { status: 'ok' };
  }

  async list(): Promise<ApiSettingView[]> {
    const records = await this.apiSettingsRepository.list();
    return records.map((record) => this.toView(record));
  }

  async upsert(dto: UpsertApiSettingDto, user: AuthenticatedUser): Promise<ApiSettingView> {
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

  async remove(id: string, user: AuthenticatedUser): Promise<{ ok: true }> {
    await this.apiSettingsRepository.remove(id);
    await this.auditService.log({
      actorUserId: user.id,
      action: 'api_settings.delete',
      entityType: 'api_setting',
      entityId: id,
    });
    return { ok: true };
  }

  async runtimeMetadata(): Promise<{
    profileId: string;
    configuredChannels: string;
    integrations: Array<{ key: string; configured: boolean }>;
  }> {
    const activeProfile = await this.governanceService.getActiveProfile();
    const configuredChannels = this.configService.get<string>('notificationChannels') ?? 'IN_APP';
    const integrations = [
      { key: 'MS_TENANT_ID', configured: Boolean(this.configService.get<string>('microsoft.tenantId')) },
      { key: 'MS_CLIENT_ID', configured: Boolean(this.configService.get<string>('microsoft.clientId')) },
      { key: 'MS_API_AUDIENCE', configured: Boolean(this.configService.get<string>('microsoft.apiAudience')) },
      { key: 'SHAREPOINT_SITE_ID', configured: Boolean(this.configService.get<string>('sharepoint.siteId')) },
      { key: 'SHAREPOINT_DRIVE_ID', configured: Boolean(this.configService.get<string>('sharepoint.driveId')) },
    ];

    return {
      profileId: activeProfile.id,
      configuredChannels,
      integrations,
    };
  }

  private toView(record: {
    id: string;
    key: string;
    label: string;
    category?: string;
    value: string;
    isSecret: boolean;
    updatedBy: string;
    createdAt: string;
    updatedAt: string;
  }): ApiSettingView {
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
}
