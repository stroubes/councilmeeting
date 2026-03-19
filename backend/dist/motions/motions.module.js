"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MotionsModule = void 0;
const common_1 = require("@nestjs/common");
const audit_module_1 = require("../audit/audit.module");
const meetings_module_1 = require("../meetings/meetings.module");
const motions_controller_1 = require("./motions.controller");
const motions_repository_1 = require("./motions.repository");
const motions_service_1 = require("./motions.service");
let MotionsModule = class MotionsModule {
};
exports.MotionsModule = MotionsModule;
exports.MotionsModule = MotionsModule = __decorate([
    (0, common_1.Module)({
        imports: [meetings_module_1.MeetingsModule, audit_module_1.AuditModule],
        controllers: [motions_controller_1.MotionsController],
        providers: [motions_service_1.MotionsService, motions_repository_1.MotionsRepository],
        exports: [motions_service_1.MotionsService],
    })
], MotionsModule);
//# sourceMappingURL=motions.module.js.map