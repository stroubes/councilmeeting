"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingDisplayModule = void 0;
const common_1 = require("@nestjs/common");
const agendas_module_1 = require("../agendas/agendas.module");
const audit_module_1 = require("../audit/audit.module");
const meetings_module_1 = require("../meetings/meetings.module");
const motions_module_1 = require("../motions/motions.module");
const presentations_module_1 = require("../presentations/presentations.module");
const meeting_display_controller_1 = require("./meeting-display.controller");
const meeting_display_repository_1 = require("./meeting-display.repository");
const meeting_display_service_1 = require("./meeting-display.service");
let MeetingDisplayModule = class MeetingDisplayModule {
};
exports.MeetingDisplayModule = MeetingDisplayModule;
exports.MeetingDisplayModule = MeetingDisplayModule = __decorate([
    (0, common_1.Module)({
        imports: [meetings_module_1.MeetingsModule, agendas_module_1.AgendasModule, motions_module_1.MotionsModule, presentations_module_1.PresentationsModule, audit_module_1.AuditModule],
        controllers: [meeting_display_controller_1.MeetingDisplayController],
        providers: [meeting_display_service_1.MeetingDisplayService, meeting_display_repository_1.MeetingDisplayRepository],
        exports: [meeting_display_service_1.MeetingDisplayService],
    })
], MeetingDisplayModule);
//# sourceMappingURL=meeting-display.module.js.map