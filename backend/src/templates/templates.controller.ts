import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, StreamableFile } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { PERMISSIONS } from '../core/constants/permissions.constants';
import { CurrentUser } from '../core/decorators/current-user.decorator';
import { Permissions } from '../core/decorators/permissions.decorator';
import { Public } from '../core/decorators/public.decorator';
import { CreateTemplateDto } from './dto/create-template.dto';
import { CreateTemplateSectionDto } from './dto/create-template-section.dto';
import { ReorderTemplateSectionsDto } from './dto/reorder-template-sections.dto';
import { TemplateQueryDto } from './dto/template-query.dto';
import { UpdateTemplateSectionDto } from './dto/update-template-section.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { TemplatesService } from './templates.service';

@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  @Public()
  @Get('health')
  health(): { status: string } {
    return this.templatesService.health();
  }

  @Permissions(PERMISSIONS.MEETING_READ)
  @Get()
  list(@Query() query: TemplateQueryDto) {
    return this.templatesService.list(query);
  }

  @Permissions(PERMISSIONS.MEETING_READ)
  @Get(':id')
  getById(@Param('id') id: string) {
    return this.templatesService.getById(id);
  }

  @Permissions(PERMISSIONS.TEMPLATES_MANAGE)
  @Post()
  create(@Body() dto: CreateTemplateDto, @CurrentUser() user: AuthenticatedUser) {
    return this.templatesService.create(dto, user);
  }

  @Permissions(PERMISSIONS.TEMPLATES_MANAGE)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTemplateDto, @CurrentUser() user: AuthenticatedUser) {
    return this.templatesService.update(id, dto, user);
  }

  @Permissions(PERMISSIONS.TEMPLATES_MANAGE)
  @Post(':id/sections')
  addSection(
    @Param('id') id: string,
    @Body() dto: CreateTemplateSectionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.templatesService.addSection(id, dto, user);
  }

  @Permissions(PERMISSIONS.TEMPLATES_MANAGE)
  @Patch(':id/sections/:sectionId')
  updateSection(
    @Param('id') id: string,
    @Param('sectionId') sectionId: string,
    @Body() dto: UpdateTemplateSectionDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.templatesService.updateSection(id, sectionId, dto, user);
  }

  @Permissions(PERMISSIONS.TEMPLATES_MANAGE)
  @Delete(':id/sections/:sectionId')
  removeSection(@Param('id') id: string, @Param('sectionId') sectionId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.templatesService.removeSection(id, sectionId, user);
  }

  @Permissions(PERMISSIONS.TEMPLATES_MANAGE)
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.templatesService.remove(id, user);
  }

  @Permissions(PERMISSIONS.TEMPLATES_MANAGE)
  @Post(':id/sections/reorder')
  reorderSections(
    @Param('id') id: string,
    @Body() dto: ReorderTemplateSectionsDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.templatesService.reorderSections(id, dto, user);
  }

  @Permissions(PERMISSIONS.MEETING_READ)
  @Get(':id/export-docx')
  async exportDocx(@Param('id') id: string, @Res({ passthrough: true }) response: { setHeader: (name: string, value: string) => void }) {
    const exported = await this.templatesService.exportDocx(id);
    response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    response.setHeader('Content-Disposition', `attachment; filename="${exported.fileName}"`);
    return new StreamableFile(exported.buffer);
  }
}
