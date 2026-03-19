import { Module } from '@nestjs/common';
import { AgendasModule } from '../agendas/agendas.module';
import { MeetingsModule } from '../meetings/meetings.module';
import { MinutesModule } from '../minutes/minutes.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ReportsModule } from '../reports/reports.module';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';

@Module({
  imports: [MeetingsModule, AgendasModule, ReportsModule, MinutesModule, NotificationsModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
