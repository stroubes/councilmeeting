import { useEffect, useState } from 'react';
import { listMotions } from '../api/motions.api';
import { listMeetingAttendees } from '../api/attendees.api';
import { listVotesByMotion, getVoteTally, castVote, updateVote } from '../api/votes.api';
import { listManagedUsers } from '../api/users.api';
import type { AttendeeRecord } from '../api/types/attendee.types';
import type { ManagedUserRecord } from '../api/types/admin.types';
import type { MotionRecord } from '../api/types/motion.types';
import type { VoteRecord, VoteTally, VoteValue } from '../api/types/vote.types';
import Icon from './ui/Icon';

interface RollCallVotingPanelProps {
  meetingId: string;
}

const VOTE_LABELS: Record<VoteValue, string> = {
  YEA: 'YEA',
  NAY: 'NAY',
  ABSTAIN: 'ABSTAIN',
  ABSENT: 'ABSENT',
};

const VOTE_CLASS: Record<VoteValue, string> = {
  YEA: 'status-success',
  NAY: 'status-error',
  ABSTAIN: 'status-warn',
  ABSENT: 'status-muted',
};

function TallyBar({ tally }: { tally: VoteTally }): JSX.Element {
  const total = tally.totalVotes || 1;
  const yesPct = Math.round((tally.yesCount / total) * 100);
  const noPct = Math.round((tally.noCount / total) * 100);
  const abstainPct = Math.round((tally.abstainCount / total) * 100);
  const absentPct = 100 - yesPct - noPct - abstainPct;

  return (
    <div className="vote-tally">
      <div className="tally-bar">
        {yesPct > 0 && <div className="tally-segment tally-yes" style={{ width: `${yesPct}%` }} />}
        {noPct > 0 && <div className="tally-segment tally-no" style={{ width: `${noPct}%` }} />}
        {abstainPct > 0 && <div className="tally-segment tally-abstain" style={{ width: `${abstainPct}%` }} />}
        {absentPct > 0 && <div className="tally-segment tally-absent" style={{ width: `${absentPct}%` }} />}
      </div>
      <div className="tally-counts">
        <span className="tally-count tally-yes-label">{tally.yesCount} Yea</span>
        <span className="tally-count tally-no-label">{tally.noCount} Nay</span>
        <span className="tally-count tally-abstain-label">{tally.abstainCount} Abstain</span>
        <span className="tally-count tally-absent-label">{tally.absentCount} Absent</span>
      </div>
    </div>
  );
}

