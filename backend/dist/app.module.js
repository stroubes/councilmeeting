"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const config_1 = require("@nestjs/config");
const configuration_1 = require("./config/configuration");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const roles_module_1 = require("./roles/roles.module");
const meetings_module_1 = require("./meetings/meetings.module");
const agendas_module_1 = require("./agendas/agendas.module");
const reports_module_1 = require("./reports/reports.module");
const workflows_module_1 = require("./workflows/workflows.module");
const minutes_module_1 = require("./minutes/minutes.module");
const public_portal_module_1 = require("./public-portal/public-portal.module");
const health_module_1 = require("./health/health.module");
const audit_module_1 = require("./audit/audit.module");
const microsoft_sso_guard_1 = require("./core/guards/microsoft-sso.guard");
const roles_guard_1 = require("./core/guards/roles.guard");
const permissions_guard_1 = require("./core/guards/permissions.guard");
const database_module_1 = require("./database/database.module");
const templates_module_1 = require("./templates/templates.module");
const motions_module_1 = require("./motions/motions.module");
const meeting_display_module_1 = require("./meeting-display/meeting-display.module");
const presentations_module_1 = require("./presentations/presentations.module");
const meeting_types_module_1 = require("./meeting-types/meeting-types.module");
const governance_module_1 = require("./governance/governance.module");
const notifications_module_1 = require("./notifications/notifications.module");
const api_settings_module_1 = require("./api-settings/api-settings.module");
const analytics_module_1 = require("./analytics/analytics.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true, load: [configuration_1.default] }),
            database_module_1.DatabaseModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            roles_module_1.RolesModule,
            meetings_module_1.MeetingsModule,
            meeting_types_module_1.MeetingTypesModule,
            agendas_module_1.AgendasModule,
            reports_module_1.ReportsModule,
            workflows_module_1.WorkflowsModule,
            minutes_module_1.MinutesModule,
            public_portal_module_1.PublicPortalModule,
            health_module_1.HealthModule,
            audit_module_1.AuditModule,
            templates_module_1.TemplatesModule,
            motions_module_1.MotionsModule,
            meeting_display_module_1.MeetingDisplayModule,
            presentations_module_1.PresentationsModule,
            governance_module_1.GovernanceModule,
            notifications_module_1.NotificationsModule,
            api_settings_module_1.ApiSettingsModule,
            analytics_module_1.AnalyticsModule,
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: microsoft_sso_guard_1.MicrosoftSsoGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: roles_guard_1.RolesGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: permissions_guard_1.PermissionsGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map