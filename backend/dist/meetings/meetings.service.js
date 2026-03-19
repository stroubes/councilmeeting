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
exports.MeetingsService = void 0;
const common_1 = require("@nestjs/common");
const permissions_constants_1 = require("../core/constants/permissions.constants");
const meetings_repository_1 = require("./meetings.repository");
const meeting_types_service_1 = require("../meeting-types/meeting-types.service");
let MeetingsService = class MeetingsService {
    meetingsRepository;
    meetingTypesService;
    constructor(meetingsRepository, meetingTypesService) {
        this.meetingsRepository = meetingsRepository;
        this.meetingTypesService = meetingTypesService;
    }
    health() {
        return { status: 'ok' };
    }
    async create(dto, user) {
        const meetingType = await this.meetingTypesService.getByCode(dto.meetingTypeCode);
        const meetingTypeCode = meetingType.code;
        return this.meetingsRepository.create({
            title: dto.title,
            description: dto.description,
            meetingTypeCode,
            startsAt: dto.startsAt,
            endsAt: dto.endsAt,
            location: dto.location,
            status: 'SCHEDULED',
            isPublic: dto.isPublic ?? !meetingType.isInCamera,
            isInCamera: meetingType.isInCamera,
            videoUrl: dto.videoUrl,
            recurrenceGroupId: dto.recurrenceGroupId,
            recurrenceIndex: dto.recurrenceIndex,
            createdBy: user.id,
        });
    }
    async list(query, user) {
        return this.meetingsRepository.list(this.applyInCameraAccess(query, user));
    }
    listPaged(query, user) {
        return this.meetingsRepository.listPaged(this.applyInCameraAccess(query, user));
    }
    listPublic() {
        return this.meetingsRepository.listPublic();
    }
    async getById(id, user) {
        const meeting = await this.meetingsRepository.getById(id);
        if (meeting.isInCamera && !user.permissions.includes(permissions_constants_1.PERMISSIONS.MEETING_READ_IN_CAMERA)) {
            throw new common_1.ForbiddenException('In-camera access denied');
        }
        return meeting;
    }
    async update(id, dto, user) {
        const existing = await this.getById(id, user);
        let meetingTypeCode = existing.meetingTypeCode;
        let isInCamera = existing.isInCamera;
        if (dto.meetingTypeCode) {
            const meetingType = await this.meetingTypesService.getByCode(dto.meetingTypeCode);
            meetingTypeCode = meetingType.code;
            isInCamera = meetingType.isInCamera;
        }
        const isPublic = dto.isPublic ?? (isInCamera ? false : existing.isPublic);
        const updated = {
            ...existing,
            ...dto,
            meetingTypeCode,
            isInCamera,
            isPublic,
            updatedAt: new Date().toISOString(),
        };
        if (dto.startsAt || dto.endsAt) {
            const startsAt = new Date(updated.startsAt).getTime();
            const endsAt = updated.endsAt ? new Date(updated.endsAt).getTime() : null;
            if (endsAt !== null && endsAt < startsAt) {
                throw new common_1.ForbiddenException('Meeting end time cannot be before start time');
            }
        }
        return this.meetingsRepository.update(id, updated);
    }
    exists(id) {
        return this.meetingsRepository.exists(id);
    }
    async remove(id) {
        await this.meetingsRepository.remove(id);
        return { ok: true };
    }
    applyInCameraAccess(query, user) {
        if (user.permissions.includes(permissions_constants_1.PERMISSIONS.MEETING_READ_IN_CAMERA)) {
            return query;
        }
        return {
            ...query,
            inCamera: 'false',
        };
    }
};
exports.MeetingsService = MeetingsService;
exports.MeetingsService = MeetingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [meetings_repository_1.MeetingsRepository,
        meeting_types_service_1.MeetingTypesService])
], MeetingsService);
//# sourceMappingURL=meetings.service.js.map