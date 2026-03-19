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
exports.MeetingDisplayController = void 0;
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../core/decorators/current-user.decorator");
const public_decorator_1 = require("../core/decorators/public.decorator");
const permissions_decorator_1 = require("../core/decorators/permissions.decorator");
const permissions_constants_1 = require("../core/constants/permissions.constants");
const set_live_agenda_item_dto_1 = require("./dto/set-live-agenda-item.dto");
const set_live_presentation_dto_1 = require("./dto/set-live-presentation.dto");
const set_presentation_slide_dto_1 = require("./dto/set-presentation-slide.dto");
const meeting_display_service_1 = require("./meeting-display.service");
let MeetingDisplayController = class MeetingDisplayController {
    meetingDisplayService;
    constructor(meetingDisplayService) {
        this.meetingDisplayService = meetingDisplayService;
    }
    health() {
        return this.meetingDisplayService.health();
    }
    getState(meetingId) {
        return this.meetingDisplayService.getState(meetingId);
    }
    getPublicState(meetingId) {
        return this.meetingDisplayService.getState(meetingId);
    }
    streamPublicState(meetingId) {
        return this.meetingDisplayService.streamPublicState(meetingId);
    }
    async getPublicPresentationContent(meetingId, response) {
        const content = await this.meetingDisplayService.getPublicPresentationContent(meetingId);
        response.setHeader('Content-Type', 'application/pdf');
        response.setHeader('Cache-Control', 'no-store');
        response.setHeader('Content-Disposition', `inline; filename="${content.fileName}"`);
        response.setHeader('X-Presentation-Slide-Number', String(content.slideNumber));
        response.send(content.buffer);
    }
    setAgendaItem(meetingId, dto, user) {
        return this.meetingDisplayService.setAgendaItem(meetingId, dto.agendaItemId, user);
    }
    nextAgendaItem(meetingId, user) {
        return this.meetingDisplayService.nextAgendaItem(meetingId, user);
    }
    previousAgendaItem(meetingId, user) {
        return this.meetingDisplayService.previousAgendaItem(meetingId, user);
    }
    showAgenda(meetingId, user) {
        return this.meetingDisplayService.showAgenda(meetingId, user);
    }
    showMotion(meetingId, user) {
        return this.meetingDisplayService.showMotion(meetingId, user);
    }
    setPresentation(meetingId, dto, user) {
        return this.meetingDisplayService.setPresentation(meetingId, dto.presentationId, user);
    }
    nextPresentationSlide(meetingId, user) {
        return this.meetingDisplayService.nextPresentationSlide(meetingId, user);
    }
    previousPresentationSlide(meetingId, user) {
        return this.meetingDisplayService.previousPresentationSlide(meetingId, user);
    }
    setPresentationSlide(meetingId, dto, user) {
        return this.meetingDisplayService.setPresentationSlide(meetingId, dto.slideNumber, user);
    }
    showPresentation(meetingId, user) {
        return this.meetingDisplayService.showPresentation(meetingId, user);
    }
};
exports.MeetingDisplayController = MeetingDisplayController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Object)
], MeetingDisplayController.prototype, "health", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.MEETING_READ),
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('meetingId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MeetingDisplayController.prototype, "getState", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('public/state'),
    __param(0, (0, common_1.Query)('meetingId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], MeetingDisplayController.prototype, "getPublicState", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Sse)('public/stream'),
    __param(0, (0, common_1.Query)('meetingId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Function)
], MeetingDisplayController.prototype, "streamPublicState", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Get)('public/presentation-content'),
    __param(0, (0, common_1.Query)('meetingId')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MeetingDisplayController.prototype, "getPublicPresentationContent", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.AGENDA_WRITE),
    (0, common_1.Post)(':meetingId/set-agenda-item'),
    __param(0, (0, common_1.Param)('meetingId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, set_live_agenda_item_dto_1.SetLiveAgendaItemDto, Object]),
    __metadata("design:returntype", void 0)
], MeetingDisplayController.prototype, "setAgendaItem", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.AGENDA_WRITE),
    (0, common_1.Post)(':meetingId/next'),
    __param(0, (0, common_1.Param)('meetingId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MeetingDisplayController.prototype, "nextAgendaItem", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.AGENDA_WRITE),
    (0, common_1.Post)(':meetingId/previous'),
    __param(0, (0, common_1.Param)('meetingId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MeetingDisplayController.prototype, "previousAgendaItem", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.AGENDA_WRITE),
    (0, common_1.Post)(':meetingId/show-agenda'),
    __param(0, (0, common_1.Param)('meetingId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MeetingDisplayController.prototype, "showAgenda", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.AGENDA_WRITE),
    (0, common_1.Post)(':meetingId/show-motion'),
    __param(0, (0, common_1.Param)('meetingId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MeetingDisplayController.prototype, "showMotion", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.AGENDA_WRITE),
    (0, common_1.Post)(':meetingId/set-presentation'),
    __param(0, (0, common_1.Param)('meetingId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, set_live_presentation_dto_1.SetLivePresentationDto, Object]),
    __metadata("design:returntype", void 0)
], MeetingDisplayController.prototype, "setPresentation", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.AGENDA_WRITE),
    (0, common_1.Post)(':meetingId/presentation/next'),
    __param(0, (0, common_1.Param)('meetingId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MeetingDisplayController.prototype, "nextPresentationSlide", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.AGENDA_WRITE),
    (0, common_1.Post)(':meetingId/presentation/previous'),
    __param(0, (0, common_1.Param)('meetingId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MeetingDisplayController.prototype, "previousPresentationSlide", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.AGENDA_WRITE),
    (0, common_1.Post)(':meetingId/presentation/set-slide'),
    __param(0, (0, common_1.Param)('meetingId')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, set_presentation_slide_dto_1.SetPresentationSlideDto, Object]),
    __metadata("design:returntype", void 0)
], MeetingDisplayController.prototype, "setPresentationSlide", null);
__decorate([
    (0, permissions_decorator_1.Permissions)(permissions_constants_1.PERMISSIONS.AGENDA_WRITE),
    (0, common_1.Post)(':meetingId/show-presentation'),
    __param(0, (0, common_1.Param)('meetingId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], MeetingDisplayController.prototype, "showPresentation", null);
exports.MeetingDisplayController = MeetingDisplayController = __decorate([
    (0, common_1.Controller)('meeting-display'),
    __metadata("design:paramtypes", [meeting_display_service_1.MeetingDisplayService])
], MeetingDisplayController);
//# sourceMappingURL=meeting-display.controller.js.map