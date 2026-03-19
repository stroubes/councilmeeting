import { Body, Controller, Get, Patch } from '@nestjs/common';
import { Permissions } from '../core/decorators/permissions.decorator';
import { Public } from '../core/decorators/public.decorator';
import { PERMISSIONS } from '../core/constants/permissions.constants';
import { GovernanceService } from './governance.service';
import { SetActiveProfileDto } from './dto/set-active-profile.dto';

@Controller('governance')
export class GovernanceController {
  constructor(private readonly governanceService: GovernanceService) {}

  @Public()
  @Get('health')
  health(): { status: string } {
    return this.governanceService.health();
  }

  @Permissions(PERMISSIONS.MEETING_READ)
  @Get('profile')
  getActiveProfile() {
    return this.governanceService.getActiveProfile();
  }

  @Permissions(PERMISSIONS.MEETING_READ)
  @Get('profiles')
  listProfiles() {
    return this.governanceService.listProfiles();
  }

  @Permissions(PERMISSIONS.USERS_MANAGE)
  @Patch('profile')
  setActiveProfile(@Body() dto: SetActiveProfileDto) {
    return this.governanceService.setActiveProfile(dto.profileId);
  }

  @Permissions(PERMISSIONS.MEETING_READ)
  @Get('policy-pack')
  getPolicyPack() {
    return this.governanceService.getPolicyPack();
  }
}
