import { Module } from '@nestjs/common';
import { WorkflowsController } from './workflows.controller';
import { WorkflowsService } from './workflows.service';
import { ReportsModule } from '../reports/reports.module';
import { WorkflowConfigRepository } from './workflow-config.repository';
import { RoleDelegationsRepository } from './role-delegations.repository';

@Module({
  imports: [ReportsModule],
  controllers: [WorkflowsController],
  providers: [WorkflowsService, WorkflowConfigRepository, RoleDelegationsRepository],
  exports: [WorkflowsService],
})
export class WorkflowsModule {}
