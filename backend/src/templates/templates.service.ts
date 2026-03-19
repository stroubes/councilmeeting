import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { AuditService } from '../audit/audit.service';
import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx';
import type { CreateTemplateDto } from './dto/create-template.dto';
import type { CreateTemplateSectionDto } from './dto/create-template-section.dto';
import type { ReorderTemplateSectionsDto } from './dto/reorder-template-sections.dto';
import type { TemplateQueryDto } from './dto/template-query.dto';
import type { UpdateTemplateSectionDto } from './dto/update-template-section.dto';
import type { UpdateTemplateDto } from './dto/update-template.dto';
import { TemplatesRepository, type TemplateRecord } from './templates.repository';

@Injectable()
export class TemplatesService {
  constructor(
    private readonly templatesRepository: TemplatesRepository,
    private readonly auditService: AuditService,
  ) {}

  health(): { status: string } {
    return { status: 'ok' };
  }

  async create(dto: CreateTemplateDto, user: AuthenticatedUser): Promise<TemplateRecord> {
    const created = await this.templatesRepository.create({
      type: dto.type,
      code: dto.code.trim().toUpperCase(),
      name: dto.name.trim(),
      description: dto.description?.trim(),
      isActive: dto.isActive ?? true,
      createdBy: user.id,
    });
    await this.auditService.log({
      actorUserId: user.id,
      action: 'template.create',
      entityType: 'template',
      entityId: created.id,
    });
    return created;
  }

  list(query: TemplateQueryDto): Promise<TemplateRecord[]> {
    return this.templatesRepository.list({
      type: query.type,
      includeInactive: query.includeInactive === 'true',
    });
  }

  getById(id: string): Promise<TemplateRecord> {
    return this.templatesRepository.getById(id);
  }

  async exportDocx(id: string): Promise<{ fileName: string; buffer: Buffer }> {
    const template = await this.templatesRepository.getById(id);
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: template.name,
              heading: HeadingLevel.TITLE,
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Template Code: ${template.code}`, bold: true }),
              ],
            }),
            new Paragraph({
              children: [
                new TextRun({ text: `Template Type: ${template.type}`, bold: true }),
              ],
            }),
            new Paragraph(''),
            ...template.sections
              .sort((left, right) => left.sortOrder - right.sortOrder)
              .flatMap((section) => [
                new Paragraph({
                  text: `${section.sortOrder}. ${section.title}`,
                  heading: HeadingLevel.HEADING_1,
                }),
                new Paragraph(section.description ?? 'Describe this section here.'),
                new Paragraph(''),
              ]),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const safeName = template.name.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase();
    return {
      fileName: `${safeName || template.code.toLowerCase()}-template.docx`,
      buffer,
    };
  }

  async update(id: string, dto: UpdateTemplateDto, user: AuthenticatedUser): Promise<TemplateRecord> {
    const current = await this.templatesRepository.getById(id);
    const updated = await this.templatesRepository.update(id, {
      name: dto.name?.trim(),
      description: dto.description?.trim(),
      isActive: dto.isActive,
      version: current.version + 1,
    });
    await this.auditService.log({
      actorUserId: user.id,
      action: 'template.update',
      entityType: 'template',
      entityId: updated.id,
    });
    return updated;
  }

  async addSection(templateId: string, dto: CreateTemplateSectionDto, user: AuthenticatedUser): Promise<TemplateRecord> {
    const template = await this.templatesRepository.getById(templateId);
    await this.templatesRepository.addSection({
      templateId,
      title: dto.title.trim(),
      description: dto.description?.trim(),
      sectionType: dto.sectionType?.trim(),
      itemType: dto.itemType?.trim(),
      isRequired: dto.isRequired ?? false,
      sortOrder: template.sections.length + 1,
    });
    await this.bumpVersion(templateId);
    await this.auditService.log({
      actorUserId: user.id,
      action: 'template.section.create',
      entityType: 'template',
      entityId: templateId,
    });
    return this.templatesRepository.getById(templateId);
  }

  async updateSection(
    templateId: string,
    sectionId: string,
    dto: UpdateTemplateSectionDto,
    user: AuthenticatedUser,
  ): Promise<TemplateRecord> {
    await this.templatesRepository.updateSection(templateId, sectionId, {
      title: dto.title?.trim(),
      description: dto.description?.trim(),
      sectionType: dto.sectionType?.trim(),
      itemType: dto.itemType?.trim(),
      isRequired: dto.isRequired,
    });
    await this.bumpVersion(templateId);
    await this.auditService.log({
      actorUserId: user.id,
      action: 'template.section.update',
      entityType: 'template',
      entityId: templateId,
      changesJson: { sectionId },
    });
    return this.templatesRepository.getById(templateId);
  }

  async removeSection(templateId: string, sectionId: string, user: AuthenticatedUser): Promise<TemplateRecord> {
    await this.templatesRepository.removeSection(templateId, sectionId);
    await this.bumpVersion(templateId);
    await this.auditService.log({
      actorUserId: user.id,
      action: 'template.section.delete',
      entityType: 'template',
      entityId: templateId,
      changesJson: { sectionId },
    });
    return this.templatesRepository.getById(templateId);
  }

  async reorderSections(
    templateId: string,
    dto: ReorderTemplateSectionsDto,
    user: AuthenticatedUser,
  ): Promise<TemplateRecord> {
    const template = await this.templatesRepository.getById(templateId);
    if (dto.sectionIdsInOrder.length !== template.sections.length) {
      throw new BadRequestException('Reorder payload must include all template sections');
    }

    for (const sectionId of dto.sectionIdsInOrder) {
      if (!template.sections.some((section) => section.id === sectionId)) {
        throw new NotFoundException(`Template section ${sectionId} not found`);
      }
    }

    await this.templatesRepository.reorderSections(templateId, dto.sectionIdsInOrder);
    await this.bumpVersion(templateId);
    await this.auditService.log({
      actorUserId: user.id,
      action: 'template.section.reorder',
      entityType: 'template',
      entityId: templateId,
    });
    return this.templatesRepository.getById(templateId);
  }

  async remove(id: string, user: AuthenticatedUser): Promise<{ ok: true }> {
    await this.templatesRepository.remove(id);
    await this.auditService.log({
      actorUserId: user.id,
      action: 'template.delete',
      entityType: 'template',
      entityId: id,
    });
    return { ok: true };
  }

  private async bumpVersion(templateId: string): Promise<void> {
    const refreshed = await this.templatesRepository.getById(templateId);
    await this.templatesRepository.update(templateId, { version: refreshed.version + 1 });
  }
}
