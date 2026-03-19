import { Module } from '@nestjs/common';
import { MeetingTypesController } from './meeting-types.controller';
import { MeetingTypesRepository } from './meeting-types.repository';
import { MeetingTypesService } from './meeting-types.service';

@Module({
  controllers: [MeetingTypesController],
  providers: [MeetingTypesService, MeetingTypesRepository],
  exports: [MeetingTypesService],
})
export class MeetingTypesModule {}
