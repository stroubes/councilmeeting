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
exports.WorkflowsController = void 0;
const common_1 = require("@nestjs/common");
const workflows_service_1 = require("./workflows.service");
const public_decorator_1 = require("../core/decorators/public.decorator");
const permissions_decorator_1 = require("../core/decorators/permissions.decorator");
const permissions_constants_1 = require("../core/constants/permissions.constants");
const current_user_decorator_1 = require("../core/decorators/current-user.decorator");
const approve_report_dto_1 = require("./dto/approve-report.dto");
const reject_report_dto_1 = require("./dto/reject-report.dto");
const resubmit_report_dto_1 = require("./dto/resubmit-report.dto");
let WorkflowsController = class WorkflowsController {
    workflowsService;
    constructor(workflowsService) {
        this.workflowsService = workflowsService;
    }
    health() {
        return this.workflowsService.health();
    }
    directorQueue() {
        return this.workflowsService.directorQueue();
    }
    caoQueue() {
        return this.workflowsService.caoQueue();
    }
    reportHistory(reportId) {
        return this.workflowsService.reportHistory(reportId);
    }
    approveDirector(reportId, user, dto) {
        return this.workflowsService.approveReportByDirector(reportId, user, dto);
    }
    approveCao(reportId, user, dto) {
        return this.workflowsService.approveReportByCao(reportId, user, dto);
    }
    rejectDirector(reportId, user, dto) {
        return this.workflowsService.rejectReportByDirector(reportId, user, dto);
    }
    rejectCao(reportId, user, dto) {
        return this.workflowsService.rejectReportByCao(reportId, user, dto);
    }
    resubmit(reportId, user, dto) {
        return this.workflowsService.resubmitReport(reportId, user, dto);
    }
};
exports.WorkflowsController = WorkflowsController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], WorkflowsController.prototype, "health", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.REPORT_APPROVE_DIRECTOR),
    (0, common_1.Get)('reports/director-queue'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WorkflowsController.prototype, "directorQueue", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.REPORT_APPROVE_CAO),
    (0, common_1.Get)('reports/cao-queue'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], WorkflowsController.prototype, "caoQueue", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.MEETING_READ),
    (0, common_1.Get)('reports/:reportId/history'),
    __param(0, (0, common_1.Param)('reportId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], WorkflowsController.prototype, "reportHistory", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.REPORT_APPROVE_DIRECTOR),
    (0, common_1.Post)('reports/:reportId/approve-director'),
    __param(0, (0, common_1.Param)('reportId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, approve_report_dto_1.ApproveReportDto]),
    __metadata("design:returntype", void 0)
], WorkflowsController.prototype, "approveDirector", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.REPORT_APPROVE_CAO),
    (0, common_1.Post)('reports/:reportId/approve-cao'),
    __param(0, (0, common_1.Param)('reportId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, approve_report_dto_1.ApproveReportDto]),
    __metadata("design:returntype", void 0)
], WorkflowsController.prototype, "approveCao", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.REPORT_APPROVE_DIRECTOR),
    (0, common_1.Post)('reports/:reportId/reject-director'),
    __param(0, (0, common_1.Param)('reportId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, reject_report_dto_1.RejectReportDto]),
    __metadata("design:returntype", void 0)
], WorkflowsController.prototype, "rejectDirector", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.REPORT_APPROVE_CAO),
    (0, common_1.Post)('reports/:reportId/reject-cao'),
    __param(0, (0, common_1.Param)('reportId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, reject_report_dto_1.RejectReportDto]),
    __metadata("design:returntype", void 0)
], WorkflowsController.prototype, "rejectCao", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.REPORT_SUBMIT),
    (0, common_1.Post)('reports/:reportId/resubmit'),
    __param(0, (0, common_1.Param)('reportId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, resubmit_report_dto_1.ResubmitReportDto]),
    __metadata("design:returntype", void 0)
], WorkflowsController.prototype, "resubmit", null);
exports.WorkflowsController = WorkflowsController = __decorate([
    (0, common_1.Controller)('workflows'),
    __metadata("design:paramtypes", [workflows_service_1.WorkflowsService])
], WorkflowsController);
//# sourceMappingURL=workflows.controller.js.map