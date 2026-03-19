import { PostgresService } from '../database/postgres.service';
export type TemplateType = 'AGENDA' | 'STAFF_REPORT';
export interface TemplateSectionRecord {
    id: string;
    templateId: string;
    title: string;
    description?: string;
    sectionType?: string;
    itemType?: string;
    isRequired: boolean;
    sortOrder: number;
    createdAt: string;
    updatedAt: string;
}
export interface TemplateRecord {
    id: string;
    type: TemplateType;
    code: string;
    name: string;
    description?: string;
    isActive: boolean;
    version: number;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    sections: TemplateSectionRecord[];
}
interface CreateTemplateInput {
    type: TemplateType;
    code: string;
    name: string;
    description?: string;
    isActive: boolean;
    createdBy: string;
}
interface UpdateTemplateInput {
    name?: string;
    description?: string;
    isActive?: boolean;
    version?: number;
}
interface CreateTemplateSectionInput {
    templateId: string;
    title: string;
    description?: string;
    sectionType?: string;
    itemType?: string;
    isRequired: boolean;
    sortOrder: number;
}
interface UpdateTemplateSectionInput {
    title?: string;
    description?: string;
    sectionType?: string;
    itemType?: string;
    isRequired?: boolean;
}
export declare class TemplatesRepository {
    private readonly postgresService;
    private schemaEnsured;
    private readonly memoryTemplates;
    constructor(postgresService: PostgresService);
    create(input: CreateTemplateInput): Promise<TemplateRecord>;
    list(query?: {
        type?: TemplateType;
        includeInactive?: boolean;
    }): Promise<TemplateRecord[]>;
    getById(id: string): Promise<TemplateRecord>;
    update(id: string, patch: UpdateTemplateInput): Promise<TemplateRecord>;
    addSection(input: CreateTemplateSectionInput): Promise<TemplateRecord>;
    updateSection(templateId: string, sectionId: string, patch: UpdateTemplateSectionInput): Promise<TemplateRecord>;
    removeSection(templateId: string, sectionId: string): Promise<TemplateRecord>;
    reorderSections(templateId: string, sectionIdsInOrder: string[]): Promise<TemplateRecord>;
    remove(templateId: string): Promise<void>;
    private hydrateSingle;
    private hydrateList;
    private ensureSchema;
    private withFallback;
    private createInMemory;
    private listInMemory;
}
export {};
