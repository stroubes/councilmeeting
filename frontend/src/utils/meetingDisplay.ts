import type { MeetingRecord } from '../api/types/meeting.types';

type MeetingDisplayFields = Pick<MeetingRecord, 'id' | 'title' | 'startsAt'>;

function formatMeetingStartDateTime(startsAt: string): string {
  const startsAtDate = new Date(startsAt);
  if (Number.isNaN(startsAtDate.getTime())) {
    return 'Date TBD';
  }

  return startsAtDate.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function toShortMeetingId(meetingId: string): string {
  return meetingId.slice(0, 8);
}

export function formatMeetingSelectionLabel(meeting: MeetingDisplayFields): string {
  return `${meeting.title} - ${formatMeetingStartDateTime(meeting.startsAt)} [${toShortMeetingId(meeting.id)}]`;
}

export function formatMeetingTableLabel(meeting: MeetingDisplayFields): string {
  return `${meeting.title} (${formatMeetingStartDateTime(meeting.startsAt)})`;
}
