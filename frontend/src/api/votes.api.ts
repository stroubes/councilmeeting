import { httpDelete, httpGet, httpPatch, httpPost } from './httpClient';
import type { CastVotePayload, UpdateVotePayload, VoteRecord, VoteTally } from './types/vote.types';

export function castVote(payload: CastVotePayload): Promise<VoteRecord> {
  return httpPost<VoteRecord, CastVotePayload>('/votes', payload);
}

export function listVotesByMotion(motionId: string): Promise<VoteRecord[]> {
  return httpGet<VoteRecord[]>(`/votes/motion/${motionId}`);
}

export function getVoteTally(motionId: string): Promise<VoteTally> {
  return httpGet<VoteTally>(`/votes/motion/${motionId}/tally`);
}

export function getVote(id: string): Promise<VoteRecord> {
  return httpGet<VoteRecord>(`/votes/${id}`);
}

export function updateVote(id: string, payload: UpdateVotePayload): Promise<VoteRecord> {
  return httpPatch<VoteRecord, UpdateVotePayload>(`/votes/${id}`, payload);
}

export function deleteVote(id: string): Promise<{ ok: true }> {
  return httpDelete<{ ok: true }>(`/votes/${id}`);
}