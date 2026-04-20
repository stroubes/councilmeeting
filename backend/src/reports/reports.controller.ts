import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Query, Res } from '@nestjs/common';
import { existsSync } from 'node:fs';
import { basename, join } from 'node:path';
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
import { PaginationQueryDto } from '../types/pagination-query.dto';
import { BulkReportActionDto } from './dto/bulk-report-action.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Public()
  @Get('health')
  health(): { status: string } {
    return this.reportsService.health();
  }

  @Public()
  @Get('local-attachments/:fileName')
  downloadLocalAttachment(@Param('fileName') fileName: string, @Res() response: any) {
    const safeFileName = basename(fileName);
    if (safeFileName !== fileName) {
      throw new NotFoundException('Attachment not found');
    }

    const filePath = join(process.cwd(), '.local-report-attachments', safeFileName);
    if (!existsSync(filePath)) {
      throw new NotFoundException('Attachment not found');
    }

    return response.sendFile(filePath);
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
  @Get('paged')
  listPaged(@Query() query: ReportQueryDto & PaginationQueryDto) {
    return this.reportsService.listPaged(query);
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

  @Permissions(PERMISSIONS.REPORT_SUBMIT)
  @Post('bulk-action')
  bulkAction(@Body() dto: BulkReportActionDto, @CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.runBulkAction(dto, user);
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
