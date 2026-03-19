import { Controller, Get } from '@nestjs/common';
import { PERMISSIONS } from '../core/constants/permissions.constants';
import { Permissions } from '../core/decorators/permissions.decorator';
import { Public } from '../core/decorators/public.decorator';
import { AnalyticsService, type ExecutiveKpiSnapshot } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Public()
  @Get('health')
  health() {
    return this.analyticsService.health();
  }

  @Permissions(PERMISSIONS.USERS_MANAGE)
  @Get('executive-kpis')
  executiveKpis(): Promise<ExecutiveKpiSnapshot> {
    return this.analyticsService.executiveKpis();
  }
}
