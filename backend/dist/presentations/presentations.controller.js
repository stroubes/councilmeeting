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
exports.PresentationsController = void 0;
const common_1 = require("@nestjs/common");
const public_decorator_1 = require("../core/decorators/public.decorator");
const permissions_decorator_1 = require("../core/decorators/permissions.decorator");
const permissions_constants_1 = require("../core/constants/permissions.constants");
const current_user_decorator_1 = require("../core/decorators/current-user.decorator");
const create_presentation_dto_1 = require("./dto/create-presentation.dto");
const presentations_service_1 = require("./presentations.service");
let PresentationsController = class PresentationsController {
    presentationsService;
    constructor(presentationsService) {
        this.presentationsService = presentationsService;
    }
    health() {
        return this.presentationsService.health();
    }
    list(meetingId) {
        return this.presentationsService.list(meetingId);
    }
    getById(id) {
        return this.presentationsService.getById(id);
    }
    create(dto, user) {
        return this.presentationsService.create(dto, user);
    }
    remove(id, user) {
        return this.presentationsService.remove(id, user);
    }
};
exports.PresentationsController = PresentationsController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], PresentationsController.prototype, "health", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.MEETING_READ),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('meetingId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PresentationsController.prototype, "list", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.MEETING_READ),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PresentationsController.prototype, "getById", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.AGENDA_WRITE),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_presentation_dto_1.CreatePresentationDto, Object]),
    __metadata("design:returntype", void 0)
], PresentationsController.prototype, "create", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.AGENDA_WRITE),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], PresentationsController.prototype, "remove", null);
exports.PresentationsController = PresentationsController = __decorate([
    (0, common_1.Controller)('presentations'),
    __metadata("design:paramtypes", [presentations_service_1.PresentationsService])
], PresentationsController);
//# sourceMappingURL=presentations.controller.js.map