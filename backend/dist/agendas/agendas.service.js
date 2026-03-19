"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgendasService = void 0;
const common_1 = require("@nestjs/common");
const roles_constants_1 = require("../core/constants/roles.constants");
const agendas_repository_1 = require("./agendas.repository");
const meetings_service_1 = require("../meetings/meetings.service");
const audit_service_1 = require("../audit/audit.service");
const templates_service_1 = require("../templates/templates.service");
const notifications_service_1 = require("../notifications/notifications.service");
const governance_service_1 = require("../governance/governance.service");
const municipal_profile_constants_1 = require("../governance/municipal-profile.constants");
let AgendasService = class AgendasService {
    agendasRepository;
    meetingsService;
    auditService;
    templatesService;
    notificationsService;
    governanceService;
    constructor(agendasRepository, meetingsService, auditService, templatesService, notificationsService, governanceService) {
        this.agendasRepository = agendasRepository;
        this.meetingsService = meetingsService;
        this.auditService = auditService;
        this.templatesService = templatesService;
        this.notificationsService = notificationsService;
        this.governanceService = governanceService;
    }
    health() {
        return { status: 'ok' };
    }
    async create(dto, user) {
        const meetingExists = await this.meetingsService.exists(dto.meetingId);
        if (!meetingExists) {
            throw new common_1.BadRequestException('Meeting does not exist for this agenda');
        }
        const template = dto.templateId ? await this.templatesService.getById(dto.templateId) : null;
        if (template && template.type !== 'AGENDA') {
            throw new common_1.BadRequestException('Selected template must be an agenda template');
        }
        const created = await this.agendasRepository.create({
            meetingId: dto.meetingId,
            templateId: dto.templateId,
            title: dto.title,
            createdBy: user.id,
        });
        if (template) {
            const sortedSections = [...template.sections].sort((left, right) => left.sortOrder - right.sortOrder);
            for (let index = 0; index < sortedSections.length; index += 1) {
                const section = sortedSections[index];
                await this.agendasRepository.addItem({
                    agendaId: created.id,
                    itemType: section.itemType ?? 'SECTION',
                    title: section.title,
                    description: section.description,
                    parentItemId: undefined,
                    isInCamera: false,
                    sortOrder: index + 1,
                    status: 'DRAFT',
                    createdBy: user.id,
                });
            }
            await this.agendasRepository.update(created.id, { version: created.version + 1 });
        }
        await this.auditService.log({
            actorUserId: user.id,
            action: 'agenda.create',
            entityType: 'agenda',
            entityId: created.id,
        });
        return this.getById(created.id);
    }
    list(meetingId) {
        return this.agendasRepository.list(meetingId);
    }
    getById(id) {
        return this.agendasRepository.getById(id);
    }
    async update(id, dto) {
        const existing = await this.getById(id);
        if (existing.status === 'PUBLISHED') {
            throw new common_1.BadRequestException('Published agenda cannot be edited');
        }
        const updated = await this.agendasRepository.update(id, {
            title: dto.title ?? existing.title,
            version: existing.version + 1,
        });
        await this.auditService.log({
            action: 'agenda.update',
            entityType: 'agenda',
            entityId: updated.id,
            changesJson: { title: dto.title },
        });
        return updated;
    }
    async addItem(agendaId, dto, user) {
        const agenda = await this.getById(agendaId);
        if (agenda.status === 'PUBLISHED') {
            throw new common_1.BadRequestException('Cannot add items to published agenda');
        }
        await this.agendasRepository.addItem({
            agendaId,
            itemType: dto.itemType,
            title: dto.title,
            description: dto.description,
            parentItemId: dto.parentItemId,
            isInCamera: dto.isInCamera ?? false,
            sortOrder: agenda.items.length + 1,
            status: 'DRAFT',
            createdBy: user.id,
        });
        return this.agendasRepository.update(agenda.id, {
            version: agenda.version + 1,
        }).then(() => this.getById(agenda.id));
    }
    async updateItem(agendaId, itemId, dto) {
        const agenda = await this.getById(agendaId);
        const item = agenda.items.find((candidate) => candidate.id === itemId);
        if (!item) {
            throw new common_1.NotFoundException('Agenda item not found');
        }
        if (agenda.status === 'PUBLISHED' || item.status === 'PUBLISHED') {
            throw new common_1.BadRequestException('Published agenda item cannot be edited');
        }
        await this.agendasRepository.updateItem(agendaId, itemId, {
            title: dto.title,
            description: dto.description,
            isInCamera: dto.isInCamera,
        });
        await this.agendasRepository.update(agenda.id, { version: agenda.version + 1 });
        await this.auditService.log({
            action: 'agenda.item.update',
            entityType: 'agenda',
            entityId: agenda.id,
            changesJson: { itemId },
        });
        return this.getById(agenda.id);
    }
    async reorderItems(agendaId, dto) {
        const agenda = await this.getById(agendaId);
        if (agenda.status === 'PUBLISHED') {
            throw new common_1.BadRequestException('Cannot reorder items on published agenda');
        }
        if (dto.itemIdsInOrder.length !== agenda.items.length) {
            throw new common_1.BadRequestException('Reorder payload must include all agenda items');
        }
        const itemsById = new Map(agenda.items.map((item) => [item.id, item]));
        const reordered = dto.itemIdsInOrder.map((itemId, index) => {
            const item = itemsById.get(itemId);
            if (!item) {
                throw new common_1.NotFoundException(`Agenda item ${itemId} not found`);
            }
            item.sortOrder = index + 1;
            item.updatedAt = new Date().toISOString();
            return item;
        });
        await this.agendasRepository.replaceItems(agenda.id, reordered);
        await this.agendasRepository.update(agenda.id, { version: agenda.version + 1 });
        await this.auditService.log({
            action: 'agenda.items.reorder',
            entityType: 'agenda',
            entityId: agenda.id,
        });
        return this.getById(agenda.id);
    }
    async removeItem(agendaId, itemId) {
        const agenda = await this.getById(agendaId);
        if (agenda.status === 'PUBLISHED') {
            throw new common_1.BadRequestException('Cannot remove items from published agenda');
        }
        const remainingItems = agenda.items.filter((item) => item.id !== itemId);
        if (remainingItems.length === agenda.items.length) {
            throw new common_1.NotFoundException('Agenda item not found');
        }
        const now = new Date().toISOString();
        const reordered = remainingItems
            .sort((left, right) => left.sortOrder - right.sortOrder)
            .map((item, index) => ({
            ...item,
            sortOrder: index + 1,
            updatedAt: now,
        }));
        await this.agendasRepository.replaceItems(agenda.id, reordered);
        await this.agendasRepository.update(agenda.id, { version: agenda.version + 1 });
        await this.auditService.log({
            action: 'agenda.item.delete',
            entityType: 'agenda',
            entityId: agenda.id,
            changesJson: { itemId },
        });
        return this.getById(agenda.id);
    }
    async submitForDirector(agendaId) {
        const agenda = await this.getById(agendaId);
        this.ensureStatus(agenda.status, ['DRAFT', 'REJECTED']);
        const readinessIssues = await this.getSubmissionIssues(agenda);
        if (readinessIssues.length > 0) {
            const profile = await this.governanceService.getActiveProfile();
            throw new common_1.BadRequestException({
                message: 'Agenda package is not ready for submission.',
                profile: profile.id,
                issues: readinessIssues,
            });
        }
        const items = agenda.items.map((item) => ({
            ...item,
            status: 'PENDING_DIRECTOR_APPROVAL',
            updatedAt: new Date().toISOString(),
        }));
        await this.agendasRepository.replaceItems(agenda.id, items);
        await this.agendasRepository.update(agenda.id, {
            status: 'PENDING_DIRECTOR_APPROVAL',
            version: agenda.version + 1,
            rejectionReason: undefined,
        });
        await this.auditService.log({
            action: 'agenda.submit_director',
            entityType: 'agenda',
            entityId: agenda.id,
        });
        await this.emitNotification({
            eventType: 'AGENDA_SUBMITTED',
            entityType: 'agenda',
            entityId: agenda.id,
            payloadJson: { status: 'PENDING_DIRECTOR_APPROVAL' },
        });
        return this.getById(agenda.id);
    }
    async approveByDirector(agendaId, user) {
        if (!user.roles.includes(roles_constants_1.SYSTEM_ROLES.DIRECTOR) && !user.roles.includes(roles_constants_1.SYSTEM_ROLES.ADMIN)) {
            throw new common_1.ForbiddenException('Director role is required');
        }
        const agenda = await this.getById(agendaId);
        this.ensureStatus(agenda.status, ['PENDING_DIRECTOR_APPROVAL']);
        const items = agenda.items.map((item) => ({
            ...item,
            status: 'PENDING_CAO_APPROVAL',
            updatedAt: new Date().toISOString(),
        }));
        await this.agendasRepository.replaceItems(agenda.id, items);
        await this.agendasRepository.update(agenda.id, {
            status: 'PENDING_CAO_APPROVAL',
            version: agenda.version + 1,
        });
        await this.auditService.log({
            actorUserId: user.id,
            action: 'agenda.approve_director',
            entityType: 'agenda',
            entityId: agenda.id,
        });
        await this.emitNotification({
            eventType: 'AGENDA_APPROVED_DIRECTOR',
            entityType: 'agenda',
            entityId: agenda.id,
            actorUserId: user.id,
            payloadJson: { status: 'PENDING_CAO_APPROVAL' },
        });
        return this.getById(agenda.id);
    }
    async approveByCao(agendaId, user) {
        if (!user.roles.includes(roles_constants_1.SYSTEM_ROLES.CAO) && !user.roles.includes(roles_constants_1.SYSTEM_ROLES.ADMIN)) {
            throw new common_1.ForbiddenException('CAO role is required');
        }
        const agenda = await this.getById(agendaId);
        this.ensureStatus(agenda.status, ['PENDING_CAO_APPROVAL']);
        const items = agenda.items.map((item) => ({
            ...item,
            status: 'APPROVED',
            updatedAt: new Date().toISOString(),
        }));
        await this.agendasRepository.replaceItems(agenda.id, items);
        await this.agendasRepository.update(agenda.id, {
            status: 'APPROVED',
            version: agenda.version + 1,
        });
        await this.auditService.log({
            actorUserId: user.id,
            action: 'agenda.approve_cao',
            entityType: 'agenda',
            entityId: agenda.id,
        });
        await this.emitNotification({
            eventType: 'AGENDA_APPROVED_CAO',
            entityType: 'agenda',
            entityId: agenda.id,
            actorUserId: user.id,
            payloadJson: { status: 'APPROVED' },
        });
        return this.getById(agenda.id);
    }
    async reject(agendaId, user, dto) {
        if (!user.roles.includes(roles_constants_1.SYSTEM_ROLES.DIRECTOR) &&
            !user.roles.includes(roles_constants_1.SYSTEM_ROLES.CAO) &&
            !user.roles.includes(roles_constants_1.SYSTEM_ROLES.ADMIN)) {
            throw new common_1.ForbiddenException('Approver role is required');
        }
        const agenda = await this.getById(agendaId);
        this.ensureStatus(agenda.status, ['PENDING_DIRECTOR_APPROVAL', 'PENDING_CAO_APPROVAL']);
        const items = agenda.items.map((item) => ({
            ...item,
            status: 'REJECTED',
            updatedAt: new Date().toISOString(),
        }));
        await this.agendasRepository.replaceItems(agenda.id, items);
        await this.agendasRepository.update(agenda.id, {
            status: 'REJECTED',
            version: agenda.version + 1,
            rejectionReason: dto.reason,
        });
        await this.auditService.log({
            actorUserId: user.id,
            action: 'agenda.reject',
            entityType: 'agenda',
            entityId: agenda.id,
            changesJson: { reason: dto.reason },
        });
        await this.emitNotification({
            eventType: 'AGENDA_REJECTED',
            entityType: 'agenda',
            entityId: agenda.id,
            actorUserId: user.id,
            payloadJson: { status: 'REJECTED', reason: dto.reason },
        });
        return this.getById(agenda.id);
    }
    async publish(agendaId) {
        const agenda = await this.getById(agendaId);
        this.ensureStatus(agenda.status, ['APPROVED']);
        const readinessIssues = await this.getSubmissionIssues(agenda);
        if (readinessIssues.length > 0) {
            const profile = await this.governanceService.getActiveProfile();
            throw new common_1.BadRequestException({
                message: 'Agenda package is missing required municipal policy sections.',
                profile: profile.id,
                issues: readinessIssues,
            });
        }
        const now = new Date().toISOString();
        const items = agenda.items.map((item) => ({ ...item, status: 'PUBLISHED', updatedAt: now }));
        await this.agendasRepository.replaceItems(agenda.id, items);
        await this.agendasRepository.update(agenda.id, {
            status: 'PUBLISHED',
            version: agenda.version + 1,
            publishedAt: now,
        });
        await this.auditService.log({
            action: 'agenda.publish',
            entityType: 'agenda',
            entityId: agenda.id,
        });
        await this.emitNotification({
            eventType: 'AGENDA_PUBLISHED',
            entityType: 'agenda',
            entityId: agenda.id,
            payloadJson: { status: 'PUBLISHED', publishedAt: now },
        });
        return this.getById(agenda.id);
    }
    hasAgendaItem(itemId) {
        return this.agendasRepository.hasAgendaItem(itemId);
    }
    async remove(id, user) {
        await this.agendasRepository.remove(id);
        await this.auditService.log({
            actorUserId: user.id,
            action: 'agenda.delete',
            entityType: 'agenda',
            entityId: id,
        });
        return { ok: true };
    }
    ensureStatus(current, allowed) {
        if (!allowed.includes(current)) {
            throw new common_1.BadRequestException(`Invalid workflow transition from ${current}. Allowed: ${allowed.join(', ')}`);
        }
    }
    async getSubmissionIssues(agenda) {
        const issues = [];
        const policyPack = await this.governanceService.getPolicyPack();
        if (agenda.items.length === 0) {
            issues.push('Add at least one agenda item before submitting.');
            return issues;
        }
        if (policyPack.closedSession.requiresReason) {
            const hasInCameraItems = agenda.items.some((item) => item.isInCamera);
            const hasClosedAuthorityItem = agenda.items.some((item) => item.title.toLowerCase().includes('closed session authority'));
            if (hasInCameraItems && !hasClosedAuthorityItem) {
                issues.push('In-camera content requires a "Closed Session Authority" agenda item.');
            }
        }
        if (!agenda.templateId) {
            return issues;
        }
        const template = await this.templatesService.getById(agenda.templateId);
        if (template.type !== 'AGENDA') {
            return issues;
        }
        const profile = (0, municipal_profile_constants_1.inferAgendaTemplateProfile)(template);
        const requiredTitles = policyPack.agendaTemplates[profile].requiredSectionTitles;
        const agendaTitles = new Set(agenda.items.map((item) => this.normalizeTitle(item.title)));
        for (const requiredTitle of requiredTitles) {
            const normalized = this.normalizeTitle(requiredTitle);
            if (!agendaTitles.has(normalized)) {
                issues.push(`Missing required section: ${requiredTitle}.`);
            }
        }
        return issues;
    }
    normalizeTitle(value) {
        return value.trim().toLowerCase().replace(/\s+/g, ' ');
    }
    async emitNotification(input) {
        try {
            await this.notificationsService.emit(input);
        }
        catch {
        }
    }
};
exports.AgendasService = AgendasService;
exports.AgendasService = AgendasService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [agendas_repository_1.AgendasRepository,
        meetings_service_1.MeetingsService,
        audit_service_1.AuditService,
        templates_service_1.TemplatesService,
        notifications_service_1.NotificationsService,
        governance_service_1.GovernanceService])
], AgendasService);
//# sourceMappingURL=agendas.service.js.map