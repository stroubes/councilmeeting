import { Module } from '@nestjs/common';
import { AgendasModule } from '../agendas/agendas.module';
import { AuditModule } from '../audit/audit.module';
import { MeetingsModule } from '../meetings/meetings.module';
import { MotionsModule } from '../motions/motions.module';
import { PresentationsModule } from '../presentations/presentations.module';
import { MeetingDisplayController } from './meeting-display.controller';
import { MeetingDisplayRepository } from './meeting-display.repository';
import { MeetingDisplayService } from './meeting-display.service';

@Module({
  imports: [MeetingsModule, AgendasModule, MotionsModule, PresentationsModule, AuditModule],
  controllers: [MeetingDisplayController],
  providers: [MeetingDisplayService, MeetingDisplayRepository],
  exports: [MeetingDisplayService],
})
export class MeetingDisplayModule {}
