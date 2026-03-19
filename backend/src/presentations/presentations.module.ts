import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { MeetingsModule } from '../meetings/meetings.module';
import { PresentationsController } from './presentations.controller';
import { PresentationsRepository } from './presentations.repository';
import { PresentationsService } from './presentations.service';

@Module({
  imports: [MeetingsModule, AuditModule],
  controllers: [PresentationsController],
  providers: [PresentationsService, PresentationsRepository],
  exports: [PresentationsService],
})
export class PresentationsModule {}
