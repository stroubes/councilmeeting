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
exports.MinutesController = void 0;
const common_1 = require("@nestjs/common");
const minutes_service_1 = require("./minutes.service");
const permissions_decorator_1 = require("../core/decorators/permissions.decorator");
const permissions_constants_1 = require("../core/constants/permissions.constants");
const current_user_decorator_1 = require("../core/decorators/current-user.decorator");
const create_minutes_dto_1 = require("./dto/create-minutes.dto");
const update_minutes_dto_1 = require("./dto/update-minutes.dto");
const public_decorator_1 = require("../core/decorators/public.decorator");
let MinutesController = class MinutesController {
    minutesService;
    constructor(minutesService) {
        this.minutesService = minutesService;
    }
    health() {
        return this.minutesService.health();
    }
    create(dto, user) {
        return this.minutesService.create(dto, user);
    }
    list(meetingId) {
        return this.minutesService.list(meetingId);
    }
    getById(id) {
        return this.minutesService.getById(id);
    }
    update(id, dto, user) {
        return this.minutesService.update(id, dto, user);
    }
    start(id, user) {
        return this.minutesService.start(id, user);
    }
    finalize(id, user) {
        return this.minutesService.finalize(id, user);
    }
    publish(id, user) {
        return this.minutesService.publish(id, user);
    }
};
exports.MinutesController = MinutesController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], MinutesController.prototype, "health", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.MINUTES_WRITE),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_minutes_dto_1.CreateMinutesDto, Object]),
    __metadata("design:returntype", void 0)
], MinutesController.prototype, "create", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.MEETING_READ),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('meetingId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MinutesController.prototype, "list", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.MEETING_READ),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MinutesController.prototype, "getById", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.MINUTES_WRITE),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_minutes_dto_1.UpdateMinutesDto, Object]),
    __metadata("design:returntype", void 0)
], MinutesController.prototype, "update", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.MINUTES_WRITE),
    (0, common_1.Post)(':id/start'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MinutesController.prototype, "start", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.MINUTES_WRITE),
    (0, common_1.Post)(':id/finalize'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MinutesController.prototype, "finalize", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.MINUTES_PUBLISH),
    (0, common_1.Post)(':id/publish'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MinutesController.prototype, "publish", null);
exports.MinutesController = MinutesController = __decorate([
    (0, common_1.Controller)('minutes'),
    __metadata("design:paramtypes", [minutes_service_1.MinutesService])
], MinutesController);
//# sourceMappingURL=minutes.controller.js.map