import { AgendasService } from './agendas.service';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CreateAgendaDto } from './dto/create-agenda.dto';
import { UpdateAgendaDto } from './dto/update-agenda.dto';
import { CreateAgendaItemDto } from './items/dto/create-agenda-item.dto';
import { UpdateAgendaItemDto } from './items/dto/update-agenda-item.dto';
import { ReorderAgendaItemsDto } from './items/dto/reorder-agenda-items.dto';
import { RejectAgendaDto } from './dto/reject-agenda.dto';
export declare class AgendasController {
    private readonly agendasService;
    constructor(agendasService: AgendasService);
    health(): {
        status: string;
    };
    create(dto: CreateAgendaDto, user: AuthenticatedUser): Promise<import("./agendas.service").AgendaRecord>;
    list(meetingId?: string): Promise<import("./agendas.service").AgendaRecord[]>;
    getById(id: string): Promise<import("./agendas.service").AgendaRecord>;
    update(id: string, dto: UpdateAgendaDto): Promise<import("./agendas.service").AgendaRecord>;
    addItem(id: string, dto: CreateAgendaItemDto, user: AuthenticatedUser): Promise<import("./agendas.service").AgendaRecord>;
    updateItem(id: string, itemId: string, dto: UpdateAgendaItemDto): Promise<import("./agendas.service").AgendaRecord>;
    reorderItems(id: string, dto: ReorderAgendaItemsDto): Promise<import("./agendas.service").AgendaRecord>;
    removeItem(id: string, itemId: string): Promise<import("./agendas.service").AgendaRecord>;
    submitForDirector(id: string): Promise<import("./agendas.service").AgendaRecord>;
    approveByDirector(id: string, user: AuthenticatedUser): Promise<import("./agendas.service").AgendaRecord>;
    approveByCao(id: string, user: AuthenticatedUser): Promise<import("./agendas.service").AgendaRecord>;
    reject(id: string, user: AuthenticatedUser, dto: RejectAgendaDto): Promise<import("./agendas.service").AgendaRecord>;
    publish(id: string): Promise<import("./agendas.service").AgendaRecord>;
    remove(id: string, user: AuthenticatedUser): Promise<{
        ok: true;
    }>;
}
