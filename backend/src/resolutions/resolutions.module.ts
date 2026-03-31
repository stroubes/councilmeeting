import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { ActionsModule } from '../actions/actions.module';
import { ResolutionsController } from './resolutions.controller';
import { ResolutionsRepository } from './resolutions.repository';
import { ResolutionsService } from './resolutions.service';

@Module({
  imports: [AuditModule, ActionsModule],
  controllers: [ResolutionsController],
  providers: [ResolutionsRepository, ResolutionsService],
  exports: [ResolutionsService],
})
export class ResolutionsModule {}
