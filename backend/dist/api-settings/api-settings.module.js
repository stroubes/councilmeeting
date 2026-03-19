"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiSettingsModule = void 0;
const common_1 = require("@nestjs/common");
const audit_module_1 = require("../audit/audit.module");
const governance_module_1 = require("../governance/governance.module");
const api_settings_controller_1 = require("./api-settings.controller");
const api_settings_repository_1 = require("./api-settings.repository");
const api_settings_service_1 = require("./api-settings.service");
let ApiSettingsModule = class ApiSettingsModule {
};
exports.ApiSettingsModule = ApiSettingsModule;
exports.ApiSettingsModule = ApiSettingsModule = __decorate([
    (0, common_1.Module)({
        imports: [audit_module_1.AuditModule, governance_module_1.GovernanceModule],
        controllers: [api_settings_controller_1.ApiSettingsController],
        providers: [api_settings_service_1.ApiSettingsService, api_settings_repository_1.ApiSettingsRepository],
        exports: [api_settings_service_1.ApiSettingsService],
    })
], ApiSettingsModule);
//# sourceMappingURL=api-settings.module.js.map