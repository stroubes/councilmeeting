import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Permissions } from '../core/decorators/permissions.decorator';
import { PERMISSIONS } from '../core/constants/permissions.constants';
import { CurrentUser } from '../core/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreateBylawDto } from './dto/create-bylaw.dto';
import { UpdateBylawDto } from './dto/update-bylaw.dto';
import { BylawsService } from './bylaws.service';

@Controller('bylaws')
export class BylawsController {
  constructor(private readonly bylawsService: BylawsService) {}

  @Permissions(PERMISSIONS.BYLAW_READ)
  @Get()
  list(@Query('status') status?: string) {
    if (status === 'ACTIVE') {
      return this.bylawsService.listActive();
    }
    return this.bylawsService.list();
  }

  @Permissions(PERMISSIONS.BYLAW_READ)
  @Get('number/:bylawNumber')
  getByNumber(@Param('bylawNumber') bylawNumber: string) {
    return this.bylawsService.getByNumber(bylawNumber);
  }

  @Permissions(PERMISSIONS.BYLAW_READ)
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.bylawsService.getById(id);
  }

  @Permissions(PERMISSIONS.BYLAW_WRITE)
  @Post()
  create(@Body() dto: CreateBylawDto, @CurrentUser() user: AuthenticatedUser) {
    return this.bylawsService.create(dto, user);
  }

  @Permissions(PERMISSIONS.BYLAW_WRITE)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateBylawDto, @CurrentUser() user: AuthenticatedUser) {
    return this.bylawsService.update(id, dto, user);
  }

  @Permissions(PERMISSIONS.BYLAW_WRITE)
  @Post(':id/amend')
  amend(@Param('id') id: string, @Body() dto: UpdateBylawDto, @CurrentUser() user: AuthenticatedUser) {
    return this.bylawsService.amend(id, dto, user);
  }

  @Permissions(PERMISSIONS.BYLAW_WRITE)
  @Post(':id/repeal')
  repeal(@Param('id') id: string, @Body() body: { meetingId: string }, @CurrentUser() user: AuthenticatedUser) {
    return this.bylawsService.repeal(id, body.meetingId, user);
  }

  @Permissions(PERMISSIONS.BYLAW_WRITE)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.bylawsService.remove(id);
  }
}
