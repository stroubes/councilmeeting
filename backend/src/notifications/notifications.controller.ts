import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { PERMISSIONS } from '../core/constants/permissions.constants';
import { Permissions } from '../core/decorators/permissions.decorator';
import { Public } from '../core/decorators/public.decorator';
import type { NotificationDeliveryStatus } from './notifications.repository';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Public()
  @Get('health')
  health(): { status: string } {
    return this.notificationsService.health();
  }

  @Permissions(PERMISSIONS.USERS_MANAGE)
  @Get('events')
  list(
    @Query('status') status?: NotificationDeliveryStatus,
    @Query('eventType') eventType?: string,
    @Query('limit') limit?: string,
  ) {
    return this.notificationsService.list({
      status,
      eventType,
      limit: limit ? Number.parseInt(limit, 10) : undefined,
    });
  }

  @Permissions(PERMISSIONS.USERS_MANAGE)
  @Get('summary')
  summary() {
    return this.notificationsService.summary();
  }

  @Permissions(PERMISSIONS.USERS_MANAGE)
  @Get('observability')
  observability() {
    return this.notificationsService.observability();
  }

  @Permissions(PERMISSIONS.USERS_MANAGE)
  @Post('events/:id/retry')
  retry(@Param('id') id: string) {
    return this.notificationsService.retry(id);
  }
}
