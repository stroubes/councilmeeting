import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import type { CreateAgendaDto } from './dto/create-agenda.dto';
import type { RejectAgendaDto } from './dto/reject-agenda.dto';
import type { UpdateAgendaDto } from './dto/update-agenda.dto';
import type { CreateAgendaItemDto } from './items/dto/create-agenda-item.dto';
import type { ReorderAgendaItemsDto } from './items/dto/reorder-agenda-items.dto';
import type { UpdateAgendaItemDto } from './items/dto/update-agenda-item.dto';
import { AgendasRepository } from './agendas.repository';
import { MeetingsService } from '../meetings/meetings.service';
import { AuditService } from '../audit/audit.service';
import { TemplatesService } from '../templates/templates.service';
import { NotificationsService } from '../notifications/notifications.service';
import { GovernanceService } from '../governance/governance.service';
export type AgendaStatus = 'DRAFT' | 'PENDING_DIRECTOR_APPROVAL' | 'PENDING_CAO_APPROVAL' | 'APPROVED' | 'REJECTED' | 'PUBLISHED';
type AgendaItemStatus = 'DRAFT' | 'PENDING_DIRECTOR_APPROVAL' | 'PENDING_CAO_APPROVAL' | 'APPROVED' | 'REJECTED' | 'PUBLISHED';
export interface AgendaItemRecord {
    id: string;
    agendaId: string;
    itemType: string;
    title: string;
    description?: string;
    parentItemId?: string;
    isInCamera: boolean;
    sortOrder: number;
    status: AgendaItemStatus;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}
export interface AgendaRecord {
    id: string;
    meetingId: string;
    templateId?: string;
    title: string;
    status: AgendaStatus;
    version: number;
    rejectionReason?: string;
    items: AgendaItemRecord[];
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    publishedAt?: string;
}
export declare class AgendasService {
    private readonly agendasRepository;
    private readonly meetingsService;
    private readonly auditService;
    private readonly templatesService;
    private readonly notificationsService;
    private readonly governanceService;
    constructor(agendasRepository: AgendasRepository, meetingsService: MeetingsService, auditService: AuditService, templatesService: TemplatesService, notificationsService: NotificationsService, governanceService: GovernanceService);
    health(): {
        status: string;
    };
    create(dto: CreateAgendaDto, user: AuthenticatedUser): Promise<AgendaRecord>;
    list(meetingId?: string): Promise<AgendaRecord[]>;
    getById(id: string): Promise<AgendaRecord>;
    update(id: string, dto: UpdateAgendaDto): Promise<AgendaRecord>;
    addItem(agendaId: string, dto: CreateAgendaItemDto, user: AuthenticatedUser): Promise<AgendaRecord>;
    updateItem(agendaId: string, itemId: string, dto: UpdateAgendaItemDto): Promise<AgendaRecord>;
    reorderItems(agendaId: string, dto: ReorderAgendaItemsDto): Promise<AgendaRecord>;
    removeItem(agendaId: string, itemId: string): Promise<AgendaRecord>;
    submitForDirector(agendaId: string): Promise<AgendaRecord>;
    approveByDirector(agendaId: string, user: AuthenticatedUser): Promise<AgendaRecord>;
    approveByCao(agendaId: string, user: AuthenticatedUser): Promise<AgendaRecord>;
    reject(agendaId: string, user: AuthenticatedUser, dto: RejectAgendaDto): Promise<AgendaRecord>;
    publish(agendaId: string): Promise<AgendaRecord>;
    hasAgendaItem(itemId: string): Promise<boolean>;
    remove(id: string, user: AuthenticatedUser): Promise<{
        ok: true;
    }>;
    private ensureStatus;
    private getSubmissionIssues;
    private normalizeTitle;
    private emitNotification;
}
export {};
