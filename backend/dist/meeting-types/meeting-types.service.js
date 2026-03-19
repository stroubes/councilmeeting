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
exports.MeetingTypesService = void 0;
const common_1 = require("@nestjs/common");
const meeting_types_repository_1 = require("./meeting-types.repository");
let MeetingTypesService = class MeetingTypesService {
    meetingTypesRepository;
    constructor(meetingTypesRepository) {
        this.meetingTypesRepository = meetingTypesRepository;
    }
    health() {
        return { status: 'ok' };
    }
    list(includeInactive) {
        return this.meetingTypesRepository.list({ includeInactive });
    }
    async create(dto, user) {
        const code = dto.code.trim().toUpperCase();
        const existing = await this.meetingTypesRepository
            .getByCode(code)
            .then((meetingType) => meetingType)
            .catch((error) => {
            if (error instanceof common_1.NotFoundException) {
                return null;
            }
            throw error;
        });
        if (existing) {
            throw new common_1.ConflictException('Meeting type code already exists');
        }
        return this.meetingTypesRepository.create({
            code,
            name: dto.name.trim(),
            description: dto.description?.trim(),
            isInCamera: dto.isInCamera ?? false,
            isActive: dto.isActive ?? true,
            createdBy: user.id,
        });
    }
    getByCode(code) {
        return this.meetingTypesRepository.getByCode(code.trim().toUpperCase());
    }
    async remove(id) {
        await this.meetingTypesRepository.remove(id);
        return { ok: true };
    }
};
exports.MeetingTypesService = MeetingTypesService;
exports.MeetingTypesService = MeetingTypesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [meeting_types_repository_1.MeetingTypesRepository])
], MeetingTypesService);
//# sourceMappingURL=meeting-types.service.js.map