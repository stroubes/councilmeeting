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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingTypesController = void 0;
const common_1 = require("@nestjs/common");
const permissions_constants_1 = require("../core/constants/permissions.constants");
const current_user_decorator_1 = require("../core/decorators/current-user.decorator");
const permissions_decorator_1 = require("../core/decorators/permissions.decorator");
const public_decorator_1 = require("../core/decorators/public.decorator");
const create_meeting_type_dto_1 = require("./dto/create-meeting-type.dto");
const meeting_types_service_1 = require("./meeting-types.service");
let MeetingTypesController = class MeetingTypesController {
    meetingTypesService;
    constructor(meetingTypesService) {
        this.meetingTypesService = meetingTypesService;
    }
    health() {
        return this.meetingTypesService.health();
    }
    list(includeInactive) {
        return this.meetingTypesService.list(includeInactive === 'true' || includeInactive === '1');
    }
    create(dto, user) {
        return this.meetingTypesService.create(dto, user);
    }
    remove(id) {
        return this.meetingTypesService.remove(id);
    }
};
exports.MeetingTypesController = MeetingTypesController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], MeetingTypesController.prototype, "health", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.MEETING_READ),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('includeInactive')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MeetingTypesController.prototype, "list", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.TEMPLATES_MANAGE),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_meeting_type_dto_1.CreateMeetingTypeDto, Object]),
    __metadata("design:returntype", void 0)
], MeetingTypesController.prototype, "create", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.TEMPLATES_MANAGE),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MeetingTypesController.prototype, "remove", null);
exports.MeetingTypesController = MeetingTypesController = __decorate([
    (0, common_1.Controller)('meeting-types'),
    __metadata("design:paramtypes", [meeting_types_service_1.MeetingTypesService])
], MeetingTypesController);
//# sourceMappingURL=meeting-types.controller.js.map