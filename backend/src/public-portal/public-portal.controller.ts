import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { PERMISSIONS } from '../core/constants/permissions.constants';
import { Permissions } from '../core/decorators/permissions.decorator';
import { Public } from '../core/decorators/public.decorator';
import { CreatePublicSubscriptionDto } from './dto/create-public-subscription.dto';
import { UpdatePublicSubscriptionDto } from './dto/update-public-subscription.dto';
import { PublicPortalService } from './public-portal.service';

@Controller('public')
export class PublicPortalController {
  constructor(private readonly publicPortalService: PublicPortalService) {}

  @Public()
  @Get('summary')
  summary() {
    return this.publicPortalService.summary();
  }

  @Public()
  @Get('meetings')
  meetings() {
    return this.publicPortalService.listMeetings();
  }

  @Public()
  @Get('agendas')
  agendas() {
    return this.publicPortalService.listAgendas();
  }

  @Public()
  @Get('reports')
  reports() {
    return this.publicPortalService.listReports();
  }

  @Public()
  @Get('minutes')
  minutes() {
    return this.publicPortalService.listMinutes();
  }

  @Public()
  @Post('subscriptions')
  createSubscription(@Body() dto: CreatePublicSubscriptionDto) {
    return this.publicPortalService.createSubscription(dto);
  }

  @Public()
  @Get('subscriptions')
  listSubscriptions(@Query('email') email: string) {
    return this.publicPortalService.listSubscriptionsByEmail(email);
  }

  @Public()
  @Patch('subscriptions/:id')
  updateSubscription(@Param('id') id: string, @Body() dto: UpdatePublicSubscriptionDto) {
    return this.publicPortalService.updateSubscription(id, dto);
  }

  @Public()
  @Delete('subscriptions/:id')
  async removeSubscription(@Param('id') id: string): Promise<{ ok: true }> {
    await this.publicPortalService.removeSubscription(id);
    return { ok: true };
  }

  @Public()
  @Get('subscriptions/:id/preview')
  previewSubscription(@Param('id') id: string) {
    return this.publicPortalService.previewSubscriptionAlerts(id);
  }

  @Permissions(PERMISSIONS.USERS_MANAGE)
  @Post('subscriptions/digest/run')
  runDigestSweep() {
    return this.publicPortalService.runDigestSweep();
  }
}
