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
exports.MeetingDisplayService = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const agendas_service_1 = require("../agendas/agendas.service");
const audit_service_1 = require("../audit/audit.service");
const meetings_service_1 = require("../meetings/meetings.service");
const motions_service_1 = require("../motions/motions.service");
const presentations_service_1 = require("../presentations/presentations.service");
const meeting_display_repository_1 = require("./meeting-display.repository");
let MeetingDisplayService = class MeetingDisplayService {
    meetingsService;
    agendasService;
    motionsService;
    presentationsService;
    meetingDisplayRepository;
    auditService;
    constructor(meetingsService, agendasService, motionsService, presentationsService, meetingDisplayRepository, auditService) {
        this.meetingsService = meetingsService;
        this.agendasService = agendasService;
        this.motionsService = motionsService;
        this.presentationsService = presentationsService;
        this.meetingDisplayRepository = meetingDisplayRepository;
        this.auditService = auditService;
    }
    health() {
        return { status: 'ok' };
    }
    async getState(meetingId) {
        await this.ensureMeetingExists(meetingId);
        const [resolvedAgenda, persistedState, motionPublicState, presentations] = await Promise.all([
            this.resolveAgendaContext(meetingId),
            this.meetingDisplayRepository.getByMeetingId(meetingId),
            this.motionsService.getPublicState(meetingId),
            this.presentationsService.list(meetingId),
        ]);
        const state = await this.ensureValidState(meetingId, resolvedAgenda, presentations, persistedState, 'system');
        const currentItem = this.findCurrentAgendaItem(state.currentAgendaItemId, resolvedAgenda.items);
        const currentPresentation = this.findCurrentPresentation(state.currentPresentationId, presentations);
        const totalSlides = currentPresentation?.pageCount ?? 0;
        const currentSlideIndex = currentPresentation
            ? this.normalizeSlideIndex(state.currentPresentationSlideIndex ?? 0, totalSlides)
            : 0;
        return {
            meetingId,
            displayMode: state.displayMode,
            agenda: {
                agendaId: resolvedAgenda.agenda?.id ?? null,
                currentItem,
                orderedItems: resolvedAgenda.items,
            },
            motion: {
                liveMotion: motionPublicState.liveMotion,
                recentOutcomeMotion: motionPublicState.recentOutcomeMotion,
            },
            presentation: {
                currentPresentation,
                currentSlideIndex,
                currentSlideNumber: totalSlides > 0 ? currentSlideIndex + 1 : 0,
                totalSlides,
                items: presentations,
            },
            updatedAt: state.updatedAt,
        };
    }
    async setAgendaItem(meetingId, agendaItemId, user) {
        await this.ensureMeetingExists(meetingId);
        const resolvedAgenda = await this.resolveAgendaContext(meetingId);
        const hasItem = resolvedAgenda.items.some((item) => item.id === agendaItemId);
        if (!hasItem) {
            throw new common_1.BadRequestException('Agenda item is not available for this meeting display');
        }
        await this.meetingDisplayRepository.upsert(meetingId, {
            displayMode: 'AGENDA',
            currentAgendaItemId: agendaItemId,
        }, user.id);
        await this.auditService.log({
            actorUserId: user.id,
            action: 'meeting_display.set_agenda_item',
            entityType: 'meeting',
            entityId: meetingId,
            changesJson: { agendaItemId },
        });
        return this.getState(meetingId);
    }
    async nextAgendaItem(meetingId, user) {
        return this.stepAgendaItem(meetingId, user, 'next');
    }
    async previousAgendaItem(meetingId, user) {
        return this.stepAgendaItem(meetingId, user, 'previous');
    }
    async showAgenda(meetingId, user) {
        await this.ensureMeetingExists(meetingId);
        const [resolvedAgenda, presentations, existing] = await Promise.all([
            this.resolveAgendaContext(meetingId),
            this.presentationsService.list(meetingId),
            this.meetingDisplayRepository.getByMeetingId(meetingId),
        ]);
        const state = await this.ensureValidState(meetingId, resolvedAgenda, presentations, existing, user.id);
        await this.meetingDisplayRepository.upsert(meetingId, {
            displayMode: 'AGENDA',
            currentAgendaItemId: state.currentAgendaItemId,
        }, user.id);
        await this.auditService.log({
            actorUserId: user.id,
            action: 'meeting_display.show_agenda',
            entityType: 'meeting',
            entityId: meetingId,
        });
        return this.getState(meetingId);
    }
    async showMotion(meetingId, user) {
        await this.ensureMeetingExists(meetingId);
        await this.meetingDisplayRepository.upsert(meetingId, {
            displayMode: 'MOTION',
        }, user.id);
        await this.auditService.log({
            actorUserId: user.id,
            action: 'meeting_display.show_motion',
            entityType: 'meeting',
            entityId: meetingId,
        });
        return this.getState(meetingId);
    }
    async showPresentation(meetingId, user) {
        await this.ensureMeetingExists(meetingId);
        const [resolvedAgenda, presentations, existing] = await Promise.all([
            this.resolveAgendaContext(meetingId),
            this.presentationsService.list(meetingId),
            this.meetingDisplayRepository.getByMeetingId(meetingId),
        ]);
        if (presentations.length === 0) {
            throw new common_1.BadRequestException('No presentations are available for this meeting display');
        }
        const state = await this.ensureValidState(meetingId, resolvedAgenda, presentations, existing, user.id);
        const currentPresentationId = state.currentPresentationId ?? presentations[0].id;
        await this.meetingDisplayRepository.upsert(meetingId, {
            displayMode: 'PRESENTATION',
            currentPresentationId,
            currentPresentationSlideIndex: state.currentPresentationSlideIndex ?? 0,
        }, user.id);
        await this.auditService.log({
            actorUserId: user.id,
            action: 'meeting_display.show_presentation',
            entityType: 'meeting',
            entityId: meetingId,
            changesJson: { presentationId: currentPresentationId },
        });
        return this.getState(meetingId);
    }
    async setPresentation(meetingId, presentationId, user) {
        await this.ensureMeetingExists(meetingId);
        const presentations = await this.presentationsService.list(meetingId);
        const target = presentations.find((presentation) => presentation.id === presentationId);
        if (!target) {
            throw new common_1.BadRequestException('Presentation is not available for this meeting display');
        }
        await this.meetingDisplayRepository.upsert(meetingId, {
            displayMode: 'PRESENTATION',
            currentPresentationId: presentationId,
            currentPresentationSlideIndex: 0,
        }, user.id);
        await this.auditService.log({
            actorUserId: user.id,
            action: 'meeting_display.set_presentation',
            entityType: 'meeting',
            entityId: meetingId,
            changesJson: { presentationId },
        });
        return this.getState(meetingId);
    }
    async setPresentationSlide(meetingId, slideNumber, user) {
        await this.ensureMeetingExists(meetingId);
        const [resolvedAgenda, presentations, existing] = await Promise.all([
            this.resolveAgendaContext(meetingId),
            this.presentationsService.list(meetingId),
            this.meetingDisplayRepository.getByMeetingId(meetingId),
        ]);
        const state = await this.ensureValidState(meetingId, resolvedAgenda, presentations, existing, user.id);
        const currentPresentation = this.findCurrentPresentation(state.currentPresentationId, presentations);
        if (!currentPresentation) {
            throw new common_1.BadRequestException('No presentation is currently selected for this meeting display');
        }
        const requestedSlideIndex = slideNumber - 1;
        const nextSlideIndex = this.normalizeSlideIndex(requestedSlideIndex, currentPresentation.pageCount);
        await this.meetingDisplayRepository.upsert(meetingId, {
            displayMode: 'PRESENTATION',
            currentPresentationId: currentPresentation.id,
            currentPresentationSlideIndex: nextSlideIndex,
        }, user.id);
        await this.auditService.log({
            actorUserId: user.id,
            action: 'meeting_display.set_presentation_slide',
            entityType: 'meeting',
            entityId: meetingId,
            changesJson: { presentationId: currentPresentation.id, slideNumber: nextSlideIndex + 1 },
        });
        return this.getState(meetingId);
    }
    async nextPresentationSlide(meetingId, user) {
        return this.stepPresentationSlide(meetingId, user, 'next');
    }
    async previousPresentationSlide(meetingId, user) {
        return this.stepPresentationSlide(meetingId, user, 'previous');
    }
    async getPublicPresentationContent(meetingId) {
        const state = await this.getState(meetingId);
        if (state.displayMode !== 'PRESENTATION' || !state.presentation.currentPresentation) {
            throw new common_1.BadRequestException('Presentation mode is not active for this meeting display');
        }
        const record = await this.presentationsService.getWithContentById(state.presentation.currentPresentation.id);
        return {
            buffer: Buffer.from(record.contentBase64, 'base64'),
            fileName: record.fileName,
            slideNumber: state.presentation.currentSlideNumber,
        };
    }
    streamPublicState(meetingId) {
        return (0, rxjs_1.interval)(1000).pipe((0, rxjs_1.startWith)(0), (0, rxjs_1.switchMap)(() => (0, rxjs_1.from)(this.getState(meetingId))), (0, rxjs_1.map)((state) => ({
            state,
            signature: JSON.stringify(state),
        })), (0, rxjs_1.distinctUntilChanged)((left, right) => left.signature === right.signature), (0, rxjs_1.map)(({ state }) => ({
            type: 'meeting-display-state',
            data: state,
        })));
    }
    async stepAgendaItem(meetingId, user, direction) {
        await this.ensureMeetingExists(meetingId);
        const [resolvedAgenda, presentations, existing] = await Promise.all([
            this.resolveAgendaContext(meetingId),
            this.presentationsService.list(meetingId),
            this.meetingDisplayRepository.getByMeetingId(meetingId),
        ]);
        if (resolvedAgenda.items.length === 0) {
            throw new common_1.BadRequestException('No agenda items are available for this meeting display');
        }
        const state = await this.ensureValidState(meetingId, resolvedAgenda, presentations, existing, user.id);
        const currentIndex = resolvedAgenda.items.findIndex((item) => item.id === state.currentAgendaItemId);
        const normalizedCurrentIndex = currentIndex < 0 ? 0 : currentIndex;
        const step = direction === 'next' ? 1 : -1;
        const nextIndex = (normalizedCurrentIndex + step + resolvedAgenda.items.length) %
            resolvedAgenda.items.length;
        const nextItem = resolvedAgenda.items[nextIndex];
        await this.meetingDisplayRepository.upsert(meetingId, {
            displayMode: 'AGENDA',
            currentAgendaItemId: nextItem.id,
        }, user.id);
        await this.auditService.log({
            actorUserId: user.id,
            action: direction === 'next' ? 'meeting_display.next' : 'meeting_display.previous',
            entityType: 'meeting',
            entityId: meetingId,
            changesJson: { agendaItemId: nextItem.id },
        });
        return this.getState(meetingId);
    }
    async stepPresentationSlide(meetingId, user, direction) {
        await this.ensureMeetingExists(meetingId);
        const [resolvedAgenda, presentations, existing] = await Promise.all([
            this.resolveAgendaContext(meetingId),
            this.presentationsService.list(meetingId),
            this.meetingDisplayRepository.getByMeetingId(meetingId),
        ]);
        if (presentations.length === 0) {
            throw new common_1.BadRequestException('No presentations are available for this meeting display');
        }
        const state = await this.ensureValidState(meetingId, resolvedAgenda, presentations, existing, user.id);
        const currentPresentation = this.findCurrentPresentation(state.currentPresentationId, presentations);
        if (!currentPresentation) {
            throw new common_1.BadRequestException('No presentation is currently selected for this meeting display');
        }
        const currentSlideIndex = this.normalizeSlideIndex(state.currentPresentationSlideIndex ?? 0, currentPresentation.pageCount);
        const step = direction === 'next' ? 1 : -1;
        const nextSlideIndex = (currentSlideIndex + step + currentPresentation.pageCount) %
            currentPresentation.pageCount;
        await this.meetingDisplayRepository.upsert(meetingId, {
            displayMode: 'PRESENTATION',
            currentPresentationId: currentPresentation.id,
            currentPresentationSlideIndex: nextSlideIndex,
        }, user.id);
        await this.auditService.log({
            actorUserId: user.id,
            action: direction === 'next' ? 'meeting_display.presentation_next' : 'meeting_display.presentation_previous',
            entityType: 'meeting',
            entityId: meetingId,
            changesJson: { presentationId: currentPresentation.id, slideNumber: nextSlideIndex + 1 },
        });
        return this.getState(meetingId);
    }
    async ensureMeetingExists(meetingId) {
        const exists = await this.meetingsService.exists(meetingId);
        if (!exists) {
            throw new common_1.BadRequestException('Meeting does not exist for this display');
        }
    }
    async resolveAgendaContext(meetingId) {
        const agendas = await this.agendasService.list(meetingId);
        if (agendas.length === 0) {
            return { agenda: null, items: [] };
        }
        const publishedAgendas = agendas.filter((agenda) => agenda.status === 'PUBLISHED');
        const preferredAgenda = (publishedAgendas.length > 0 ? publishedAgendas : agendas)
            .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())[0] ?? null;
        if (!preferredAgenda) {
            return { agenda: null, items: [] };
        }
        return {
            agenda: preferredAgenda,
            items: [...preferredAgenda.items]
                .filter((item) => !item.isInCamera && item.itemType !== 'MOTION')
                .sort((left, right) => left.sortOrder - right.sortOrder),
        };
    }
    async ensureValidState(meetingId, resolvedAgenda, presentations, state, actorUserId) {
        const defaultAgendaItemId = resolvedAgenda.items[0]?.id;
        const hasValidCurrentItem = Boolean(state?.currentAgendaItemId) &&
            resolvedAgenda.items.some((item) => item.id === state?.currentAgendaItemId);
        const hasValidCurrentPresentation = Boolean(state?.currentPresentationId) &&
            presentations.some((presentation) => presentation.id === state?.currentPresentationId);
        const activePresentation = presentations.find((presentation) => presentation.id === state?.currentPresentationId);
        const normalizedPresentationSlide = activePresentation
            ? this.normalizeSlideIndex(state?.currentPresentationSlideIndex ?? 0, activePresentation.pageCount)
            : undefined;
        const needsInit = !state;
        const needsAgendaPointerRepair = resolvedAgenda.items.length > 0 && !hasValidCurrentItem;
        const needsAgendaPointerClear = resolvedAgenda.items.length === 0 && Boolean(state?.currentAgendaItemId);
        const needsPresentationPointerRepair = presentations.length > 0 && !hasValidCurrentPresentation;
        const needsPresentationPointerClear = presentations.length === 0 && Boolean(state?.currentPresentationId);
        const needsSlideNormalization = Boolean(activePresentation) && normalizedPresentationSlide !== state?.currentPresentationSlideIndex;
        if (!needsInit &&
            !needsAgendaPointerRepair &&
            !needsAgendaPointerClear &&
            !needsPresentationPointerRepair &&
            !needsPresentationPointerClear &&
            !needsSlideNormalization) {
            return state;
        }
        const defaultPresentationId = presentations[0]?.id;
        return this.meetingDisplayRepository.upsert(meetingId, {
            displayMode: state?.displayMode ?? 'AGENDA',
            currentAgendaItemId: needsAgendaPointerClear
                ? null
                : hasValidCurrentItem
                    ? state?.currentAgendaItemId
                    : defaultAgendaItemId,
            currentPresentationId: needsPresentationPointerClear
                ? null
                : hasValidCurrentPresentation
                    ? state?.currentPresentationId
                    : defaultPresentationId,
            currentPresentationSlideIndex: needsPresentationPointerClear
                ? null
                : hasValidCurrentPresentation
                    ? normalizedPresentationSlide ?? 0
                    : 0,
        }, actorUserId);
    }
    findCurrentAgendaItem(currentAgendaItemId, items) {
        if (items.length === 0) {
            return null;
        }
        if (!currentAgendaItemId) {
            return items[0];
        }
        return items.find((item) => item.id === currentAgendaItemId) ?? items[0];
    }
    findCurrentPresentation(currentPresentationId, items) {
        if (items.length === 0) {
            return null;
        }
        if (!currentPresentationId) {
            return items[0];
        }
        return items.find((item) => item.id === currentPresentationId) ?? items[0];
    }
    normalizeSlideIndex(index, pageCount) {
        if (pageCount <= 0) {
            return 0;
        }
        if (index < 0) {
            return 0;
        }
        if (index >= pageCount) {
            return pageCount - 1;
        }
        return index;
    }
};
exports.MeetingDisplayService = MeetingDisplayService;
exports.MeetingDisplayService = MeetingDisplayService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [meetings_service_1.MeetingsService,
        agendas_service_1.AgendasService,
        motions_service_1.MotionsService,
        presentations_service_1.PresentationsService,
        meeting_display_repository_1.MeetingDisplayRepository,
        audit_service_1.AuditService])
], MeetingDisplayService);
//# sourceMappingURL=meeting-display.service.js.map