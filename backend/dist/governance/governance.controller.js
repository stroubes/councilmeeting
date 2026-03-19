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
exports.GovernanceController = void 0;
const common_1 = require("@nestjs/common");
const permissions_decorator_1 = require("../core/decorators/permissions.decorator");
const public_decorator_1 = require("../core/decorators/public.decorator");
const permissions_constants_1 = require("../core/constants/permissions.constants");
const governance_service_1 = require("./governance.service");
const set_active_profile_dto_1 = require("./dto/set-active-profile.dto");
let GovernanceController = class GovernanceController {
    governanceService;
    constructor(governanceService) {
        this.governanceService = governanceService;
    }
    health() {
        return this.governanceService.health();
    }
    getActiveProfile() {
        return this.governanceService.getActiveProfile();
    }
    listProfiles() {
        return this.governanceService.listProfiles();
    }
    setActiveProfile(dto) {
        return this.governanceService.setActiveProfile(dto.profileId);
    }
    getPolicyPack() {
        return this.governanceService.getPolicyPack();
    }
};
exports.GovernanceController = GovernanceController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], GovernanceController.prototype, "health", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.MEETING_READ),
    (0, common_1.Get)('profile'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], GovernanceController.prototype, "getActiveProfile", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.MEETING_READ),
    (0, common_1.Get)('profiles'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], GovernanceController.prototype, "listProfiles", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.USERS_MANAGE),
    (0, common_1.Patch)('profile'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [set_active_profile_dto_1.SetActiveProfileDto]),
    __metadata("design:returntype", void 0)
], GovernanceController.prototype, "setActiveProfile", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.MEETING_READ),
    (0, common_1.Get)('policy-pack'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], GovernanceController.prototype, "getPolicyPack", null);
exports.GovernanceController = GovernanceController = __decorate([
    (0, common_1.Controller)('governance'),
    __metadata("design:paramtypes", [governance_service_1.GovernanceService])
], GovernanceController);
//# sourceMappingURL=governance.controller.js.map