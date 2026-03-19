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
exports.PublicPortalController = void 0;
const common_1 = require("@nestjs/common");
const permissions_constants_1 = require("../core/constants/permissions.constants");
const permissions_decorator_1 = require("../core/decorators/permissions.decorator");
const public_decorator_1 = require("../core/decorators/public.decorator");
const create_public_subscription_dto_1 = require("./dto/create-public-subscription.dto");
const update_public_subscription_dto_1 = require("./dto/update-public-subscription.dto");
const public_portal_service_1 = require("./public-portal.service");
let PublicPortalController = class PublicPortalController {
    publicPortalService;
    constructor(publicPortalService) {
        this.publicPortalService = publicPortalService;
    }
    summary() {
        return this.publicPortalService.summary();
    }
    meetings() {
        return this.publicPortalService.listMeetings();
    }
    agendas() {
        return this.publicPortalService.listAgendas();
    }
    reports() {
        return this.publicPortalService.listReports();
    }
    minutes() {
        return this.publicPortalService.listMinutes();
    }
    createSubscription(dto) {
        return this.publicPortalService.createSubscription(dto);
    }
    listSubscriptions(email) {
        return this.publicPortalService.listSubscriptionsByEmail(email);
    }
    updateSubscription(id, dto) {
        return this.publicPortalService.updateSubscription(id, dto);
    }
    async removeSubscription(id) {
        await this.publicPortalService.removeSubscription(id);
        return { ok: true };
    }
    previewSubscription(id) {
        return this.publicPortalService.previewSubscriptionAlerts(id);
    }
    runDigestSweep() {
        return this.publicPortalService.runDigestSweep();
    }
};
exports.PublicPortalController = PublicPortalController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('summary'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PublicPortalController.prototype, "summary", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('meetings'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PublicPortalController.prototype, "meetings", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('agendas'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PublicPortalController.prototype, "agendas", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('reports'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PublicPortalController.prototype, "reports", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('minutes'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PublicPortalController.prototype, "minutes", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('subscriptions'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_public_subscription_dto_1.CreatePublicSubscriptionDto]),
    __metadata("design:returntype", void 0)
], PublicPortalController.prototype, "createSubscription", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('subscriptions'),
    __param(0, (0, common_1.Query)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PublicPortalController.prototype, "listSubscriptions", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Patch)('subscriptions/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_public_subscription_dto_1.UpdatePublicSubscriptionDto]),
    __metadata("design:returntype", void 0)
], PublicPortalController.prototype, "updateSubscription", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Delete)('subscriptions/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PublicPortalController.prototype, "removeSubscription", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('subscriptions/:id/preview'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PublicPortalController.prototype, "previewSubscription", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.USERS_MANAGE),
    (0, common_1.Post)('subscriptions/digest/run'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], PublicPortalController.prototype, "runDigestSweep", null);
exports.PublicPortalController = PublicPortalController = __decorate([
    (0, common_1.Controller)('public'),
    __metadata("design:paramtypes", [public_portal_service_1.PublicPortalService])
], PublicPortalController);
//# sourceMappingURL=public-portal.controller.js.map