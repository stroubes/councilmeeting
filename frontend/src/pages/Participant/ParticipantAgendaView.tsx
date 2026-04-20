import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchCurrentUser } from '../../api/auth.api';
import {
  createConflictDeclaration,
  listConflictDeclarationsByMeeting,
} from '../../api/conflictDeclarations.api';
import type { AuthenticatedUser } from '../../types/auth.types';
import type { ConflictDeclarationRecord } from '../../api/types/conflict-declaration.types';
import AppShell from '../../components/layout/AppShell';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import StatusBadge from '../../components/ui/StatusBadge';

interface AgendaItemDetails {
  id: string;
  agendaId: string;
  meetingId: string;
  itemType: string;
  title: string;
  description?: string;
  itemNumber?: string;
  status: string;
  isInCamera: boolean;
  isPublicVisible: boolean;
}

export default function ParticipantAgendaView(): JSX.Element {
  const { agendaItemId } = useParams<{ agendaItemId: string }>();
  const [currentUser, setCurrentUser] = useState<AuthenticatedUser | null>(null);
  const [item, setItem] = useState<AgendaItemDetails | null>(null);
  const [existingDeclarations, setExistingDeclarations] = useState<ConflictDeclarationRecord[]>([]);
  const [coiReason, setCoiReason] = useState('');
  const [isDeclaring, setIsDeclaring] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    const load = async (): Promise<void> => {
      if (!agendaItemId) return;
      setIsLoading(true);
      setError(null);
      try {
        const user = await fetchCurrentUser();
        setCurrentUser(user);

        const meetingId = 'direct';
        const [declarations] = await Promise.all([
          listConflictDeclarationsByMeeting(meetingId),
        ]);
        setExistingDeclarations(declarations.filter(
          (d) => d.userId === user.id && d.agendaItemId === agendaItemId,
        ));

        setItem({
          id: agendaItemId,
          agendaId: 'unknown',
          meetingId: meetingId,
          itemType: 'General',
          title: 'Agenda Item',
          description: undefined,
          itemNumber: undefined,
          status: 'APPROVED',
          isInCamera: false,
          isPublicVisible: true,
        });
      } catch {
        setError('Could not load agenda item details.');
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [agendaItemId]);

  const handleDeclareCoi = async (): Promise<void> => {
    if (!currentUser || !item) return;
    setIsDeclaring(true);
    setError(null);
    setSuccessMessage(null);
    try {
      await createConflictDeclaration({
        meetingId: item.meetingId,
        agendaItemId: item.id,
        userId: currentUser.id,
        reason: coiReason.trim() || undefined,
      });
      setSuccessMessage('Conflict of interest declared successfully.');
      setCoiReason('');
      const updated = await listConflictDeclarationsByMeeting(item.meetingId);
      setExistingDeclarations(updated.filter(
        (d) => d.userId === currentUser.id && d.agendaItemId === agendaItemId,
      ));
    } catch (err: any) {
      setError(err?.message ?? 'Could not declare conflict of interest.');
    } finally {
      setIsDeclaring(false);
    }
  };

  const existingDeclaration = existingDeclarations[0];

  if (isLoading) {
    return (
      <AppShell title="Agenda Item" subtitle="Loading...">
        <p className="muted">Loading agenda item...</p>
      </AppShell>
    );
  }

  if (error && !item) {
    return (
      <AppShell title="Agenda Item" subtitle="Error">
        <p className="inline-alert">{error}</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={item?.title ?? 'Agenda Item'}
      subtitle="Council Member View"
    >
      {error ? <p className="inline-alert" style={{ marginBottom: '1rem' }}>{error}</p> : null}
      {successMessage ? (
        <p className="success-alert" style={{ marginBottom: '1rem' }}>{successMessage}</p>
      ) : null}

      {item && (
        <Card>
          <CardHeader title="Item Details" />
          <CardBody>
            <dl className="details-list">
              {item.itemNumber && (
                <div>
                  <dt>Item Number</dt>
                  <dd>{item.itemNumber}</dd>
                </div>
              )}
              <div>
                <dt>Type</dt>
                <dd>{item.itemType}</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd><StatusBadge status={item.status} /></dd>
              </div>
              <div>
                <dt>Visibility</dt>
                <dd>{item.isInCamera ? 'In Camera' : item.isPublicVisible ? 'Public' : 'Internal'}</dd>
              </div>
              {item.description && (
                <div>
                  <dt>Description</dt>
                  <dd>{item.description}</dd>
                </div>
              )}
            </dl>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader
          title="Conflict of Interest Declaration"
          description="Declare any real, perceived, or potential conflict of interest related to this agenda item."
        />
        <CardBody>
          {existingDeclaration ? (
            <div>
              <p className="success-alert">
                You have declared a conflict of interest for this item
                {existingDeclaration.reason ? `: ${existingDeclaration.reason}` : ''}.
              </p>
              <p className="muted" style={{ marginTop: '0.5rem' }}>
                Declared at {new Date(existingDeclaration.declaredAt).toLocaleString()}.
              </p>
            </div>
          ) : (
            <div>
              <div className="form-field" style={{ marginBottom: '1rem' }}>
                <label htmlFor="coi-reason">Reason (optional)</label>
                <textarea
                  id="coi-reason"
                  className="field"
                  rows={3}
                  value={coiReason}
                  onChange={(e) => setCoiReason(e.target.value)}
                  placeholder="Describe the nature of the conflict, if any..."
                />
              </div>
              <div className="form-actions">
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={isDeclaring}
                  onClick={() => void handleDeclareCoi()}
                >
                  {isDeclaring ? 'Declaring...' : 'Declare Conflict of Interest'}
                </button>
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {item && (
        <Card>
          <CardHeader title="Meeting" />
          <CardBody>
            <Link to={`/participant/meetings/${item.meetingId}`} className="btn btn-quiet">
              Back to Meeting
            </Link>
          </CardBody>
        </Card>
      )}
    </AppShell>
  );
}
