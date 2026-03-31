import { Module } from '@nestjs/common';
import { MinutesController } from './minutes.controller';
import { MinutesService } from './minutes.service';
import { MinutesRepository } from './minutes.repository';
import { MeetingsModule } from '../meetings/meetings.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { AttendeesModule } from '../attendees/attendees.module';
import { MotionsModule } from '../motions/motions.module';
import { VotesModule } from '../votes/votes.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MeetingsModule,
    AuditModule,
    NotificationsModule,
    AttendeesModule,
    MotionsModule,
    VotesModule,
    UsersModule,
  ],
  controllers: [MinutesController],
  providers: [MinutesService, MinutesRepository],
  exports: [MinutesService],
})
export class MinutesModule {}
