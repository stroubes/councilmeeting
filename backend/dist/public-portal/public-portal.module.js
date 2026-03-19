"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicPortalModule = void 0;
const common_1 = require("@nestjs/common");
const public_portal_controller_1 = require("./public-portal.controller");
const public_portal_service_1 = require("./public-portal.service");
const public_digest_scheduler_1 = require("./public-digest.scheduler");
const public_subscriptions_repository_1 = require("./public-subscriptions.repository");
const meetings_module_1 = require("../meetings/meetings.module");
const agendas_module_1 = require("../agendas/agendas.module");
const reports_module_1 = require("../reports/reports.module");
const minutes_module_1 = require("../minutes/minutes.module");
const notifications_module_1 = require("../notifications/notifications.module");
let PublicPortalModule = class PublicPortalModule {
};
exports.PublicPortalModule = PublicPortalModule;
exports.PublicPortalModule = PublicPortalModule = __decorate([
    (0, common_1.Module)({
        imports: [meetings_module_1.MeetingsModule, agendas_module_1.AgendasModule, reports_module_1.ReportsModule, minutes_module_1.MinutesModule, notifications_module_1.NotificationsModule],
        controllers: [public_portal_controller_1.PublicPortalController],
        providers: [public_portal_service_1.PublicPortalService, public_subscriptions_repository_1.PublicSubscriptionsRepository, public_digest_scheduler_1.PublicDigestScheduler],
        exports: [public_portal_service_1.PublicPortalService],
    })
], PublicPortalModule);
//# sourceMappingURL=public-portal.module.js.map