import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  addWorkflowStage,
  createWorkflowConfiguration,
  deleteWorkflowConfiguration,
  listWorkflowConfigurations,
  cloneWorkflowConfiguration,
  removeWorkflowStage,
  reorderWorkflowStages,
  updateWorkflowConfiguration,
  updateWorkflowStage,
} from '../../api/workflows.api';
import type { WorkflowRecord, WorkflowStageRecord } from '../../api/types/workflow.types';
import AppShell from '../../components/layout/AppShell';
import { useToast } from '../../hooks/useToast';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import MetricTile from '../../components/ui/MetricTile';

const ROLE_OPTIONS = ['DIRECTOR', 'CAO', 'ADMIN', 'STAFF'];

export default function WorkflowsAdmin(): JSX.Element {
  const { addToast } = useToast();
  const [workflows, setWorkflows] = useState<WorkflowRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);

  const [workflowForm, setWorkflowForm] = useState({
    code: '',
    name: '',
    description: '',
    isActive: true,
    isDefault: false,
  });

  const [stageForm, setStageForm] = useState({
    key: '',
    name: '',
    approverRole: 'DIRECTOR',
    requireOnlyOneApproval: true,
    isOrdered: true,
    minimumApprovals: 1,
  });
  const [editingStageId, setEditingStageId] = useState<string | null>(null);

  const selectedWorkflow = useMemo(
    () => workflows.find((workflow) => workflow.id === selectedWorkflowId) ?? null,
    [selectedWorkflowId, workflows],
  );

  const loadWorkflows = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const records = await listWorkflowConfigurations({ domain: 'REPORT', includeInactive: true });
      setWorkflows(records);
      setSelectedWorkflowId((current) => {
        if (current && records.some((workflow) => workflow.id === current)) {
          return current;
        }
        return records[0]?.id ?? null;
      });
    } catch {
      setError('Could not load workflow configurations.');
      addToast('Could not load workflow configurations.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadWorkflows();
  }, []);

  const handleCreateWorkflow = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setError(null);
    try {
      await createWorkflowConfiguration({
        code: workflowForm.code,
        name: workflowForm.name,
        description: workflowForm.description || undefined,
        domain: 'REPORT',
        isActive: workflowForm.isActive,
        isDefault: workflowForm.isDefault,
      });
      setWorkflowForm({ code: '', name: '', description: '', isActive: true, isDefault: false });
      await loadWorkflows();
      addToast('Workflow configuration created.', 'success');
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Could not create workflow configuration.');
      addToast('Could not create workflow configuration.', 'error');
    }
  };

  const handleDeleteWorkflow = async (workflow: WorkflowRecord): Promise<void> => {
    if (!window.confirm(`Delete workflow "${workflow.name}"?`)) {
      return;
    }
    setError(null);
    try {
      await deleteWorkflowConfiguration(workflow.id);
      await loadWorkflows();
      addToast('Workflow configuration deleted.', 'success');
    } catch {
      setError('Could not delete workflow configuration.');
      addToast('Could not delete workflow configuration.', 'error');
    }
  };

  const handleCloneWorkflow = async (workflow: WorkflowRecord): Promise<void> => {
    setError(null);
    try {
      await cloneWorkflowConfiguration(workflow.id);
      await loadWorkflows();
      addToast('Workflow configuration cloned.', 'success');
    } catch {
      setError('Could not clone workflow configuration.');
      addToast('Could not clone workflow configuration.', 'error');
    }
  };

  const handleCreateStage = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!selectedWorkflow) {
      return;
    }
    setError(null);
    try {
      if (editingStageId) {
        await updateWorkflowStage(selectedWorkflow.id, editingStageId, {
          key: stageForm.key,
          name: stageForm.name,
          approverRole: stageForm.approverRole,
          requireOnlyOneApproval: stageForm.requireOnlyOneApproval,
          isOrdered: stageForm.isOrdered,
          minimumApprovals: stageForm.minimumApprovals,
        });
      } else {
        await addWorkflowStage(selectedWorkflow.id, {
          key: stageForm.key,
          name: stageForm.name,
          approverRole: stageForm.approverRole,
          requireOnlyOneApproval: stageForm.requireOnlyOneApproval,
          isOrdered: stageForm.isOrdered,
          minimumApprovals: stageForm.minimumApprovals,
        });
      }
      setStageForm((current) => ({
        ...current,
        key: '',
        name: '',
        requireOnlyOneApproval: true,
        minimumApprovals: 1,
      }));
      setEditingStageId(null);
      await loadWorkflows();
      addToast(editingStageId ? 'Workflow stage updated.' : 'Workflow stage added.', 'success');
    } catch {
      setError(editingStageId ? 'Could not update workflow stage.' : 'Could not add workflow stage.');
      addToast(editingStageId ? 'Could not update workflow stage.' : 'Could not add workflow stage.', 'error');
    }
  };

  const handleEditStage = (stage: WorkflowStageRecord): void => {
    setEditingStageId(stage.id);
    setStageForm({
      key: stage.key,
      name: stage.name,
      approverRole: stage.approverRole,
      requireOnlyOneApproval: stage.requireOnlyOneApproval,
      isOrdered: stage.isOrdered,
      minimumApprovals: stage.minimumApprovals,
    });
  };

  const cancelEditStage = (): void => {
    setEditingStageId(null);
    setStageForm({
      key: '',
      name: '',
      approverRole: 'DIRECTOR',
      requireOnlyOneApproval: true,
      isOrdered: true,
      minimumApprovals: 1,
    });
  };

  const handleSetDefaultWorkflow = async (workflow: WorkflowRecord): Promise<void> => {
    setError(null);
    try {
      await updateWorkflowConfiguration(workflow.id, { isDefault: true, isActive: true });
      await loadWorkflows();
      addToast('Default workflow updated.', 'success');
    } catch {
      setError('Could not set default workflow.');
      addToast('Could not set default workflow.', 'error');
    }
  };

  const handleToggleWorkflowActive = async (workflow: WorkflowRecord): Promise<void> => {
    setError(null);
    try {
      await updateWorkflowConfiguration(workflow.id, { isActive: !workflow.isActive });
      await loadWorkflows();
      addToast(`Workflow ${workflow.isActive ? 'deactivated' : 'activated'}.`, 'success');
    } catch {
      setError('Could not update workflow status.');
      addToast('Could not update workflow status.', 'error');
    }
  };

  const handleDeleteStage = async (stage: WorkflowStageRecord): Promise<void> => {
    if (!selectedWorkflow) {
      return;
    }
    if (!window.confirm(`Delete stage "${stage.name}"?`)) {
      return;
    }
    setError(null);
    try {
      await removeWorkflowStage(selectedWorkflow.id, stage.id);
      await loadWorkflows();
      addToast('Workflow stage deleted.', 'success');
    } catch {
      setError('Could not delete workflow stage.');
      addToast('Could not delete workflow stage.', 'error');
    }
  };

  const moveStage = async (stageId: string, direction: -1 | 1): Promise<void> => {
    if (!selectedWorkflow) {
      return;
    }

    const orderedIds = [...selectedWorkflow.stages]
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((stage) => stage.id);
    const index = orderedIds.findIndex((id) => id === stageId);
    const targetIndex = index + direction;
    if (index === -1 || targetIndex < 0 || targetIndex >= orderedIds.length) {
      return;
    }

    const nextOrder = [...orderedIds];
    const [moved] = nextOrder.splice(index, 1);
    nextOrder.splice(targetIndex, 0, moved);

    setError(null);
    try {
      await reorderWorkflowStages(selectedWorkflow.id, nextOrder);
      await loadWorkflows();
    } catch {
      setError('Could not reorder workflow stages.');
      addToast('Could not reorder workflow stages.', 'error');
    }
  };

  return (
    <AppShell
      title="Workflow Configurations"
      subtitle="Manage configurable report approval routes, stage order, and default routing policy."
      workspaceVariant="admin"
    >
      <section className="module-overview">
        <MetricTile label="Report Workflows" value={workflows.length} foot="Definitions available to report lifecycle orchestration" variant="primary" />
      </section>

      <Card>
        <CardHeader
          title="Create Workflow"
          description="Create a report workflow definition and mark one definition as the default route."
        />
        <CardBody>
          <form onSubmit={(event) => void handleCreateWorkflow(event)}>
            <div className="form-grid">
              <div className="form-field">
                <label htmlFor="workflow-code">Code</label>
                <input
                  id="workflow-code"
                  className="field"
                  value={workflowForm.code}
                  onChange={(event) =>
                    setWorkflowForm((current) => ({
                      ...current,
                      code: event.target.value.toUpperCase().replace(/\s+/g, '_'),
                    }))
                  }
                  placeholder="REPORT_STANDARD"
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="workflow-name">Display Name</label>
                <input
                  id="workflow-name"
                  className="field"
                  value={workflowForm.name}
                  onChange={(event) => setWorkflowForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Standard Report Approval"
                  required
                />
              </div>
              <div className="form-field span-all">
                <label htmlFor="workflow-description">Description</label>
                <textarea
                  id="workflow-description"
                  className="field"
                  rows={3}
                  value={workflowForm.description}
                  onChange={(event) => setWorkflowForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Optional notes for administrators"
                />
              </div>
              <div className="form-field">
                <label htmlFor="workflow-status">Status</label>
                <select
                  id="workflow-status"
                  className="field"
                  value={workflowForm.isActive ? 'ACTIVE' : 'INACTIVE'}
                  onChange={(event) =>
                    setWorkflowForm((current) => ({
                      ...current,
                      isActive: event.target.value === 'ACTIVE',
                    }))
                  }
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
              <div className="form-field">
                <label htmlFor="workflow-default">Default Route</label>
                <select
                  id="workflow-default"
                  className="field"
                  value={workflowForm.isDefault ? 'YES' : 'NO'}
                  onChange={(event) =>
                    setWorkflowForm((current) => ({
                      ...current,
                      isDefault: event.target.value === 'YES',
                    }))
                  }
                >
                  <option value="NO">No</option>
                  <option value="YES">Yes</option>
                </select>
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                Create Workflow
              </button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Configured Workflows"
          description="Select a workflow to manage stages. Stage ordering controls approval path progression."
        />
        <CardBody>
          {isLoading ? <p className="muted">Loading workflow configurations...</p> : null}
          {error ? <p className="inline-alert">{error}</p> : null}
          {!isLoading && workflows.length === 0 ? <div className="empty-state">No workflows configured yet.</div> : null}
          {workflows.length > 0 ? (
            <div className="table-wrap">
              <table className="data-table" aria-label="Workflow definitions">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Code</th>
                    <th>Default</th>
                    <th>Status</th>
                    <th>Stages</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {workflows.map((workflow) => (
                    <tr key={workflow.id}>
                      <td>{workflow.name}</td>
                      <td>{workflow.code}</td>
                      <td>{workflow.isDefault ? 'Yes' : 'No'}</td>
                      <td>{workflow.isActive ? 'Active' : 'Inactive'}</td>
                      <td>{workflow.stages.length}</td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setSelectedWorkflowId(workflow.id)}
                        >
                          Manage Stages
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => void handleCloneWorkflow(workflow)}
                        >
                          Duplicate
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => void handleSetDefaultWorkflow(workflow)}
                          disabled={workflow.isDefault}
                        >
                          {workflow.isDefault ? 'Default' : 'Set Default'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => void handleToggleWorkflowActive(workflow)}
                        >
                          {workflow.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger"
                          onClick={() => void handleDeleteWorkflow(workflow)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Workflow Stages"
          description={
            selectedWorkflow
              ? `Managing stages for ${selectedWorkflow.name}.`
              : 'Select a workflow above to configure its stages.'
          }
        />
        <CardBody>
          {selectedWorkflow ? (
            <>
              <form onSubmit={(event) => void handleCreateStage(event)}>
                <div className="form-grid">
                  <div className="form-field">
                    <label htmlFor="stage-key">Stage Key</label>
                    <input
                      id="stage-key"
                      className="field"
                      value={stageForm.key}
                      onChange={(event) =>
                        setStageForm((current) => ({
                          ...current,
                          key: event.target.value.toUpperCase().replace(/\s+/g, '_'),
                        }))
                      }
                      placeholder="DIRECTOR_REVIEW"
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="stage-name">Stage Name</label>
                    <input
                      id="stage-name"
                      className="field"
                      value={stageForm.name}
                      onChange={(event) => setStageForm((current) => ({ ...current, name: event.target.value }))}
                      placeholder="Director Review"
                      required
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="stage-role">Approver Role</label>
                    <select
                      id="stage-role"
                      className="field"
                      value={stageForm.approverRole}
                      onChange={(event) => setStageForm((current) => ({ ...current, approverRole: event.target.value }))}
                    >
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-field">
                    <label htmlFor="stage-minimum">Minimum Approvals</label>
                    <input
                      id="stage-minimum"
                      className="field"
                      type="number"
                      min={1}
                      value={stageForm.minimumApprovals}
                      onChange={(event) =>
                        setStageForm((current) => ({
                          ...current,
                          minimumApprovals: Math.max(Number(event.target.value || '1'), 1),
                        }))
                      }
                      disabled={stageForm.requireOnlyOneApproval}
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="stage-any-one">Approval Threshold</label>
                    <select
                      id="stage-any-one"
                      className="field"
                      value={stageForm.requireOnlyOneApproval ? 'ONE' : 'MULTIPLE'}
                      onChange={(event) =>
                        setStageForm((current) => ({
                          ...current,
                          requireOnlyOneApproval: event.target.value === 'ONE',
                          minimumApprovals: event.target.value === 'ONE' ? 1 : current.minimumApprovals,
                        }))
                      }
                    >
                      <option value="ONE">Any one approver</option>
                      <option value="MULTIPLE">Require minimum approvals</option>
                    </select>
                  </div>
                  <div className="form-field">
                    <label htmlFor="stage-ordered">Sequence Behavior</label>
                    <select
                      id="stage-ordered"
                      className="field"
                      value={stageForm.isOrdered ? 'ORDERED' : 'PARALLEL'}
                      onChange={(event) =>
                        setStageForm((current) => ({
                          ...current,
                          isOrdered: event.target.value === 'ORDERED',
                        }))
                      }
                    >
                      <option value="ORDERED">Ordered stage</option>
                      <option value="PARALLEL">Parallel stage</option>
                    </select>
                  </div>
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn btn-primary">
                    {editingStageId ? 'Update Stage' : 'Add Stage'}
                  </button>
                  {editingStageId ? (
                    <button type="button" className="btn btn-quiet" onClick={cancelEditStage}>
                      Cancel Edit
                    </button>
                  ) : null}
                </div>
              </form>

              {selectedWorkflow.stages.length === 0 ? (
                <div className="empty-state">No stages configured for this workflow yet.</div>
              ) : (
                <div className="table-wrap">
                  <table className="data-table" aria-label="Workflow stages">
                    <thead>
                      <tr>
                        <th>Order</th>
                        <th>Name</th>
                        <th>Key</th>
                        <th>Role</th>
                        <th>Threshold</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[...selectedWorkflow.stages]
                        .sort((left, right) => left.sortOrder - right.sortOrder)
                        .map((stage) => (
                          <tr key={stage.id}>
                            <td>{stage.sortOrder}</td>
                            <td>{stage.name}</td>
                            <td>{stage.key}</td>
                            <td>{stage.approverRole}</td>
                            <td>
                              {stage.requireOnlyOneApproval ? 'Any one approver' : `Minimum ${stage.minimumApprovals}`}
                            </td>
                            <td>
                              <button type="button" className="btn btn-secondary" onClick={() => void moveStage(stage.id, -1)}>
                                Up
                              </button>
                              <button type="button" className="btn btn-secondary" onClick={() => void moveStage(stage.id, 1)}>
                                Down
                              </button>
                              <button type="button" className="btn btn-secondary" onClick={() => handleEditStage(stage)}>
                                Edit
                              </button>
                              <button type="button" className="btn btn-danger" onClick={() => void handleDeleteStage(stage)}>
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">Select a workflow from the table to configure stages.</div>
          )}
        </CardBody>
      </Card>
    </AppShell>
  );
}
