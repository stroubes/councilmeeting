import { Module } from '@nestjs/common';
import { GovernanceController } from './governance.controller';
import { GovernanceSettingsRepository } from './governance-settings.repository';
import { GovernanceService } from './governance.service';

@Module({
  controllers: [GovernanceController],
  providers: [GovernanceService, GovernanceSettingsRepository],
  exports: [GovernanceService],
})
export class GovernanceModule {}
