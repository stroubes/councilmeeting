import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { DocxParserService } from './parsers/docx-parser.service';
import { ReportsRepository } from './reports.repository';
import { SharePointDocxService } from './parsers/sharepoint-docx.service';
import { AgendasModule } from '../agendas/agendas.module';
import { AuditModule } from '../audit/audit.module';
import { TemplatesModule } from '../templates/templates.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { GovernanceModule } from '../governance/governance.module';

@Module({
  imports: [AgendasModule, AuditModule, TemplatesModule, NotificationsModule, GovernanceModule],
  controllers: [ReportsController],
  providers: [ReportsService, DocxParserService, SharePointDocxService, ReportsRepository],
  exports: [ReportsService],
})
export class ReportsModule {}
