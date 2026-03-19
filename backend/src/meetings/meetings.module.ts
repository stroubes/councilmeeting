import { Module } from '@nestjs/common';
import { MeetingTypesModule } from '../meeting-types/meeting-types.module';
import { MeetingsController } from './meetings.controller';
import { MeetingsService } from './meetings.service';
import { MeetingsRepository } from './meetings.repository';

@Module({
  imports: [MeetingTypesModule],
  controllers: [MeetingsController],
  providers: [MeetingsService, MeetingsRepository],
  exports: [MeetingsService],
})
export class MeetingsModule {}
