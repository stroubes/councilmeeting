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
exports.AgendasController = void 0;
const common_1 = require("@nestjs/common");
const agendas_service_1 = require("./agendas.service");
const permissions_decorator_1 = require("../core/decorators/permissions.decorator");
const permissions_constants_1 = require("../core/constants/permissions.constants");
const public_decorator_1 = require("../core/decorators/public.decorator");
const current_user_decorator_1 = require("../core/decorators/current-user.decorator");
const create_agenda_dto_1 = require("./dto/create-agenda.dto");
const update_agenda_dto_1 = require("./dto/update-agenda.dto");
const create_agenda_item_dto_1 = require("./items/dto/create-agenda-item.dto");
const update_agenda_item_dto_1 = require("./items/dto/update-agenda-item.dto");
const reorder_agenda_items_dto_1 = require("./items/dto/reorder-agenda-items.dto");
const reject_agenda_dto_1 = require("./dto/reject-agenda.dto");
let AgendasController = class AgendasController {
    agendasService;
    constructor(agendasService) {
        this.agendasService = agendasService;
    }
    health() {
        return this.agendasService.health();
    }
    create(dto, user) {
        return this.agendasService.create(dto, user);
    }
    list(meetingId) {
        return this.agendasService.list(meetingId);
    }
    getById(id) {
        return this.agendasService.getById(id);
    }
    update(id, dto) {
        return this.agendasService.update(id, dto);
    }
    addItem(id, dto, user) {
        return this.agendasService.addItem(id, dto, user);
    }
    updateItem(id, itemId, dto) {
        return this.agendasService.updateItem(id, itemId, dto);
    }
    reorderItems(id, dto) {
        return this.agendasService.reorderItems(id, dto);
    }
    removeItem(id, itemId) {
        return this.agendasService.removeItem(id, itemId);
    }
    submitForDirector(id) {
        return this.agendasService.submitForDirector(id);
    }
    approveByDirector(id, user) {
        return this.agendasService.approveByDirector(id, user);
    }
    approveByCao(id, user) {
        return this.agendasService.approveByCao(id, user);
    }
    reject(id, user, dto) {
        return this.agendasService.reject(id, user, dto);
    }
    publish(id) {
        return this.agendasService.publish(id);
    }
    remove(id, user) {
        return this.agendasService.remove(id, user);
    }
};
exports.AgendasController = AgendasController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], AgendasController.prototype, "health", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.AGENDA_WRITE),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_agenda_dto_1.CreateAgendaDto, Object]),
    __metadata("design:returntype", void 0)
], AgendasController.prototype, "create", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.MEETING_READ),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('meetingId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AgendasController.prototype, "list", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.MEETING_READ),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AgendasController.prototype, "getById", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.AGENDA_WRITE),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_agenda_dto_1.UpdateAgendaDto]),
    __metadata("design:returntype", void 0)
], AgendasController.prototype, "update", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.AGENDA_WRITE),
    (0, common_1.Post)(':id/items'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_agenda_item_dto_1.CreateAgendaItemDto, Object]),
    __metadata("design:returntype", void 0)
], AgendasController.prototype, "addItem", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.AGENDA_WRITE),
    (0, common_1.Patch)(':id/items/:itemId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('itemId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_agenda_item_dto_1.UpdateAgendaItemDto]),
    __metadata("design:returntype", void 0)
], AgendasController.prototype, "updateItem", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.AGENDA_WRITE),
    (0, common_1.Post)(':id/items/reorder'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, reorder_agenda_items_dto_1.ReorderAgendaItemsDto]),
    __metadata("design:returntype", void 0)
], AgendasController.prototype, "reorderItems", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.AGENDA_WRITE),
    (0, common_1.Delete)(':id/items/:itemId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('itemId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AgendasController.prototype, "removeItem", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.AGENDA_WRITE),
    (0, common_1.Post)(':id/submit-director'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AgendasController.prototype, "submitForDirector", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.REPORT_APPROVE_DIRECTOR),
    (0, common_1.Post)(':id/approve-director'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AgendasController.prototype, "approveByDirector", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.REPORT_APPROVE_CAO),
    (0, common_1.Post)(':id/approve-cao'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AgendasController.prototype, "approveByCao", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.AGENDA_WRITE),
    (0, common_1.Post)(':id/reject'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, reject_agenda_dto_1.RejectAgendaDto]),
    __metadata("design:returntype", void 0)
], AgendasController.prototype, "reject", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.AGENDA_PUBLISH),
    (0, common_1.Post)(':id/publish'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AgendasController.prototype, "publish", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.AGENDA_WRITE),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], AgendasController.prototype, "remove", null);
exports.AgendasController = AgendasController = __decorate([
    (0, common_1.Controller)('agendas'),
    __metadata("design:paramtypes", [agendas_service_1.AgendasService])
], AgendasController);
//# sourceMappingURL=agendas.controller.js.map