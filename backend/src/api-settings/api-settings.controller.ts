import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { CurrentUser } from '../core/decorators/current-user.decorator';
import { Permissions } from '../core/decorators/permissions.decorator';
import { Public } from '../core/decorators/public.decorator';
import { PERMISSIONS } from '../core/constants/permissions.constants';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { ApiSettingsService } from './api-settings.service';
import { UpsertApiSettingDto } from './dto/upsert-api-setting.dto';

@Controller('api-settings')
export class ApiSettingsController {
  constructor(private readonly apiSettingsService: ApiSettingsService) {}

  @Public()
  @Get('health')
  health(): { status: string } {
    return this.apiSettingsService.health();
  }

  @Permissions(PERMISSIONS.USERS_MANAGE)
  @Get()
  list() {
    return this.apiSettingsService.list();
  }

  @Permissions(PERMISSIONS.USERS_MANAGE)
  @Get('runtime-metadata')
  runtimeMetadata() {
    return this.apiSettingsService.runtimeMetadata();
  }

  @Permissions(PERMISSIONS.USERS_MANAGE)
  @Post()
  upsert(@Body() dto: UpsertApiSettingDto, @CurrentUser() user: AuthenticatedUser) {
    return this.apiSettingsService.upsert(dto, user);
  }

  @Permissions(PERMISSIONS.USERS_MANAGE)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.apiSettingsService.remove(id, user);
  }
}
