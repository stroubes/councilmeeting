import { Module } from '@nestjs/common';
import { PublicPortalController } from './public-portal.controller';
import { PublicPortalService } from './public-portal.service';
import { PublicDigestScheduler } from './public-digest.scheduler';
import { PublicSubscriptionsRepository } from './public-subscriptions.repository';
import { MeetingsModule } from '../meetings/meetings.module';
import { AgendasModule } from '../agendas/agendas.module';
import { ReportsModule } from '../reports/reports.module';
import { MinutesModule } from '../minutes/minutes.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [MeetingsModule, AgendasModule, ReportsModule, MinutesModule, NotificationsModule],
  controllers: [PublicPortalController],
  providers: [PublicPortalService, PublicSubscriptionsRepository, PublicDigestScheduler],
  exports: [PublicPortalService],
})
export class PublicPortalModule {}
