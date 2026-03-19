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
exports.MotionsController = void 0;
const common_1 = require("@nestjs/common");
const public_decorator_1 = require("../core/decorators/public.decorator");
const permissions_decorator_1 = require("../core/decorators/permissions.decorator");
const permissions_constants_1 = require("../core/constants/permissions.constants");
const current_user_decorator_1 = require("../core/decorators/current-user.decorator");
const create_motion_dto_1 = require("./dto/create-motion.dto");
const set_motion_outcome_dto_1 = require("./dto/set-motion-outcome.dto");
const update_motion_dto_1 = require("./dto/update-motion.dto");
const motions_service_1 = require("./motions.service");
let MotionsController = class MotionsController {
    motionsService;
    constructor(motionsService) {
        this.motionsService = motionsService;
    }
    health() {
        return this.motionsService.health();
    }
    list(meetingId) {
        return this.motionsService.list(meetingId);
    }
    getCurrentLive(meetingId) {
        return this.motionsService.getCurrentLive(meetingId);
    }
    getPublicState(meetingId) {
        return this.motionsService.getPublicState(meetingId);
    }
    getById(id) {
        return this.motionsService.getById(id);
    }
    create(dto, user) {
        return this.motionsService.create(dto, user);
    }
    update(id, dto, user) {
        return this.motionsService.update(id, dto, user);
    }
    setLive(id, user) {
        return this.motionsService.setLive(id, user);
    }
    setOutcome(id, dto, user) {
        return this.motionsService.setOutcome(id, dto, user);
    }
    remove(id, user) {
        return this.motionsService.remove(id, user);
    }
};
exports.MotionsController = MotionsController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], MotionsController.prototype, "health", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.MEETING_READ),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('meetingId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MotionsController.prototype, "list", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('public/live'),
    __param(0, (0, common_1.Query)('meetingId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MotionsController.prototype, "getCurrentLive", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('public/state'),
    __param(0, (0, common_1.Query)('meetingId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MotionsController.prototype, "getPublicState", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.MEETING_READ),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MotionsController.prototype, "getById", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.AGENDA_WRITE),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_motion_dto_1.CreateMotionDto, Object]),
    __metadata("design:returntype", void 0)
], MotionsController.prototype, "create", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.AGENDA_WRITE),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_motion_dto_1.UpdateMotionDto, Object]),
    __metadata("design:returntype", void 0)
], MotionsController.prototype, "update", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.AGENDA_WRITE),
    (0, common_1.Post)(':id/set-live'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MotionsController.prototype, "setLive", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.AGENDA_WRITE),
    (0, common_1.Post)(':id/set-outcome'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, set_motion_outcome_dto_1.SetMotionOutcomeDto, Object]),
    __metadata("design:returntype", void 0)
], MotionsController.prototype, "setOutcome", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.AGENDA_WRITE),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MotionsController.prototype, "remove", null);
exports.MotionsController = MotionsController = __decorate([
    (0, common_1.Controller)('motions'),
    __metadata("design:paramtypes", [motions_service_1.MotionsService])
], MotionsController);
//# sourceMappingURL=motions.controller.js.map