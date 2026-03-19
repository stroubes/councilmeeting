import { PostgresService } from '../database/postgres.service';
import type { AgendaItemRecord, AgendaRecord, AgendaStatus } from './agendas.service';
interface CreateAgendaInput {
    meetingId: string;
    templateId?: string;
    title: string;
    createdBy: string;
}
interface CreateAgendaItemInput {
    agendaId: string;
    itemType: string;
    title: string;
    description?: string;
    parentItemId?: string;
    isInCamera: boolean;
    sortOrder: number;
    createdBy: string;
    status: AgendaStatus;
}
export declare class AgendasRepository {
    private readonly postgresService;
    private readonly memoryAgendas;
    private schemaEnsured;
    constructor(postgresService: PostgresService);
    create(input: CreateAgendaInput): Promise<AgendaRecord>;
    list(meetingId?: string): Promise<AgendaRecord[]>;
    getById(id: string): Promise<AgendaRecord>;
    update(id: string, patch: Partial<Pick<AgendaRecord, 'title' | 'status' | 'version' | 'rejectionReason' | 'publishedAt'>>): Promise<AgendaRecord>;
    replaceItems(agendaId: string, items: AgendaItemRecord[]): Promise<void>;
    addItem(input: CreateAgendaItemInput): Promise<AgendaItemRecord>;
    updateItem(agendaId: string, itemId: string, patch: Partial<Pick<AgendaItemRecord, 'title' | 'description' | 'parentItemId' | 'isInCamera' | 'itemType' | 'status'>>): Promise<AgendaItemRecord>;
    hasAgendaItem(itemId: string): Promise<boolean>;
    remove(id: string): Promise<void>;
    private ensureSchema;
    private withFallback;
    private createInMemory;
}
export {};
