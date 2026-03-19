import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { MeetingsModule } from '../meetings/meetings.module';
import { MotionsController } from './motions.controller';
import { MotionsRepository } from './motions.repository';
import { MotionsService } from './motions.service';

@Module({
  imports: [MeetingsModule, AuditModule],
  controllers: [MotionsController],
  providers: [MotionsService, MotionsRepository],
  exports: [MotionsService],
})
export class MotionsModule {}
