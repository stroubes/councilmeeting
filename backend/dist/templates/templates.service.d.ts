import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { AuditService } from '../audit/audit.service';
import type { CreateTemplateDto } from './dto/create-template.dto';
import type { CreateTemplateSectionDto } from './dto/create-template-section.dto';
import type { ReorderTemplateSectionsDto } from './dto/reorder-template-sections.dto';
import type { TemplateQueryDto } from './dto/template-query.dto';
import type { UpdateTemplateSectionDto } from './dto/update-template-section.dto';
import type { UpdateTemplateDto } from './dto/update-template.dto';
import { TemplatesRepository, type TemplateRecord } from './templates.repository';
export declare class TemplatesService {
    private readonly templatesRepository;
    private readonly auditService;
    constructor(templatesRepository: TemplatesRepository, auditService: AuditService);
    health(): {
        status: string;
    };
    create(dto: CreateTemplateDto, user: AuthenticatedUser): Promise<TemplateRecord>;
    list(query: TemplateQueryDto): Promise<TemplateRecord[]>;
    getById(id: string): Promise<TemplateRecord>;
    exportDocx(id: string): Promise<{
        fileName: string;
        buffer: Buffer;
    }>;
    update(id: string, dto: UpdateTemplateDto, user: AuthenticatedUser): Promise<TemplateRecord>;
    addSection(templateId: string, dto: CreateTemplateSectionDto, user: AuthenticatedUser): Promise<TemplateRecord>;
    updateSection(templateId: string, sectionId: string, dto: UpdateTemplateSectionDto, user: AuthenticatedUser): Promise<TemplateRecord>;
    removeSection(templateId: string, sectionId: string, user: AuthenticatedUser): Promise<TemplateRecord>;
    reorderSections(templateId: string, dto: ReorderTemplateSectionsDto, user: AuthenticatedUser): Promise<TemplateRecord>;
    remove(id: string, user: AuthenticatedUser): Promise<{
        ok: true;
    }>;
    private bumpVersion;
}
