import { StreamableFile } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreateTemplateDto } from './dto/create-template.dto';
import { CreateTemplateSectionDto } from './dto/create-template-section.dto';
import { ReorderTemplateSectionsDto } from './dto/reorder-template-sections.dto';
import { TemplateQueryDto } from './dto/template-query.dto';
import { UpdateTemplateSectionDto } from './dto/update-template-section.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { TemplatesService } from './templates.service';
export declare class TemplatesController {
    private readonly templatesService;
    constructor(templatesService: TemplatesService);
    health(): {
        status: string;
    };
    list(query: TemplateQueryDto): Promise<import("./templates.repository").TemplateRecord[]>;
    getById(id: string): Promise<import("./templates.repository").TemplateRecord>;
    create(dto: CreateTemplateDto, user: AuthenticatedUser): Promise<import("./templates.repository").TemplateRecord>;
    update(id: string, dto: UpdateTemplateDto, user: AuthenticatedUser): Promise<import("./templates.repository").TemplateRecord>;
    addSection(id: string, dto: CreateTemplateSectionDto, user: AuthenticatedUser): Promise<import("./templates.repository").TemplateRecord>;
    updateSection(id: string, sectionId: string, dto: UpdateTemplateSectionDto, user: AuthenticatedUser): Promise<import("./templates.repository").TemplateRecord>;
    removeSection(id: string, sectionId: string, user: AuthenticatedUser): Promise<import("./templates.repository").TemplateRecord>;
    remove(id: string, user: AuthenticatedUser): Promise<{
        ok: true;
    }>;
    reorderSections(id: string, dto: ReorderTemplateSectionsDto, user: AuthenticatedUser): Promise<import("./templates.repository").TemplateRecord>;
    exportDocx(id: string, response: {
        setHeader: (name: string, value: string) => void;
    }): Promise<StreamableFile>;
}