export default function RollCallVotingPanel({ meetingId }: RollCallVotingPanelProps): JSX.Element {
  const [motions, setMotions] = useState<MotionRecord[]>([]);
  const [attendees, setAttendees] = useState<AttendeeRecord[]>([]);
  const [votes, setVotes] = useState<VoteRecord[]>([]);
  const [tally, setTally] = useState<VoteTally | null>(null);
  const [selectedMotionId, setSelectedMotionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [castingVote, setCastingVote] = useState<string | null>(null);
  const [users, setUsers] = useState<ManagedUserRecord[]>([]);

  const voteMap = new Map(votes.map((v) => [v.councilMemberId, v]));
  const userMap = new Map(users.map((u) => [u.id, u]));

  useEffect(() => {
    const load = async (): Promise<void> => {
      setIsLoading(true);
      setError(null);
      try {
        const [motionList, attendeeList, userList] = await Promise.all([
          listMotions(meetingId),
          listMeetingAttendees(meetingId),
          listManagedUsers(),
        ]);
        const votableMotions = motionList.filter(
          (m) => m.status === 'LIVE' || m.status === 'CARRIED' || m.status === 'DEFEATED',
        );
        setMotions(votableMotions);
        setAttendees(attendeeList.filter((a) => a.role === 'COUNCIL_MEMBER'));
        setUsers(userList);
        if (votableMotions.length > 0) {
          setSelectedMotionId(votableMotions[0].id);
        }
      } catch {
        setError('Failed to load voting data.');
      } finally {
        setIsLoading(false);
      }
    };
    void load();
  }, [meetingId]);

  useEffect(() => {
    if (!selectedMotionId) return;
    const loadVotes = async (): Promise<void> => {
      try {
        const [voteList, voteTally] = await Promise.all([
          listVotesByMotion(selectedMotionId),
          getVoteTally(selectedMotionId),
        ]);
        setVotes(voteList);
        setTally(voteTally);
      } catch {
        setVotes([]);
        setTally(null);
      }
    };
    void loadVotes();
  }, [selectedMotionId]);

  const handleCastVote = async (councilMemberId: string, value: VoteValue): Promise<void> => {
    setCastingVote(councilMemberId);
    try {
      const existing = voteMap.get(councilMemberId);
      if (existing) {
        await updateVote(existing.id, { voteValue: value });
      } else {
        await castVote({
          motionId: selectedMotionId,
          councilMemberId,
          voteValue: value,
        });
      }
      const [voteList, voteTally] = await Promise.all([
        listVotesByMotion(selectedMotionId),
        getVoteTally(selectedMotionId),
      ]);
      setVotes(voteList);
      setTally(voteTally);
    } catch {
      setError('Failed to record vote.');
    } finally {
      setCastingVote(null);
    }
  };

  const selectedMotion = motions.find((m) => m.id === selectedMotionId);

  return (
    <section>
      <div className="section-header">
        <div>
          <h2>Roll Call Voting</h2>
          <p className="muted">Record individual votes for each council member per BC Community Charter s.132.</p>
        </div>
      </div>

      {error ? <p className="inline-alert">{error}</p> : null}

      {isLoading ? (
        <p className="muted">Loading voting data…</p>
      ) : (
        <>
          {motions.length === 0 ? (
            <div className="empty-state">
              No votable motions found. A motion must be live or completed before roll call votes can be recorded.
            </div>
          ) : (
            <>
              <div className="form-field" style={{ maxWidth: 400 }}>
                <label htmlFor="motion-select">Motion</label>
                <select
                  id="motion-select"
                  value={selectedMotionId}
                  onChange={(e) => setSelectedMotionId(e.target.value)}
                >
                  {motions.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.title} ({m.status})
                    </option>
                  ))}
                </select>
              </div>

              {selectedMotion && (
                <div className="motion-summary">
                  <p><strong>{selectedMotion.title}</strong></p>
                  {selectedMotion.body && <p className="muted">{selectedMotion.body}</p>}
                </div>
              )}

              {tally && <TallyBar tally={tally} />}

              <div className="vote-roster">
                {attendees.map((attendee) => {
                  const vote = voteMap.get(attendee.userId);
                  const isCasting = castingVote === attendee.userId;
                  return (
                    <div key={attendee.id} className="vote-roster-row">
                      <div className="vote-member">
                        <span className={`status-badge ${attendee.status === 'PRESENT' || attendee.status === 'LATE' ? '' : 'status-muted'}`}>
                          {attendee.status === 'PRESENT' || attendee.status === 'LATE' ? (
                            <Icon name="check" size={12} />
                          ) : (
                            <Icon name="x" size={12} />
                          )}
                        </span>
                        <span className="vote-member-name">{userMap.get(attendee.userId)?.displayName ?? attendee.userId}</span>
                        {vote?.isConflictDeclared && (
                          <span className="status-badge status-warn" title="Conflict of interest declared">
                            <Icon name="alert-triangle" size={12} /> COI
                          </span>
                        )}
                      </div>
                      <div className="vote-controls">
                        {vote ? (
                          <>
                            <span className={`status-badge ${VOTE_CLASS[vote.voteValue]}`}>
                              {VOTE_LABELS[vote.voteValue]}
                            </span>
                            <div className="vote-change">
                              {(['YEA', 'NAY', 'ABSTAIN', 'ABSENT'] as VoteValue[]).map((val) => (
                                <button
                                  key={val}
                                  type="button"
                                  className={`btn btn-quiet btn-sm ${vote.voteValue === val ? 'btn-primary' : ''}`}
                                  onClick={() => handleCastVote(attendee.userId, val)}
                                  disabled={isCasting}
                                  title={`Record ${val}`}
                                >
                                  {val}
                                </button>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="vote-buttons">
                            {(['YEA', 'NAY', 'ABSTAIN'] as VoteValue[]).map((val) => (
                              <button
                                key={val}
                                type="button"
                                className={`btn btn-sm ${val === 'YEA' ? 'btn-success' : val === 'NAY' ? 'btn-danger' : 'btn-warn'}`}
                                onClick={() => handleCastVote(attendee.userId, val)}
                                disabled={isCasting}
                              >
                                {val === 'YEA' ? <Icon name="check" size={14} /> : val === 'NAY' ? <Icon name="x" size={14} /> : 'ABS'}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}