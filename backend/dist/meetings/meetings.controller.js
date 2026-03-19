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
exports.MeetingsController = void 0;
const common_1 = require("@nestjs/common");
const meetings_service_1 = require("./meetings.service");
const public_decorator_1 = require("../core/decorators/public.decorator");
const permissions_decorator_1 = require("../core/decorators/permissions.decorator");
const permissions_constants_1 = require("../core/constants/permissions.constants");
const in_camera_access_guard_1 = require("../core/guards/in-camera-access.guard");
const current_user_decorator_1 = require("../core/decorators/current-user.decorator");
const create_meeting_dto_1 = require("./dto/create-meeting.dto");
const meeting_list_query_dto_1 = require("./dto/meeting-list-query.dto");
const meeting_query_dto_1 = require("./dto/meeting-query.dto");
const update_meeting_dto_1 = require("./dto/update-meeting.dto");
let MeetingsController = class MeetingsController {
    meetingsService;
    constructor(meetingsService) {
        this.meetingsService = meetingsService;
    }
    health() {
        return this.meetingsService.health();
    }
    listPublic() {
        return this.meetingsService.listPublic();
    }
    create(dto, user) {
        return this.meetingsService.create(dto, user);
    }
    list(query, user) {
        return this.meetingsService.list(query, user);
    }
    listPaged(query, user) {
        return this.meetingsService.listPaged(query, user);
    }
    accessCheck(inCamera) {
        return { inCamera: inCamera === 'true' || inCamera === '1', allowed: true };
    }
    getById(id, user) {
        return this.meetingsService.getById(id, user);
    }
    update(id, dto, user) {
        return this.meetingsService.update(id, dto, user);
    }
    remove(id) {
        return this.meetingsService.remove(id);
    }
};
exports.MeetingsController = MeetingsController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], MeetingsController.prototype, "health", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('public'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], MeetingsController.prototype, "listPublic", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.MEETING_WRITE),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_meeting_dto_1.CreateMeetingDto, Object]),
    __metadata("design:returntype", void 0)
], MeetingsController.prototype, "create", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.MEETING_READ),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [meeting_query_dto_1.MeetingQueryDto, Object]),
    __metadata("design:returntype", void 0)
], MeetingsController.prototype, "list", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.MEETING_READ),
    (0, common_1.Get)('paged'),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [meeting_list_query_dto_1.MeetingListQueryDto, Object]),
    __metadata("design:returntype", void 0)
], MeetingsController.prototype, "listPaged", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.MEETING_READ),
    (0, common_1.UseGuards)(in_camera_access_guard_1.InCameraAccessGuard),
    (0, common_1.Get)('access-check'),
    __param(0, (0, common_1.Query)('inCamera')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Object)
], MeetingsController.prototype, "accessCheck", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.MEETING_READ),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MeetingsController.prototype, "getById", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.MEETING_WRITE),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_meeting_dto_1.UpdateMeetingDto, Object]),
    __metadata("design:returntype", void 0)
], MeetingsController.prototype, "update", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.MEETING_WRITE),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MeetingsController.prototype, "remove", null);
exports.MeetingsController = MeetingsController = __decorate([
    (0, common_1.Controller)('meetings'),
    __metadata("design:paramtypes", [meetings_service_1.MeetingsService])
], MeetingsController);
//# sourceMappingURL=meetings.controller.js.map