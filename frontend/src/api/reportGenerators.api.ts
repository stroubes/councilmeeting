import { httpGet } from './httpClient';
import type {
  AttendanceMeetingEntry,
  MotionReportEntry,
  VotingReportEntry,
  ConflictReportEntry,
  ForecastReportEntry,
} from './types/report-generator.types';

export function fetchAttendanceReport(params?: {
  startsAtFrom?: string;
  startsAtTo?: string;
  meetingId?: string;
}): Promise<AttendanceMeetingEntry[]> {
  const query = new URLSearchParams();
  if (params?.startsAtFrom) query.set('startsAtFrom', params.startsAtFrom);
  if (params?.startsAtTo) query.set('startsAtTo', params.startsAtTo);
  if (params?.meetingId) query.set('meetingId', params.meetingId);
  const queryString = query.toString();
  return httpGet<AttendanceMeetingEntry[]>(`/report-generators/attendance${queryString ? `?${queryString}` : ''}`);
}

export function fetchMotionReport(params?: {
  startsAtFrom?: string;
  startsAtTo?: string;
  meetingId?: string;
  status?: string;
}): Promise<MotionReportEntry[]> {
  const query = new URLSearchParams();
  if (params?.startsAtFrom) query.set('startsAtFrom', params.startsAtFrom);
  if (params?.startsAtTo) query.set('startsAtTo', params.startsAtTo);
  if (params?.meetingId) query.set('meetingId', params.meetingId);
  if (params?.status) query.set('status', params.status);
  const queryString = query.toString();
  return httpGet<MotionReportEntry[]>(`/report-generators/motions${queryString ? `?${queryString}` : ''}`);
}

export function fetchVotingReport(params?: {
  startsAtFrom?: string;
  startsAtTo?: string;
  meetingId?: string;
  motionId?: string;
}): Promise<VotingReportEntry[]> {
  const query = new URLSearchParams();
  if (params?.startsAtFrom) query.set('startsAtFrom', params.startsAtFrom);
  if (params?.startsAtTo) query.set('startsAtTo', params.startsAtTo);
  if (params?.meetingId) query.set('meetingId', params.meetingId);
  if (params?.motionId) query.set('motionId', params.motionId);
  const queryString = query.toString();
  return httpGet<VotingReportEntry[]>(`/report-generators/voting${queryString ? `?${queryString}` : ''}`);
}

export function fetchConflictReport(params?: {
  startsAtFrom?: string;
  startsAtTo?: string;
  meetingId?: string;
}): Promise<ConflictReportEntry[]> {
  const query = new URLSearchParams();
  if (params?.startsAtFrom) query.set('startsAtFrom', params.startsAtFrom);
  if (params?.startsAtTo) query.set('startsAtTo', params.startsAtTo);
  if (params?.meetingId) query.set('meetingId', params.meetingId);
  const queryString = query.toString();
  return httpGet<ConflictReportEntry[]>(`/report-generators/conflicts${queryString ? `?${queryString}` : ''}`);
}

export function fetchForecastReport(params?: {
  startsAtFrom?: string;
  startsAtTo?: string;
  meetingTypeCode?: string;
}): Promise<ForecastReportEntry[]> {
  const query = new URLSearchParams();
  if (params?.startsAtFrom) query.set('startsAtFrom', params.startsAtFrom);
  if (params?.startsAtTo) query.set('startsAtTo', params.startsAtTo);
  if (params?.meetingTypeCode) query.set('meetingTypeCode', params.meetingTypeCode);
  const queryString = query.toString();
  return httpGet<ForecastReportEntry[]>(`/report-generators/forecast${queryString ? `?${queryString}` : ''}`);
}