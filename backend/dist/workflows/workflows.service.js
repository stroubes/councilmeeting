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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowsService = void 0;
const common_1 = require("@nestjs/common");
const reports_service_1 = require("../reports/reports.service");
let WorkflowsService = class WorkflowsService {
    reportsService;
    constructor(reportsService) {
        this.reportsService = reportsService;
    }
    health() {
        return { status: 'ok' };
    }
    directorQueue() {
        return this.reportsService.listPendingDirector();
    }
    caoQueue() {
        return this.reportsService.listPendingCao();
    }
    reportHistory(reportId) {
        return this.reportsService.getApprovalHistory(reportId);
    }
    approveReportByDirector(reportId, user, dto) {
        return this.reportsService.approveDirector(reportId, user, dto.comments);
    }
    approveReportByCao(reportId, user, dto) {
        return this.reportsService.approveCao(reportId, user, dto.comments);
    }
    rejectReportByDirector(reportId, user, dto) {
        return this.reportsService.reject(reportId, user, 'DIRECTOR', dto.comments);
    }
    rejectReportByCao(reportId, user, dto) {
        return this.reportsService.reject(reportId, user, 'CAO', dto.comments);
    }
    resubmitReport(reportId, user, dto) {
        return this.reportsService.resubmit(reportId, user, dto.comments);
    }
};
exports.WorkflowsService = WorkflowsService;
exports.WorkflowsService = WorkflowsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], WorkflowsService);
//# sourceMappingURL=workflows.service.js.map