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
exports.MinutesService = void 0;
const common_1 = require("@nestjs/common");
const roles_constants_1 = require("../core/constants/roles.constants");
const meetings_service_1 = require("../meetings/meetings.service");
const audit_service_1 = require("../audit/audit.service");
const minutes_repository_1 = require("./minutes.repository");
const minutes_content_1 = require("./minutes-content");
const notifications_service_1 = require("../notifications/notifications.service");
let MinutesService = class MinutesService {
    meetingsService;
    minutesRepository;
    auditService;
    notificationsService;
    constructor(meetingsService, minutesRepository, auditService, notificationsService) {
        this.meetingsService = meetingsService;
        this.minutesRepository = minutesRepository;
        this.auditService = auditService;
        this.notificationsService = notificationsService;
    }
    health() {
        return { status: 'ok' };
    }
    async create(dto, user) {
        const meetingExists = await this.meetingsService.exists(dto.meetingId);
        if (!meetingExists) {
            throw new common_1.BadRequestException('Meeting does not exist for these minutes');
        }
        const created = await this.minutesRepository.create({
            meetingId: dto.meetingId,
            minuteTakerUserId: user.id,
            contentJson: (0, minutes_content_1.normalizeMinutesContent)(dto.contentJson ?? (0, minutes_content_1.createDefaultMinutesContent)()),
            createdBy: user.id,
        });
        await this.auditService.log({
            actorUserId: user.id,
            action: 'minutes.create',
            entityType: 'minutes',
            entityId: created.id,
            changesJson: { meetingId: created.meetingId },
        });
        return created;
    }
    list(meetingId) {
        return this.minutesRepository.list(meetingId);
    }
    getById(id) {
        return this.minutesRepository.getById(id);
    }
    async start(id, user) {
        const minutes = await this.minutesRepository.getById(id);
        if (minutes.status !== 'DRAFT') {
            throw new common_1.BadRequestException('Only draft minutes can be started');
        }
        const updated = await this.minutesRepository.update(id, {
            status: 'IN_PROGRESS',
            startedAt: new Date().toISOString(),
            minuteTakerUserId: user.id,
        });
        await this.auditService.log({
            actorUserId: user.id,
            action: 'minutes.start',
            entityType: 'minutes',
            entityId: id,
        });
        return updated;
    }
    async update(id, dto, user) {
        const minutes = await this.minutesRepository.getById(id);
        if (minutes.status === 'PUBLISHED') {
            throw new common_1.BadRequestException('Published minutes cannot be edited');
        }
        const updated = await this.minutesRepository.update(id, {
            contentJson: (0, minutes_content_1.normalizeMinutesContent)(dto.contentJson ?? minutes.contentJson),
        });
        await this.auditService.log({
            actorUserId: user.id,
            action: 'minutes.update',
            entityType: 'minutes',
            entityId: id,
            changesJson: { note: dto.note ?? 'Content updated' },
        });
        return updated;
    }
    async finalize(id, user) {
        const minutes = await this.minutesRepository.getById(id);
        if (minutes.status !== 'IN_PROGRESS' && minutes.status !== 'DRAFT') {
            throw new common_1.BadRequestException('Only draft or in-progress minutes can be finalized');
        }
        const issues = (0, minutes_content_1.ensureMinutesFinalizeReadiness)(minutes.contentJson);
        if (issues.length > 0) {
            throw new common_1.BadRequestException(issues.join(' '));
        }
        const updated = await this.minutesRepository.update(id, {
            status: 'FINALIZED',
            finalizedAt: new Date().toISOString(),
        });
        await this.auditService.log({
            actorUserId: user.id,
            action: 'minutes.finalize',
            entityType: 'minutes',
            entityId: id,
        });
        await this.emitNotification({
            eventType: 'MINUTES_FINALIZED',
            entityType: 'minutes',
            entityId: id,
            actorUserId: user.id,
            payloadJson: { status: 'FINALIZED' },
        });
        return updated;
    }
    async publish(id, user) {
        if (!user.roles.includes(roles_constants_1.SYSTEM_ROLES.CAO) && !user.roles.includes(roles_constants_1.SYSTEM_ROLES.ADMIN)) {
            throw new common_1.ForbiddenException('CAO or Admin role required to publish minutes');
        }
        const minutes = await this.minutesRepository.getById(id);
        if (minutes.status !== 'FINALIZED') {
            throw new common_1.BadRequestException('Only finalized minutes can be published');
        }
        const updated = await this.minutesRepository.update(id, {
            status: 'PUBLISHED',
            publishedAt: new Date().toISOString(),
        });
        await this.auditService.log({
            actorUserId: user.id,
            action: 'minutes.publish',
            entityType: 'minutes',
            entityId: id,
        });
        await this.emitNotification({
            eventType: 'MINUTES_PUBLISHED',
            entityType: 'minutes',
            entityId: id,
            actorUserId: user.id,
            payloadJson: { status: 'PUBLISHED' },
        });
        return updated;
    }
    async emitNotification(input) {
        try {
            await this.notificationsService.emit(input);
        }
        catch {
        }
    }
};
exports.MinutesService = MinutesService;
exports.MinutesService = MinutesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [meetings_service_1.MeetingsService,
        minutes_repository_1.MinutesRepository,
        audit_service_1.AuditService,
        notifications_service_1.NotificationsService])
], MinutesService);
//# sourceMappingURL=minutes.service.js.map