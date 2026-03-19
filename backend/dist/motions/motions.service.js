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
exports.MotionsService = void 0;
const common_1 = require("@nestjs/common");
const audit_service_1 = require("../audit/audit.service");
const meetings_service_1 = require("../meetings/meetings.service");
const motions_repository_1 = require("./motions.repository");
let MotionsService = class MotionsService {
    meetingsService;
    motionsRepository;
    auditService;
    constructor(meetingsService, motionsRepository, auditService) {
        this.meetingsService = meetingsService;
        this.motionsRepository = motionsRepository;
        this.auditService = auditService;
    }
    health() {
        return { status: 'ok' };
    }
    async list(meetingId) {
        return this.motionsRepository.list(meetingId);
    }
    async getById(id) {
        return this.motionsRepository.getById(id);
    }
    async create(dto, user) {
        const meetingExists = await this.meetingsService.exists(dto.meetingId);
        if (!meetingExists) {
            throw new common_1.BadRequestException('Meeting does not exist for this motion');
        }
        const created = await this.motionsRepository.create({
            meetingId: dto.meetingId,
            agendaItemId: dto.agendaItemId,
            title: dto.title,
            body: dto.body,
            createdBy: user.id,
        });
        await this.auditService.log({
            actorUserId: user.id,
            action: 'motion.create',
            entityType: 'motion',
            entityId: created.id,
            changesJson: { meetingId: created.meetingId },
        });
        return created;
    }
    async update(id, dto, user) {
        const existing = await this.getById(id);
        const updated = await this.motionsRepository.update(id, {
            agendaItemId: dto.agendaItemId ?? existing.agendaItemId,
            title: dto.title ?? existing.title,
            body: dto.body ?? existing.body,
            updatedBy: user.id,
        });
        await this.auditService.log({
            actorUserId: user.id,
            action: 'motion.update',
            entityType: 'motion',
            entityId: id,
        });
        return updated;
    }
    async setLive(id, user) {
        const motion = await this.getById(id);
        await this.motionsRepository.clearLiveByMeeting(motion.meetingId, user.id);
        const updated = await this.motionsRepository.update(id, {
            isCurrentLive: true,
            status: 'LIVE',
            liveAt: new Date().toISOString(),
            updatedBy: user.id,
        });
        await this.auditService.log({
            actorUserId: user.id,
            action: 'motion.set_live',
            entityType: 'motion',
            entityId: id,
            changesJson: { meetingId: motion.meetingId },
        });
        return updated;
    }
    async setOutcome(id, dto, user) {
        const motion = await this.getById(id);
        const updated = await this.motionsRepository.update(id, {
            status: dto.status,
            resultNote: dto.resultNote,
            isCurrentLive: false,
            updatedBy: user.id,
        });
        if (motion.isCurrentLive) {
            await this.motionsRepository.clearLiveByMeeting(motion.meetingId, user.id);
        }
        await this.auditService.log({
            actorUserId: user.id,
            action: 'motion.set_outcome',
            entityType: 'motion',
            entityId: id,
            changesJson: { status: dto.status },
        });
        return updated;
    }
    async getCurrentLive(meetingId) {
        return this.motionsRepository.getCurrentLiveByMeeting(meetingId);
    }
    async getPublicState(meetingId) {
        const motions = await this.motionsRepository.list(meetingId);
        const liveMotion = motions.find((motion) => motion.isCurrentLive) ?? null;
        const recentOutcomeMotion = motions
            .filter((motion) => motion.status === 'CARRIED' || motion.status === 'DEFEATED' || motion.status === 'WITHDRAWN')
            .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())[0] ?? null;
        return {
            liveMotion,
            recentOutcomeMotion,
        };
    }
    async remove(id, user) {
        await this.motionsRepository.remove(id);
        await this.auditService.log({
            actorUserId: user.id,
            action: 'motion.delete',
            entityType: 'motion',
            entityId: id,
        });
        return { ok: true };
    }
};
exports.MotionsService = MotionsService;
exports.MotionsService = MotionsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [meetings_service_1.MeetingsService,
        motions_repository_1.MotionsRepository,
        audit_service_1.AuditService])
], MotionsService);
//# sourceMappingURL=motions.service.js.map