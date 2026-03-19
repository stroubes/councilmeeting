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
exports.TemplatesController = void 0;
const common_1 = require("@nestjs/common");
const permissions_constants_1 = require("../core/constants/permissions.constants");
const current_user_decorator_1 = require("../core/decorators/current-user.decorator");
const permissions_decorator_1 = require("../core/decorators/permissions.decorator");
const public_decorator_1 = require("../core/decorators/public.decorator");
const create_template_dto_1 = require("./dto/create-template.dto");
const create_template_section_dto_1 = require("./dto/create-template-section.dto");
const reorder_template_sections_dto_1 = require("./dto/reorder-template-sections.dto");
const template_query_dto_1 = require("./dto/template-query.dto");
const update_template_section_dto_1 = require("./dto/update-template-section.dto");
const update_template_dto_1 = require("./dto/update-template.dto");
const templates_service_1 = require("./templates.service");
let TemplatesController = class TemplatesController {
    templatesService;
    constructor(templatesService) {
        this.templatesService = templatesService;
    }
    health() {
        return this.templatesService.health();
    }
    list(query) {
        return this.templatesService.list(query);
    }
    getById(id) {
        return this.templatesService.getById(id);
    }
    create(dto, user) {
        return this.templatesService.create(dto, user);
    }
    update(id, dto, user) {
        return this.templatesService.update(id, dto, user);
    }
    addSection(id, dto, user) {
        return this.templatesService.addSection(id, dto, user);
    }
    updateSection(id, sectionId, dto, user) {
        return this.templatesService.updateSection(id, sectionId, dto, user);
    }
    removeSection(id, sectionId, user) {
        return this.templatesService.removeSection(id, sectionId, user);
    }
    remove(id, user) {
        return this.templatesService.remove(id, user);
    }
    reorderSections(id, dto, user) {
        return this.templatesService.reorderSections(id, dto, user);
    }
    async exportDocx(id, response) {
        const exported = await this.templatesService.exportDocx(id);
        response.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        response.setHeader('Content-Disposition', `attachment; filename="${exported.fileName}"`);
        return new common_1.StreamableFile(exported.buffer);
    }
};
exports.TemplatesController = TemplatesController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], TemplatesController.prototype, "health", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.MEETING_READ),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [template_query_dto_1.TemplateQueryDto]),
    __metadata("design:returntype", void 0)
], TemplatesController.prototype, "list", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.MEETING_READ),
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TemplatesController.prototype, "getById", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.TEMPLATES_MANAGE),
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_template_dto_1.CreateTemplateDto, Object]),
    __metadata("design:returntype", void 0)
], TemplatesController.prototype, "create", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.TEMPLATES_MANAGE),
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_template_dto_1.UpdateTemplateDto, Object]),
    __metadata("design:returntype", void 0)
], TemplatesController.prototype, "update", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.TEMPLATES_MANAGE),
    (0, common_1.Post)(':id/sections'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_template_section_dto_1.CreateTemplateSectionDto, Object]),
    __metadata("design:returntype", void 0)
], TemplatesController.prototype, "addSection", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.TEMPLATES_MANAGE),
    (0, common_1.Patch)(':id/sections/:sectionId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('sectionId')),
    __param(2, (0, common_1.Body)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_template_section_dto_1.UpdateTemplateSectionDto, Object]),
    __metadata("design:returntype", void 0)
], TemplatesController.prototype, "updateSection", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.TEMPLATES_MANAGE),
    (0, common_1.Delete)(':id/sections/:sectionId'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Param)('sectionId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], TemplatesController.prototype, "removeSection", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.TEMPLATES_MANAGE),
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TemplatesController.prototype, "remove", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.TEMPLATES_MANAGE),
    (0, common_1.Post)(':id/sections/reorder'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, reorder_template_sections_dto_1.ReorderTemplateSectionsDto, Object]),
    __metadata("design:returntype", void 0)
], TemplatesController.prototype, "reorderSections", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.MEETING_READ),
    (0, common_1.Get)(':id/export-docx'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TemplatesController.prototype, "exportDocx", null);
exports.TemplatesController = TemplatesController = __decorate([
    (0, common_1.Controller)('templates'),
    __metadata("design:paramtypes", [templates_service_1.TemplatesService])
], TemplatesController);
//# sourceMappingURL=templates.controller.js.map