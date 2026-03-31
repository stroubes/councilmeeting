import { Module } from '@nestjs/common';
import { AgendasController } from './agendas.controller';
import { AgendasService } from './agendas.service';
import { AgendasRepository } from './agendas.repository';
import { MeetingsModule } from '../meetings/meetings.module';
import { AuditModule } from '../audit/audit.module';
import { TemplatesModule } from '../templates/templates.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { GovernanceModule } from '../governance/governance.module';
import { MeetingTypesModule } from '../meeting-types/meeting-types.module';

@Module({
  imports: [MeetingsModule, AuditModule, TemplatesModule, NotificationsModule, GovernanceModule, MeetingTypesModule],
  controllers: [AgendasController],
  providers: [AgendasService, AgendasRepository],
  exports: [AgendasService],
})
export class AgendasModule {}
