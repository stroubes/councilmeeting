"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PresentationsModule = void 0;
const common_1 = require("@nestjs/common");
const audit_module_1 = require("../audit/audit.module");
const meetings_module_1 = require("../meetings/meetings.module");
const presentations_controller_1 = require("./presentations.controller");
const presentations_repository_1 = require("./presentations.repository");
const presentations_service_1 = require("./presentations.service");
let PresentationsModule = class PresentationsModule {
};
exports.PresentationsModule = PresentationsModule;
exports.PresentationsModule = PresentationsModule = __decorate([
    (0, common_1.Module)({
        imports: [meetings_module_1.MeetingsModule, audit_module_1.AuditModule],
        controllers: [presentations_controller_1.PresentationsController],
        providers: [presentations_service_1.PresentationsService, presentations_repository_1.PresentationsRepository],
        exports: [presentations_service_1.PresentationsService],
    })
], PresentationsModule);
//# sourceMappingURL=presentations.module.js.map