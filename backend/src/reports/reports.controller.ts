import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { Public } from '../core/decorators/public.decorator';
import { Permissions } from '../core/decorators/permissions.decorator';
import { PERMISSIONS } from '../core/constants/permissions.constants';
import { CurrentUser } from '../core/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreateStaffReportDto } from './dto/create-staff-report.dto';
import { CreateReportAttachmentDto } from './dto/create-report-attachment.dto';
import { ImportDocxReportDto } from './dto/import-docx-report.dto';
import { ReportQueryDto } from './dto/report-query.dto';
import { UpdateStaffReportDto } from './dto/update-staff-report.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Public()
  @Get('health')
  health(): { status: string } {
    return this.reportsService.health();
  }

  @Permissions(PERMISSIONS.REPORT_SUBMIT)
  @Post()
  create(@Body() dto: CreateStaffReportDto, @CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.create(dto, user);
  }

  @Permissions(PERMISSIONS.REPORT_SUBMIT)
  @Post('import-docx')
  importDocx(@Body() dto: ImportDocxReportDto, @CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.importDocx(dto, user);
  }

  @Permissions(PERMISSIONS.MEETING_READ)
  @Get()
  list(@Query() query: ReportQueryDto) {
    return this.reportsService.list(query);
  }

  @Permissions(PERMISSIONS.MEETING_READ)
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.reportsService.getById(id);
  }

  @Permissions(PERMISSIONS.REPORT_SUBMIT)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateStaffReportDto, @CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.update(id, dto, user);
  }

  @Permissions(PERMISSIONS.REPORT_SUBMIT)
  @Post(':id/submit')
  submitForDirector(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.submitForDirector(id, user);
  }

  @Permissions(PERMISSIONS.PUBLIC_PUBLISH)
  @Post(':id/publish')
  publish(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.publish(id, user);
  }

  @Permissions(PERMISSIONS.MEETING_READ)
  @Get(':id/attachments')
  listAttachments(@Param('id') id: string) {
    return this.reportsService.listAttachments(id);
  }

  @Permissions(PERMISSIONS.REPORT_SUBMIT)
  @Post(':id/attachments')
  addAttachment(
    @Param('id') id: string,
    @Body() dto: CreateReportAttachmentDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reportsService.addAttachment(id, dto, user);
  }

  @Permissions(PERMISSIONS.REPORT_SUBMIT)
  @Delete(':id/attachments/:attachmentId')
  removeAttachment(
    @Param('id') id: string,
    @Param('attachmentId') attachmentId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reportsService.removeAttachment(id, attachmentId, user);
  }

  @Permissions(PERMISSIONS.REPORT_SUBMIT)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.remove(id, user);
  }
}
