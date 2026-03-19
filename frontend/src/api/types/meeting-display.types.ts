import type { AgendaItemRecord } from './agenda.types';
import type { MotionRecord } from './motion.types';
import type { PresentationRecord } from './presentation.types';

export type MeetingDisplayMode = 'AGENDA' | 'MOTION' | 'PRESENTATION';

export interface MeetingDisplayState {
  meetingId: string;
  displayMode: MeetingDisplayMode;
  agenda: {
    agendaId: string | null;
    currentItem: AgendaItemRecord | null;
    orderedItems: AgendaItemRecord[];
  };
  motion: {
    liveMotion: MotionRecord | null;
    recentOutcomeMotion: MotionRecord | null;
  };
  presentation: {
    currentPresentation: PresentationRecord | null;
    currentSlideIndex: number;
    currentSlideNumber: number;
    totalSlides: number;
    items: PresentationRecord[];
  };
  updatedAt: string;
}
