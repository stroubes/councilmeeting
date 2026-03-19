import { httpDelete, httpGet, httpPatch, httpPost } from './httpClient';
import type {
  CreateMotionPayload,
  MotionRecord,
  PublicMotionState,
  SetMotionOutcomePayload,
  UpdateMotionPayload,
} from './types/motion.types';

export function listMotions(meetingId?: string): Promise<MotionRecord[]> {
  const query = meetingId ? `?meetingId=${encodeURIComponent(meetingId)}` : '';
  return httpGet<MotionRecord[]>(`/motions${query}`);
}

export function createMotion(payload: CreateMotionPayload): Promise<MotionRecord> {
  return httpPost<MotionRecord, CreateMotionPayload>('/motions', payload);
}

export function updateMotion(motionId: string, payload: UpdateMotionPayload): Promise<MotionRecord> {
  return httpPatch<MotionRecord, UpdateMotionPayload>(`/motions/${motionId}`, payload);
}

export function setMotionLive(motionId: string): Promise<MotionRecord> {
  return httpPost<MotionRecord>(`/motions/${motionId}/set-live`);
}

export function setMotionOutcome(motionId: string, payload: SetMotionOutcomePayload): Promise<MotionRecord> {
  return httpPost<MotionRecord, SetMotionOutcomePayload>(`/motions/${motionId}/set-outcome`, payload);
}

export function deleteMotion(motionId: string): Promise<{ ok: true }> {
  return httpDelete<{ ok: true }>(`/motions/${motionId}`);
}

export async function getPublicCurrentLiveMotion(meetingId: string): Promise<MotionRecord | null> {
  return httpGet<MotionRecord | null>(`/motions/public/live?meetingId=${encodeURIComponent(meetingId)}`);
}

export async function getPublicMotionState(meetingId: string): Promise<PublicMotionState> {
  return httpGet<PublicMotionState>(`/motions/public/state?meetingId=${encodeURIComponent(meetingId)}`);
}
