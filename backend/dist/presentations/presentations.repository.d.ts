import { PostgresService } from '../database/postgres.service';
export interface PresentationRecord {
    id: string;
    meetingId: string;
    fileName: string;
    title: string;
    mimeType: string;
    pageCount: number;
    contentBase64: string;
    createdBy: string;
    updatedBy: string;
    createdAt: string;
    updatedAt: string;
}
export type PresentationSummary = Omit<PresentationRecord, 'contentBase64'>;
interface CreatePresentationInput {
    meetingId: string;
    fileName: string;
    title: string;
    mimeType: string;
    pageCount: number;
    contentBase64: string;
    createdBy: string;
}
export declare class PresentationsRepository {
    private readonly postgresService;
    private readonly memory;
    private schemaEnsured;
    constructor(postgresService: PostgresService);
    list(meetingId?: string): Promise<PresentationSummary[]>;
    getById(id: string): Promise<PresentationSummary>;
    getWithContentById(id: string): Promise<PresentationRecord>;
    create(input: CreatePresentationInput): Promise<PresentationSummary>;
    remove(id: string): Promise<void>;
    private ensureSchema;
    private withFallback;
}
export {};
