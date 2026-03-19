import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { GovernanceModule } from '../governance/governance.module';
import { ApiSettingsController } from './api-settings.controller';
import { ApiSettingsRepository } from './api-settings.repository';
import { ApiSettingsService } from './api-settings.service';

@Module({
  imports: [AuditModule, GovernanceModule],
  controllers: [ApiSettingsController],
  providers: [ApiSettingsService, ApiSettingsRepository],
  exports: [ApiSettingsService],
})
export class ApiSettingsModule {}
