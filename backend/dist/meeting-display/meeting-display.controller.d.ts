import { type MessageEvent } from '@nestjs/common';
import type { Observable } from 'rxjs';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { SetLiveAgendaItemDto } from './dto/set-live-agenda-item.dto';
import { SetLivePresentationDto } from './dto/set-live-presentation.dto';
import { SetPresentationSlideDto } from './dto/set-presentation-slide.dto';
import { MeetingDisplayService } from './meeting-display.service';
export declare class MeetingDisplayController {
    private readonly meetingDisplayService;
    constructor(meetingDisplayService: MeetingDisplayService);
    health(): {
        status: string;
    };
    getState(meetingId: string): Promise<import("./meeting-display.service").MeetingDisplayStateResponse>;
    getPublicState(meetingId: string): Promise<import("./meeting-display.service").MeetingDisplayStateResponse>;
    streamPublicState(meetingId: string): Observable<MessageEvent>;
    getPublicPresentationContent(meetingId: string, response: {
        setHeader: (name: string, value: string) => void;
        send: (body: Buffer) => void;
    }): Promise<void>;
    setAgendaItem(meetingId: string, dto: SetLiveAgendaItemDto, user: AuthenticatedUser): Promise<import("./meeting-display.service").MeetingDisplayStateResponse>;
    nextAgendaItem(meetingId: string, user: AuthenticatedUser): Promise<import("./meeting-display.service").MeetingDisplayStateResponse>;
    previousAgendaItem(meetingId: string, user: AuthenticatedUser): Promise<import("./meeting-display.service").MeetingDisplayStateResponse>;
    showAgenda(meetingId: string, user: AuthenticatedUser): Promise<import("./meeting-display.service").MeetingDisplayStateResponse>;
    showMotion(meetingId: string, user: AuthenticatedUser): Promise<import("./meeting-display.service").MeetingDisplayStateResponse>;
    setPresentation(meetingId: string, dto: SetLivePresentationDto, user: AuthenticatedUser): Promise<import("./meeting-display.service").MeetingDisplayStateResponse>;
    nextPresentationSlide(meetingId: string, user: AuthenticatedUser): Promise<import("./meeting-display.service").MeetingDisplayStateResponse>;
    previousPresentationSlide(meetingId: string, user: AuthenticatedUser): Promise<import("./meeting-display.service").MeetingDisplayStateResponse>;
    setPresentationSlide(meetingId: string, dto: SetPresentationSlideDto, user: AuthenticatedUser): Promise<import("./meeting-display.service").MeetingDisplayStateResponse>;
    showPresentation(meetingId: string, user: AuthenticatedUser): Promise<import("./meeting-display.service").MeetingDisplayStateResponse>;
}
