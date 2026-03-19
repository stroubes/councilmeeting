import { Module } from '@nestjs/common';
import { MinutesController } from './minutes.controller';
import { MinutesService } from './minutes.service';
import { MinutesRepository } from './minutes.repository';
import { MeetingsModule } from '../meetings/meetings.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [MeetingsModule, AuditModule, NotificationsModule],
  controllers: [MinutesController],
  providers: [MinutesService, MinutesRepository],
  exports: [MinutesService],
})
export class MinutesModule {}
