import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { createMeeting, deleteMeeting, listMeetings, listMeetingsPaged, updateMeeting } from '../../api/meetings.api';
import { listMeetingTypes } from '../../api/meetingTypes.api';
import type { MeetingTypeRecord } from '../../api/types/meeting-type.types';
import type { MeetingRecord } from '../../api/types/meeting.types';
import AppShell from '../../components/layout/AppShell';
import Drawer from '../../components/ui/Drawer';
import MeetingTypeBadge from '../../components/ui/MeetingTypeBadge';
import StatusBadge from '../../components/ui/StatusBadge';
import { usePersistentState } from '../../hooks/usePersistentState';
import { useToast } from '../../hooks/useToast';
import MetricTile from '../../components/ui/MetricTile';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import Pagination from '../../components/ui/Pagination';

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function toDateTimeInputValue(value: string): string {
  const date = new Date(value);
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function parsePage(value: string | null): number | null {
  if (!value) {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) || parsed < 1 ? null : parsed;
}

type RecurrencePattern = 'NONE' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
type EditScope = 'THIS' | 'THIS_AND_FUTURE';
type CalendarLayout = 'month' | 'week';
type MeetingStatusFilter = 'ALL' | MeetingRecord['status'];

const RECURRENCE_PATTERN_LABELS: Record<RecurrencePattern, string> = {
  NONE: 'Does not repeat',
  WEEKLY: 'Weekly',
  BIWEEKLY: 'Every 2 weeks',
  MONTHLY: 'Monthly',
};

function toLocalDateKey(value: string | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addRecurrence(date: Date, pattern: RecurrencePattern, step: number): Date {
  const next = new Date(date);
  if (pattern === 'WEEKLY') {
    next.setDate(next.getDate() + 7 * step);
    return next;
  }
  if (pattern === 'BIWEEKLY') {
    next.setDate(next.getDate() + 14 * step);
    return next;
  }
  if (pattern === 'MONTHLY') {
    next.setMonth(next.getMonth() + step);
    return next;
  }
  return next;
}

function getStartOfWeek(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return start;
}

function toMinuteOfDay(value: string): number {
  const date = new Date(value);
  return date.getHours() * 60 + date.getMinutes();
}

function inferRecurrencePattern(sortedSeries: MeetingRecord[]): RecurrencePattern {
  if (sortedSeries.length < 2) {
    return 'NONE';
  }

  const first = new Date(sortedSeries[0].startsAt);
  const second = new Date(sortedSeries[1].startsAt);
  const diffMs = second.getTime() - first.getTime();
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays === 7) {
    return 'WEEKLY';
  }
  if (diffDays === 14) {
    return 'BIWEEKLY';
  }

  if (
    first.getDate() === second.getDate() &&
    (second.getMonth() !== first.getMonth() || second.getFullYear() !== first.getFullYear())
  ) {
    return 'MONTHLY';
  }

  return 'NONE';
}

function validateMeetingForm(form: {
  title: string;
  meetingTypeCode: string;
  startsAt: string;
}): string | null {
  if (form.title.trim().length < 5) {
    return 'Title must be at least 5 characters.';
  }

  if (!form.meetingTypeCode.trim()) {
    return 'Meeting type is required.';
  }

  if (!form.startsAt) {
    return 'Start time is required.';
  }

  const startsAt = new Date(form.startsAt);
  if (Number.isNaN(startsAt.getTime())) {
    return 'Start time is invalid.';
  }

  return null;
}

type SortField = 'title' | 'startsAt' | 'status';

export default function MeetingsList(): JSX.Element {
  const [meetings, setMeetings] = useState<MeetingRecord[]>([]);
  const [meetingTypes, setMeetingTypes] = useState<MeetingTypeRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isListLoading, setIsListLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = usePersistentState('meetings.query', '');
  const [statusFilter, setStatusFilter] = usePersistentState<MeetingStatusFilter>('meetings.statusFilter', 'ALL');
  const [sortField, setSortField] = usePersistentState<SortField>('meetings.sortField', 'startsAt');
  const [sortDirection, setSortDirection] = usePersistentState<'asc' | 'desc'>('meetings.sortDirection', 'asc');
  const [viewMode, setViewMode] = usePersistentState<'list' | 'calendar'>('meetings.viewMode', 'list');
  const [calendarLayout, setCalendarLayout] = usePersistentState<CalendarLayout>('meetings.calendarLayout', 'month');
  const [page, setPage] = usePersistentState('meetings.page', 1);
  const [listMeetingsPage, setListMeetingsPage] = useState<MeetingRecord[]>([]);
  const [listTotalMeetings, setListTotalMeetings] = useState(0);
  const [listTotalPages, setListTotalPages] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<MeetingRecord | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [calendarWeekStart, setCalendarWeekStart] = useState(() => getStartOfWeek(new Date()));
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToast } = useToast();

  const [createForm, setCreateForm] = useState({
    title: '',
    meetingTypeCode: '',
    startsAt: '',
    location: '',
    isPublic: true,
    recurrencePattern: 'NONE' as RecurrencePattern,
    recurrenceCount: 2,
  });

  const [editForm, setEditForm] = useState({
    title: '',
    meetingTypeCode: '',
    startsAt: '',
    location: '',
    isPublic: true,
  });
  const [editRecurrencePattern, setEditRecurrencePattern] = useState<RecurrencePattern>('NONE');
  const [editRecurrenceCount, setEditRecurrenceCount] = useState(2);
  const [editScope, setEditScope] = useState<EditScope>('THIS');

  const loadAllMeetings = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await listMeetings();
      setMeetings(response);
    } catch {
      setError('Could not load meetings.');
      addToast('Could not load meetings.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMeetingsPage = async (): Promise<void> => {
    setIsListLoading(true);
    setError(null);
    try {
      const response = await listMeetingsPaged({
        q: query,
        status: statusFilter,
        sortField,
        sortDirection,
        page,
        pageSize: 8,
      });
      setListMeetingsPage(response.items);
      setListTotalMeetings(response.total);
      setListTotalPages(response.totalPages);
      if (response.page !== page) {
        setPage(response.page);
      }
    } catch {
      setError('Could not load meetings.');
      addToast('Could not load meetings.', 'error');
    } finally {
      setIsListLoading(false);
    }
  };

  const loadMeetingTypes = async (): Promise<void> => {
    try {
      const response = await listMeetingTypes();
      setMeetingTypes(response);
      setCreateForm((current) => ({
        ...current,
        meetingTypeCode: current.meetingTypeCode || response[0]?.code || '',
      }));
    } catch {
      setError('Could not load meeting types.');
      addToast('Could not load meeting types.', 'error');
    }
  };

  useEffect(() => {
    void Promise.all([loadAllMeetings(), loadMeetingTypes(), loadMeetingsPage()]);
  }, []);

  useEffect(() => {
    void loadMeetingsPage();
  }, [query, statusFilter, sortField, sortDirection, page]);

  useEffect(() => {
    if (searchParams.get('quick') === 'new-meeting') {
      setIsCreateOpen(true);
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete('quick');
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const queryParam = searchParams.get('q');
    const statusParam = searchParams.get('status');
    const sortFieldParam = searchParams.get('sortField') as SortField | null;
    const sortDirectionParam = searchParams.get('sortDirection') as 'asc' | 'desc' | null;
    const pageParam = parsePage(searchParams.get('page'));

    if (queryParam !== null && queryParam !== query) {
      setQuery(queryParam);
    }

    if (statusParam && statusParam !== statusFilter) {
      setStatusFilter(statusParam as MeetingStatusFilter);
    }

    if (sortFieldParam && ['title', 'startsAt', 'status'].includes(sortFieldParam) && sortFieldParam !== sortField) {
      setSortField(sortFieldParam);
    }

    if (sortDirectionParam && ['asc', 'desc'].includes(sortDirectionParam) && sortDirectionParam !== sortDirection) {
      setSortDirection(sortDirectionParam);
    }

    if (pageParam && pageParam !== page) {
      setPage(pageParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('q', query);
    nextParams.set('status', statusFilter);
    nextParams.set('sortField', sortField);
    nextParams.set('sortDirection', sortDirection);
    nextParams.set('page', String(page));

    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true });
    }
  }, [query, statusFilter, sortField, sortDirection, page]);

  const filteredCalendarMeetings = useMemo(() => {
    const baseFiltered = meetings
      .filter((meeting) => {
        const matchesQuery =
          meeting.title.toLowerCase().includes(query.toLowerCase()) ||
          meeting.meetingTypeCode.toLowerCase().includes(query.toLowerCase());
        const matchesStatus = statusFilter === 'ALL' || meeting.status === statusFilter;
        return matchesQuery && matchesStatus;
      })
      .sort((left, right) => {
        let comparison = 0;
        if (sortField === 'title') {
          comparison = left.title.localeCompare(right.title);
        } else if (sortField === 'status') {
          comparison = left.status.localeCompare(right.status);
        } else {
          comparison = new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime();
        }

        return sortDirection === 'asc' ? comparison : -comparison;
      });

    return baseFiltered;
  }, [meetings, query, statusFilter, sortField, sortDirection]);

  const pageSize = 8;
  const currentPage = Math.min(page, listTotalPages);
  const calendarWeeks = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const totalDays = new Date(year, month + 1, 0).getDate();
    const leadingBlanks = firstDay.getDay();
    const cells: Array<Date | null> = [];

    for (let index = 0; index < leadingBlanks; index += 1) {
      cells.push(null);
    }
    for (let day = 1; day <= totalDays; day += 1) {
      cells.push(new Date(year, month, day));
    }
    while (cells.length % 7 !== 0) {
      cells.push(null);
    }

    const weeks: Array<Array<Date | null>> = [];
    for (let index = 0; index < cells.length; index += 7) {
      weeks.push(cells.slice(index, index + 7));
    }
    return weeks;
  }, [calendarMonth]);
  const meetingsByDate = useMemo(() => {
    const map = new Map<string, MeetingRecord[]>();
    for (const meeting of filteredCalendarMeetings) {
      const key = toLocalDateKey(meeting.startsAt);
      const bucket = map.get(key) ?? [];
      bucket.push(meeting);
      map.set(key, bucket);
    }
    return map;
  }, [filteredCalendarMeetings]);
  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const day = new Date(calendarWeekStart);
        day.setDate(calendarWeekStart.getDate() + index);
        return day;
      }),
    [calendarWeekStart],
  );
  const weekMeetingsByDate = useMemo(() => {
    const map = new Map<string, MeetingRecord[]>();
    for (const day of weekDays) {
      const key = toLocalDateKey(day);
      const dayMeetings = filteredCalendarMeetings
        .filter((meeting) => toLocalDateKey(meeting.startsAt) === key)
        .sort((left, right) => left.startsAt.localeCompare(right.startsAt));
      map.set(key, dayMeetings);
    }
    return map;
  }, [weekDays, filteredCalendarMeetings]);
  const weekTimeSlots = useMemo(() => {
    return Array.from({ length: 16 }, (_, index) => {
      const hour = 7 + index;
      return {
        label: new Date(2000, 0, 1, hour).toLocaleTimeString(undefined, { hour: 'numeric' }),
        startMinute: hour * 60,
        endMinute: (hour + 1) * 60,
      };
    });
  }, []);

  const inProgressCount = meetings.filter((meeting) => meeting.status === 'IN_PROGRESS').length;
  const publicCount = meetings.filter((meeting) => meeting.isPublic).length;
  const createMeetingValidationError = validateMeetingForm(createForm);
  const editMeetingValidationError = validateMeetingForm(editForm);
  const meetingTypeNameByCode = useMemo(
    () => new Map(meetingTypes.map((meetingType) => [meetingType.code, meetingType.name])),
    [meetingTypes],
  );
  const recurrenceSeriesCountByGroup = useMemo(() => {
    const map = new Map<string, number>();
    for (const meeting of meetings) {
      if (!meeting.recurrenceGroupId) {
        continue;
      }
      map.set(meeting.recurrenceGroupId, (map.get(meeting.recurrenceGroupId) ?? 0) + 1);
    }
    return map;
  }, [meetings]);

  const openEditDrawer = (meeting: MeetingRecord): void => {
    const series = meeting.recurrenceGroupId
      ? meetings
          .filter((candidate) => candidate.recurrenceGroupId === meeting.recurrenceGroupId)
          .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime())
      : [meeting];
    const futureCount = series.filter(
      (candidate) => new Date(candidate.startsAt).getTime() >= new Date(meeting.startsAt).getTime(),
    ).length;

    setEditingMeeting(meeting);
    setEditForm({
      title: meeting.title,
      meetingTypeCode: meeting.meetingTypeCode,
      startsAt: toDateTimeInputValue(meeting.startsAt),
      location: meeting.location ?? '',
      isPublic: meeting.isPublic,
    });
    setEditRecurrencePattern(inferRecurrencePattern(series));
    setEditRecurrenceCount(Math.max(2, futureCount || 2));
    setEditScope('THIS');
  };

  const handleCreateSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    let createdCount = 0;

    try {
      const baseStart = new Date(createForm.startsAt);
      const totalOccurrences = createForm.recurrencePattern === 'NONE' ? 1 : createForm.recurrenceCount;
      const recurrenceGroupId = createForm.recurrencePattern === 'NONE' ? undefined : crypto.randomUUID();
      for (let index = 0; index < totalOccurrences; index += 1) {
        const startsAt = addRecurrence(baseStart, createForm.recurrencePattern, index);
        await createMeeting({
          title: createForm.title,
          meetingTypeCode: createForm.meetingTypeCode,
          startsAt: startsAt.toISOString(),
          location: createForm.location || undefined,
          isPublic: createForm.isPublic,
          recurrenceGroupId,
          recurrenceIndex: recurrenceGroupId ? index + 1 : undefined,
        });
        createdCount += 1;
      }

      setIsCreateOpen(false);
      setCreateForm({
        title: '',
        meetingTypeCode: meetingTypes[0]?.code ?? '',
        startsAt: '',
        location: '',
        isPublic: true,
        recurrencePattern: 'NONE',
        recurrenceCount: 2,
      });
      await Promise.all([loadAllMeetings(), loadMeetingsPage()]);
      addToast(
        createdCount === 1 ? 'Meeting created successfully.' : `${createdCount} recurring meetings created successfully.`,
        'success',
      );
    } catch {
      if (createdCount > 0) {
        addToast(`${createdCount} meetings were created before an error occurred.`, 'error');
      }
      setError('Could not create meeting.');
      addToast('Could not create meeting.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!editingMeeting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const normalizedPatch = {
        title: editForm.title,
        meetingTypeCode: editForm.meetingTypeCode,
        startsAt: new Date(editForm.startsAt).toISOString(),
        location: editForm.location || undefined,
        isPublic: editForm.isPublic,
      };

      if (editScope === 'THIS') {
        await updateMeeting(editingMeeting.id, normalizedPatch);
      } else {
        const baseStart = new Date(editForm.startsAt);
        const recurrenceGroupId = editingMeeting.recurrenceGroupId ?? crypto.randomUUID();
        const series = meetings
          .filter(
            (meeting) =>
              meeting.recurrenceGroupId === recurrenceGroupId &&
              new Date(meeting.startsAt).getTime() >= new Date(editingMeeting.startsAt).getTime(),
          )
          .sort((left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime());

        const totalOccurrences = Math.max(1, editRecurrencePattern === 'NONE' ? 1 : editRecurrenceCount);
        for (let index = 0; index < totalOccurrences; index += 1) {
          const startsAt = addRecurrence(baseStart, editRecurrencePattern, index).toISOString();
          const target = series[index] ?? (index === 0 ? editingMeeting : null);

          if (target) {
            await updateMeeting(target.id, {
              ...normalizedPatch,
              startsAt,
              recurrenceGroupId,
              recurrenceIndex: index + 1,
            });
          } else {
            await createMeeting({
              title: normalizedPatch.title,
              meetingTypeCode: normalizedPatch.meetingTypeCode,
              startsAt,
              location: normalizedPatch.location,
              isPublic: normalizedPatch.isPublic,
              recurrenceGroupId,
              recurrenceIndex: index + 1,
            });
          }
        }
      }

      setEditingMeeting(null);
      await Promise.all([loadAllMeetings(), loadMeetingsPage()]);
      addToast(editScope === 'THIS' ? 'Meeting updated successfully.' : 'Meeting series updated successfully.', 'success');
    } catch {
      setError('Could not update meeting.');
      addToast('Could not update meeting.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMeeting = async (meeting: MeetingRecord): Promise<void> => {
    if (!window.confirm(`Delete meeting \"${meeting.title}\"?`)) {
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await deleteMeeting(meeting.id);
      await Promise.all([loadAllMeetings(), loadMeetingsPage()]);
      addToast('Meeting deleted.', 'success');
    } catch {
      setError('Could not delete meeting.');
      addToast('Could not delete meeting.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell
      title="Meetings"
      subtitle="Scheduled and active meetings across the current governance cycle."
      actions={
        <button type="button" className="btn btn-primary" onClick={() => setIsCreateOpen(true)}>
          New Meeting
        </button>
      }
    >
      <section className="module-overview">
        <MetricTile
          variant="primary"
          label="Total Meetings"
          value={meetings.length}
          foot="Current governance cycle"
          icon="calendar"
        />
        <MetricTile
          label="In Progress"
          value={inProgressCount}
          foot="Sessions currently underway"
          icon="clock"
        />
        <MetricTile
          label="Public Sessions"
          value={publicCount}
          foot="Visible to community portal"
          icon="globe"
        />
      </section>

      <Card>
        <CardHeader
          title="Meeting Register"
          description="Operational view of timing, location, privacy setting, and publication status."
          actions={
            <>
              <span className="pill">{viewMode === 'list' ? listTotalMeetings : filteredCalendarMeetings.length} visible</span>
              {viewMode === 'list' ? <span className="pill">Page {currentPage}</span> : null}
            </>
          }
        />
        <CardBody>
          <div className="workspace-toolbar">
            <div className="workspace-toolbar-row">
              <input
                className="field"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search meeting title or type"
                aria-label="Search meetings"
              />
              <select
                className="field"
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(event.target.value as MeetingStatusFilter);
                  setPage(1);
                }}
                aria-label="Filter by meeting status"
              >
                <option value="ALL">All statuses</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="ADJOURNED">Adjourned</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
              <div className="page-actions">
                <button
                  type="button"
                  className={`btn ${viewMode === 'list' ? 'btn-primary' : 'btn-quiet'}`}
                  onClick={() => setViewMode('list')}
                >
                  List View
                </button>
                <button
                  type="button"
                  className={`btn ${viewMode === 'calendar' ? 'btn-primary' : 'btn-quiet'}`}
                  onClick={() => setViewMode('calendar')}
                >
                  Calendar View
                </button>
              </div>
            </div>

            {viewMode === 'list' ? (
              <div className="workspace-toolbar-row workspace-toolbar-row-compact">
                <select
                  className="field"
                  value={sortField}
                  onChange={(event) => setSortField(event.target.value as SortField)}
                  aria-label="Sort meetings by"
                >
                  <option value="startsAt">Sort by start time</option>
                  <option value="title">Sort by title</option>
                  <option value="status">Sort by status</option>
                </select>
                <select
                  className="field"
                  value={sortDirection}
                  onChange={(event) => setSortDirection(event.target.value as 'asc' | 'desc')}
                  aria-label="Sort direction"
                >
                  <option value="asc">Ascending</option>
                  <option value="desc">Descending</option>
                </select>
              </div>
            ) : (
              <div className="meeting-calendar-toolbar">
                <div className="meeting-calendar-toolbar-left">
                  <button
                    type="button"
                    className={`btn ${calendarLayout === 'month' ? 'btn-primary' : 'btn-quiet'}`}
                    onClick={() => setCalendarLayout('month')}
                  >
                    Month Grid
                  </button>
                  <button
                    type="button"
                    className={`btn ${calendarLayout === 'week' ? 'btn-primary' : 'btn-quiet'}`}
                    onClick={() => setCalendarLayout('week')}
                  >
                    Week Grid
                  </button>
                </div>
                <div className="meeting-calendar-toolbar-center">
                  <p className="meeting-calendar-kicker">Calendar Range</p>
                  <h3 className="meeting-calendar-title">
                    {calendarLayout === 'month'
                      ? calendarMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
                      : `${weekDays[0]?.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${weekDays[6]?.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`}
                  </h3>
                </div>
                <div className="meeting-calendar-toolbar-right">
                  <button
                    type="button"
                    className="btn btn-quiet"
                    onClick={() => {
                      if (calendarLayout === 'month') {
                        setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
                      } else {
                        setCalendarWeekStart((current) => {
                          const next = new Date(current);
                          next.setDate(current.getDate() - 7);
                          return next;
                        });
                      }
                    }}
                  >
                    {calendarLayout === 'month' ? 'Previous Month' : 'Previous Week'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-quiet"
                    onClick={() => {
                      if (calendarLayout === 'month') {
                        const now = new Date();
                        setCalendarMonth(new Date(now.getFullYear(), now.getMonth(), 1));
                      } else {
                        setCalendarWeekStart(getStartOfWeek(new Date()));
                      }
                    }}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    className="btn btn-quiet"
                    onClick={() => {
                      if (calendarLayout === 'month') {
                        setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));
                      } else {
                        setCalendarWeekStart((current) => {
                          const next = new Date(current);
                          next.setDate(current.getDate() + 7);
                          return next;
                        });
                      }
                    }}
                  >
                    {calendarLayout === 'month' ? 'Next Month' : 'Next Week'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {isLoading || (viewMode === 'list' && isListLoading) ? <p className="muted">Loading meetings...</p> : null}
          {error ? <p className="inline-alert">{error}</p> : null}
          {!isLoading && viewMode === 'calendar' && filteredCalendarMeetings.length === 0 ? (
            <div className="empty-state">No meetings match the current filters.</div>
          ) : null}
          {!isLoading && !isListLoading && viewMode === 'list' && listMeetingsPage.length === 0 ? (
            <div className="empty-state">No meetings match the current filters.</div>
          ) : null}
          {viewMode === 'list' && listMeetingsPage.length > 0 ? (
            <DataTable
              columns={[
                {
                  key: 'title',
                  header: 'Meeting',
                  render: (meeting: MeetingRecord) => (
                    <>
                      <Link to={`/meetings/${meeting.id}`}>
                        <strong>{meeting.title}</strong>
                      </Link>
                      <MeetingTypeBadge code={meeting.meetingTypeCode} name={meetingTypeNameByCode.get(meeting.meetingTypeCode)} />
                      {meeting.recurrenceGroupId ? (
                        <div className="muted">
                          Recurring series
                          {meeting.recurrenceIndex ? ` #${meeting.recurrenceIndex}` : ''}
                          {recurrenceSeriesCountByGroup.get(meeting.recurrenceGroupId)
                            ? ` of ${recurrenceSeriesCountByGroup.get(meeting.recurrenceGroupId)}`
                            : ''}
                        </div>
                      ) : null}
                    </>
                  ),
                },
                {
                  key: 'status',
                  header: 'Status',
                  render: (meeting: MeetingRecord) => <StatusBadge status={meeting.status} />,
                },
                {
                  key: 'startsAt',
                  header: 'Start',
                  render: (meeting: MeetingRecord) => formatDateTime(meeting.startsAt),
                },
                {
                  key: 'location',
                  header: 'Location',
                  render: (meeting: MeetingRecord) => meeting.location ?? 'Not specified',
                },
                {
                  key: 'isPublic',
                  header: 'Visibility',
                  render: (meeting: MeetingRecord) => (meeting.isPublic ? 'Public' : 'Internal'),
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (meeting: MeetingRecord) => (
                    <div className="page-actions">
                      <Link className="btn btn-quiet" to={`/meetings/${meeting.id}`}>
                        Details
                      </Link>
                      <button type="button" className="btn btn-quiet" onClick={() => openEditDrawer(meeting)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        disabled={isSubmitting}
                        onClick={() => void handleDeleteMeeting(meeting)}
                      >
                        Delete
                      </button>
                    </div>
                  ),
                },
              ]}
              data={listMeetingsPage}
              rowKey={(meeting: MeetingRecord) => meeting.id}
              emptyMessage="No meetings match the current filters."
            />
          ) : null}
          {viewMode === 'calendar' && calendarLayout === 'month' ? (
            <div className="table-wrap">
              <table className="data-table meetings-calendar-table" aria-label="Meetings calendar view">
                <thead>
                  <tr>
                    <th>Sun</th>
                    <th>Mon</th>
                    <th>Tue</th>
                    <th>Wed</th>
                    <th>Thu</th>
                    <th>Fri</th>
                    <th>Sat</th>
                  </tr>
                </thead>
                <tbody>
                  {calendarWeeks.map((week, weekIndex) => (
                    <tr key={`week-${weekIndex}`}>
                      {week.map((cellDate, dayIndex) => {
                        if (!cellDate) {
                          return <td key={`empty-${weekIndex}-${dayIndex}`} className="muted" />;
                        }
                        const key = toLocalDateKey(cellDate);
                        const dayMeetings = meetingsByDate.get(key) ?? [];
                        return (
                          <td key={key} className="meetings-calendar-day-cell">
                            <div className="meetings-calendar-day-number">{cellDate.getDate()}</div>
                            {dayMeetings.length > 0 ? (
                              <div className="meetings-calendar-day-list">
                                {dayMeetings
                                  .sort((left, right) => left.startsAt.localeCompare(right.startsAt))
                                  .map((meeting) => (
                                    <div key={meeting.id} className="meetings-calendar-item">
                                      <Link to={`/meetings/${meeting.id}`}>{meeting.title}</Link>
                                      <div className="muted">{formatDateTime(meeting.startsAt)}</div>
                                      {meeting.recurrenceGroupId ? <div className="muted">Recurring</div> : null}
                                    </div>
                                  ))}
                              </div>
                            ) : (
                              <div className="muted meetings-calendar-empty">
                                No meetings
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          {viewMode === 'calendar' && calendarLayout === 'week' ? (
            <div className="table-wrap">
              <table className="data-table meetings-week-table" aria-label="Meetings week view">
                <thead>
                  <tr>
                    <th>Time</th>
                    {weekDays.map((day) => (
                      <th key={toLocalDateKey(day)}>
                        {day.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {weekTimeSlots.map((slot) => (
                    <tr key={slot.label}>
                      <td>
                        <strong>{slot.label}</strong>
                      </td>
                      {weekDays.map((day) => {
                        const key = toLocalDateKey(day);
                        const dayMeetings = weekMeetingsByDate.get(key) ?? [];
                        const slotMeetings = dayMeetings.filter((meeting) => {
                          const minute = toMinuteOfDay(meeting.startsAt);
                          return minute >= slot.startMinute && minute < slot.endMinute;
                        });
                        return (
                          <td key={`${slot.label}-${key}`} style={{ verticalAlign: 'top', minWidth: '150px' }}>
                            {slotMeetings.length > 0 ? (
                              slotMeetings.map((meeting) => (
                                <div key={meeting.id} style={{ marginBottom: '0.35rem' }}>
                                  <Link to={`/meetings/${meeting.id}`}>{meeting.title}</Link>
                                  <div className="muted">{new Date(meeting.startsAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</div>
                                  {meeting.recurrenceGroupId ? <div className="muted">Recurring</div> : null}
                                </div>
                              ))
                            ) : (
                              <span className="muted">-</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          {viewMode === 'list' && listTotalMeetings > 0 ? (
            <div className="page-controls">
              <span className="muted">
                Showing {listTotalMeetings === 0 ? 0 : (currentPage - 1) * pageSize + 1}-
                {Math.min(currentPage * pageSize, listTotalMeetings)} of {listTotalMeetings}
              </span>
              <Pagination
                currentPage={currentPage}
                totalPages={listTotalPages}
                onPageChange={setPage}
              />
            </div>
          ) : null}
        </CardBody>
      </Card>

      <Drawer
        isOpen={isCreateOpen}
        title="Create Meeting"
        subtitle="Schedule a new council session in the meeting register."
        onClose={() => setIsCreateOpen(false)}
      >
        <form onSubmit={(event) => void handleCreateSubmit(event)}>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="create-meeting-title">Title</label>
              <input
                id="create-meeting-title"
                className="field"
                required
                value={createForm.title}
                onChange={(event) => setCreateForm((current) => ({ ...current, title: event.target.value }))}
              />
            </div>
            <div className="form-field">
              <label htmlFor="create-meeting-type">Meeting Type</label>
              <select
                id="create-meeting-type"
                className="field"
                required
                value={createForm.meetingTypeCode}
                onChange={(event) => setCreateForm((current) => ({ ...current, meetingTypeCode: event.target.value }))}
                disabled={meetingTypes.length === 0}
              >
                {meetingTypes.length === 0 ? <option value="">No meeting types available</option> : null}
                {meetingTypes.map((meetingType) => (
                  <option key={meetingType.id} value={meetingType.code}>
                    {meetingType.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="create-meeting-start">Start Time</label>
              <input
                id="create-meeting-start"
                className="field"
                type="datetime-local"
                required
                value={createForm.startsAt}
                onChange={(event) => setCreateForm((current) => ({ ...current, startsAt: event.target.value }))}
              />
            </div>
            <div className="form-field">
              <label htmlFor="create-meeting-location">Location</label>
              <input
                id="create-meeting-location"
                className="field"
                value={createForm.location}
                onChange={(event) => setCreateForm((current) => ({ ...current, location: event.target.value }))}
              />
            </div>
            <div className="form-field">
              <label htmlFor="create-meeting-visibility">Visibility</label>
              <select
                id="create-meeting-visibility"
                className="field"
                value={createForm.isPublic ? 'PUBLIC' : 'INTERNAL'}
                onChange={(event) =>
                  setCreateForm((current) => ({ ...current, isPublic: event.target.value === 'PUBLIC' }))
                }
              >
                <option value="PUBLIC">Public</option>
                <option value="INTERNAL">Internal</option>
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="create-meeting-recurrence">Recurrence</label>
              <select
                id="create-meeting-recurrence"
                className="field"
                value={createForm.recurrencePattern}
                onChange={(event) =>
                  setCreateForm((current) => ({
                    ...current,
                    recurrencePattern: event.target.value as RecurrencePattern,
                  }))
                }
              >
                <option value="NONE">Does not repeat</option>
                <option value="WEEKLY">Weekly</option>
                <option value="BIWEEKLY">Every 2 weeks</option>
                <option value="MONTHLY">Monthly</option>
              </select>
            </div>
            {createForm.recurrencePattern !== 'NONE' ? (
              <div className="form-field">
                <label htmlFor="create-meeting-recurrence-count">Occurrences</label>
                <input
                  id="create-meeting-recurrence-count"
                  className="field"
                  type="number"
                  min={2}
                  max={24}
                  value={createForm.recurrenceCount}
                  onChange={(event) =>
                    setCreateForm((current) => {
                      const next = Number.parseInt(event.target.value || '2', 10);
                      const safe = Number.isFinite(next) ? next : 2;
                      return {
                        ...current,
                        recurrenceCount: Math.max(2, Math.min(24, safe)),
                      };
                    })
                  }
                />
              </div>
            ) : null}
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-quiet" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || Boolean(createMeetingValidationError)}
            >
              {isSubmitting ? 'Saving...' : 'Create Meeting'}
            </button>
          </div>
          {createMeetingValidationError ? <p className="form-error">{createMeetingValidationError}</p> : null}
        </form>
      </Drawer>

      <Drawer
        isOpen={Boolean(editingMeeting)}
        title="Edit Meeting"
        subtitle="Update meeting metadata and schedule details."
        onClose={() => setEditingMeeting(null)}
      >
        <form onSubmit={(event) => void handleEditSubmit(event)}>
          <div className="form-grid">
            <div className="form-field">
              <label htmlFor="edit-meeting-title">Title</label>
              <input
                id="edit-meeting-title"
                className="field"
                required
                value={editForm.title}
                onChange={(event) => setEditForm((current) => ({ ...current, title: event.target.value }))}
              />
            </div>
            <div className="form-field">
              <label htmlFor="edit-meeting-type">Meeting Type</label>
              <select
                id="edit-meeting-type"
                className="field"
                required
                value={editForm.meetingTypeCode}
                onChange={(event) => setEditForm((current) => ({ ...current, meetingTypeCode: event.target.value }))}
                disabled={meetingTypes.length === 0}
              >
                {meetingTypes.length === 0 ? <option value="">No meeting types available</option> : null}
                {meetingTypes.map((meetingType) => (
                  <option key={meetingType.id} value={meetingType.code}>
                    {meetingType.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="edit-meeting-start">Start Time</label>
              <input
                id="edit-meeting-start"
                className="field"
                type="datetime-local"
                required
                value={editForm.startsAt}
                onChange={(event) => setEditForm((current) => ({ ...current, startsAt: event.target.value }))}
              />
            </div>
            <div className="form-field">
              <label htmlFor="edit-meeting-location">Location</label>
              <input
                id="edit-meeting-location"
                className="field"
                value={editForm.location}
                onChange={(event) => setEditForm((current) => ({ ...current, location: event.target.value }))}
              />
            </div>
            <div className="form-field">
              <label htmlFor="edit-meeting-visibility">Visibility</label>
              <select
                id="edit-meeting-visibility"
                className="field"
                value={editForm.isPublic ? 'PUBLIC' : 'INTERNAL'}
                onChange={(event) =>
                  setEditForm((current) => ({ ...current, isPublic: event.target.value === 'PUBLIC' }))
                }
              >
                <option value="PUBLIC">Public</option>
                <option value="INTERNAL">Internal</option>
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="edit-meeting-scope">Apply Changes</label>
              <select
                id="edit-meeting-scope"
                className="field"
                value={editScope}
                onChange={(event) => setEditScope(event.target.value as EditScope)}
              >
                <option value="THIS">This meeting only</option>
                <option value="THIS_AND_FUTURE">This and future meetings</option>
              </select>
            </div>
            {editScope === 'THIS_AND_FUTURE' ? (
              <>
                <div className="form-field">
                  <label htmlFor="edit-meeting-recurrence">Recurrence Pattern</label>
                  <select
                    id="edit-meeting-recurrence"
                    className="field"
                    value={editRecurrencePattern}
                    onChange={(event) => setEditRecurrencePattern(event.target.value as RecurrencePattern)}
                  >
                    <option value="WEEKLY">{RECURRENCE_PATTERN_LABELS.WEEKLY}</option>
                    <option value="BIWEEKLY">{RECURRENCE_PATTERN_LABELS.BIWEEKLY}</option>
                    <option value="MONTHLY">{RECURRENCE_PATTERN_LABELS.MONTHLY}</option>
                  </select>
                </div>
                <div className="form-field">
                  <label htmlFor="edit-meeting-occurrences">Occurrences to Update</label>
                  <input
                    id="edit-meeting-occurrences"
                    className="field"
                    type="number"
                    min={1}
                    max={24}
                    value={editRecurrenceCount}
                    onChange={(event) => {
                      const next = Number.parseInt(event.target.value || '1', 10);
                      const safe = Number.isFinite(next) ? next : 1;
                      setEditRecurrenceCount(Math.max(1, Math.min(24, safe)));
                    }}
                  />
                </div>
              </>
            ) : null}
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-quiet" onClick={() => setEditingMeeting(null)}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || Boolean(editMeetingValidationError)}
            >
              {isSubmitting ? 'Saving...' : editScope === 'THIS' ? 'Save Changes' : 'Update Series'}
            </button>
          </div>
          {editMeetingValidationError ? <p className="form-error">{editMeetingValidationError}</p> : null}
        </form>
      </Drawer>
    </AppShell>
  );
}
