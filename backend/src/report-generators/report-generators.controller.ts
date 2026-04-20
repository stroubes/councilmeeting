import { Controller, Get, Query } from '@nestjs/common';
import { ReportGeneratorsService } from './report-generators.service';
import { Permissions } from '../core/decorators/permissions.decorator';
import { PERMISSIONS } from '../core/constants/permissions.constants';

@Controller('report-generators')
export class ReportGeneratorsController {
  constructor(private readonly reportGeneratorsService: ReportGeneratorsService) {}

  @Permissions(PERMISSIONS.MEETING_READ)
  @Get('attendance')
  async getAttendanceReport(
    @Query('startsAtFrom') startsAtFrom?: string,
    @Query('startsAtTo') startsAtTo?: string,
    @Query('meetingId') meetingId?: string,
  ) {
    return this.reportGeneratorsService.generateAttendanceReport({ startsAtFrom, startsAtTo, meetingId });
  }

  @Permissions(PERMISSIONS.MEETING_READ)
  @Get('motions')
  async getMotionReport(
    @Query('startsAtFrom') startsAtFrom?: string,
    @Query('startsAtTo') startsAtTo?: string,
    @Query('meetingId') meetingId?: string,
    @Query('status') status?: string,
  ) {
    return this.reportGeneratorsService.generateMotionReport({ startsAtFrom, startsAtTo, meetingId, status });
  }

  @Permissions(PERMISSIONS.MEETING_READ)
  @Get('voting')
  async getVotingReport(
    @Query('startsAtFrom') startsAtFrom?: string,
    @Query('startsAtTo') startsAtTo?: string,
    @Query('meetingId') meetingId?: string,
    @Query('motionId') motionId?: string,
  ) {
    return this.reportGeneratorsService.generateVotingReport({ startsAtFrom, startsAtTo, meetingId, motionId });
  }

  @Permissions(PERMISSIONS.MEETING_READ)
  @Get('conflicts')
  async getConflictReport(
    @Query('startsAtFrom') startsAtFrom?: string,
    @Query('startsAtTo') startsAtTo?: string,
    @Query('meetingId') meetingId?: string,
  ) {
    return this.reportGeneratorsService.generateConflictOfInterestReport({ startsAtFrom, startsAtTo, meetingId });
  }

  @Permissions(PERMISSIONS.MEETING_READ)
  @Get('forecast')
  async getForecastReport(
    @Query('startsAtFrom') startsAtFrom?: string,
    @Query('startsAtTo') startsAtTo?: string,
    @Query('meetingTypeCode') meetingTypeCode?: string,
  ) {
    return this.reportGeneratorsService.generateForecastReport({ startsAtFrom, startsAtTo, meetingTypeCode });
  }
}