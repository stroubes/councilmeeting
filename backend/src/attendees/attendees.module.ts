import { Module } from '@nestjs/common';
import { AttendeesController } from './attendees.controller';
import { AttendeesRepository } from './attendees.repository';
import { AttendeesService } from './attendees.service';
import { MeetingsModule } from '../meetings/meetings.module';

@Module({
  imports: [MeetingsModule],
  controllers: [AttendeesController],
  providers: [AttendeesRepository, AttendeesService],
  exports: [AttendeesService, AttendeesRepository],
})
export class AttendeesModule {}