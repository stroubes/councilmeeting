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
exports.ApiSettingsController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../core/decorators/current-user.decorator");
const permissions_decorator_1 = require("../core/decorators/permissions.decorator");
const public_decorator_1 = require("../core/decorators/public.decorator");
const permissions_constants_1 = require("../core/constants/permissions.constants");
const api_settings_service_1 = require("./api-settings.service");
const upsert_api_setting_dto_1 = require("./dto/upsert-api-setting.dto");
let ApiSettingsController = class ApiSettingsController {
    apiSettingsService;
    constructor(apiSettingsService) {
        this.apiSettingsService = apiSettingsService;
    }
    health() {
        return this.apiSettingsService.health();
    }
    list() {
        return this.apiSettingsService.list();
    }
    runtimeMetadata() {
        return this.apiSettingsService.runtimeMetadata();
    }
    upsert(dto, user) {
        return this.apiSettingsService.upsert(dto, user);
    }
    remove(id, user) {
        return this.apiSettingsService.remove(id, user);
    }
};
exports.ApiSettingsController = ApiSettingsController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], ApiSettingsController.prototype, "health", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.USERS_MANAGE),
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ApiSettingsController.prototype, "list", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.USERS_MANAGE),
    (0, common_1.Get)('runtime-metadata'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ApiSettingsController.prototype, "runtimeMetadata", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.USERS_MANAGE),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [upsert_api_setting_dto_1.UpsertApiSettingDto, Object]),
    __metadata("design:returntype", void 0)
], ApiSettingsController.prototype, "upsert", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.USERS_MANAGE),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ApiSettingsController.prototype, "remove", null);
exports.ApiSettingsController = ApiSettingsController = __decorate([
    (0, common_1.Controller)('api-settings'),
    __metadata("design:paramtypes", [api_settings_service_1.ApiSettingsService])
], ApiSettingsController);
//# sourceMappingURL=api-settings.controller.js.map