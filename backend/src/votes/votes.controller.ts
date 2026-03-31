import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Permissions } from '../core/decorators/permissions.decorator';
import { PERMISSIONS } from '../core/constants/permissions.constants';
import { CurrentUser } from '../core/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CastVoteDto, UpdateVoteDto } from './dto/cast-vote.dto';
import { VotesService } from './votes.service';

@Controller('votes')
export class VotesController {
  constructor(private readonly votesService: VotesService) {}

  @Permissions(PERMISSIONS.VOTE_RECORD)
  @Post()
  castVote(@Body() dto: CastVoteDto, @CurrentUser() user: AuthenticatedUser) {
    return this.votesService.castVote(dto, user);
  }

  @Permissions(PERMISSIONS.MEETING_READ)
  @Get('motion/:motionId')
  listByMotion(@Param('motionId') motionId: string) {
    return this.votesService.listByMotion(motionId);
  }

  @Permissions(PERMISSIONS.MEETING_READ)
  @Get('motion/:motionId/tally')
  getTally(@Param('motionId') motionId: string) {
    return this.votesService.getTally(motionId);
  }

  @Permissions(PERMISSIONS.MEETING_READ)
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.votesService.getVote(id);
  }

  @Permissions(PERMISSIONS.VOTE_RECORD)
  @Patch(':id')
  updateVote(@Param('id') id: string, @Body() dto: UpdateVoteDto) {
    return this.votesService.updateVote(id, dto);
  }

  @Permissions(PERMISSIONS.VOTE_RECORD)
  @Delete(':id')
  removeVote(@Param('id') id: string) {
    return this.votesService.removeVote(id);
  }
}