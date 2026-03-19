"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsModule = void 0;
const common_1 = require("@nestjs/common");
const reports_controller_1 = require("./reports.controller");
const reports_service_1 = require("./reports.service");
const docx_parser_service_1 = require("./parsers/docx-parser.service");
const reports_repository_1 = require("./reports.repository");
const sharepoint_docx_service_1 = require("./parsers/sharepoint-docx.service");
const agendas_module_1 = require("../agendas/agendas.module");
const audit_module_1 = require("../audit/audit.module");
const templates_module_1 = require("../templates/templates.module");
const notifications_module_1 = require("../notifications/notifications.module");
const governance_module_1 = require("../governance/governance.module");
let ReportsModule = class ReportsModule {
};
exports.ReportsModule = ReportsModule;
exports.ReportsModule = ReportsModule = __decorate([
    (0, common_1.Module)({
        imports: [agendas_module_1.AgendasModule, audit_module_1.AuditModule, templates_module_1.TemplatesModule, notifications_module_1.NotificationsModule, governance_module_1.GovernanceModule],
        controllers: [reports_controller_1.ReportsController],
        providers: [reports_service_1.ReportsService, docx_parser_service_1.DocxParserService, sharepoint_docx_service_1.SharePointDocxService, reports_repository_1.ReportsRepository],
        exports: [reports_service_1.ReportsService],
    })
], ReportsModule);
//# sourceMappingURL=reports.module.js.map