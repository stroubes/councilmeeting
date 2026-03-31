import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { ActionsController } from './actions.controller';
import { ActionsRepository } from './actions.repository';
import { ActionsService } from './actions.service';

@Module({
  imports: [AuditModule],
  controllers: [ActionsController],
  providers: [ActionsRepository, ActionsService],
  exports: [ActionsService],
})
export class ActionsModule {}
