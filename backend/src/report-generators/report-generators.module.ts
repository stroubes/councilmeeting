import { Module } from '@nestjs/common';
import { ReportGeneratorsController } from './report-generators.controller';
import { ReportGeneratorsService } from './report-generators.service';
import { MeetingsModule } from '../meetings/meetings.module';
import { MotionsModule } from '../motions/motions.module';
import { VotesModule } from '../votes/votes.module';
import { ConflictDeclarationsModule } from '../conflict-declarations/conflict-declarations.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    MeetingsModule,
    MotionsModule,
    VotesModule,
    ConflictDeclarationsModule,
    UsersModule,
  ],
  controllers: [ReportGeneratorsController],
  providers: [ReportGeneratorsService],
  exports: [ReportGeneratorsService],
})
export class ReportGeneratorsModule {}