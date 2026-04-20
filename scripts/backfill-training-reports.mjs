import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000/api';

const headers = {
  'Content-Type': 'application/json',
  'X-CMMS-CSRF': `training-backfill-${Date.now()}`,
  'X-Dev-Bypass': 'true',
  'X-Dev-User-Oid': 'e2e-test-user',
  'X-Dev-User-Email': 'e2e@municipality.local',
  'X-Dev-User-Name': 'E2E Test Admin',
  'X-Dev-Roles': 'ADMIN',
  'X-Dev-Permissions': [
    'meeting.read',
    'meeting.read.in_camera',
    'meeting.write',
    'meeting.start',
    'meeting.end',
    'meeting.publish',
    'agenda.read',
    'agenda.write',
    'agenda.publish',
    'minutes.read',
    'minutes.write',
    'minutes.publish',
    'minutes.adopt',
    'bylaw.read',
    'bylaw.write',
    'motion.propose',
    'motion.second',
    'motion.open_debate',
    'motion.close_debate',
    'motion.call',
    'vote.record',
    'attendee.read',
    'attendee.write',
    'report.submit',
    'report.approve.director',
    'report.approve.cao',
    'templates.manage',
    'public.publish',
    'resolution.manage',
    'action.manage',
    'workflow.execute',
  ].join(','),
};

const workflowCode = 'TRAINING_REGULAR_COUNCIL_REPORTS';

const reportPlans = [
  {
    agendaItemId: 'd4203bcb-3df9-4cb6-8deb-388975a3ada7',
    reportNumber: 'FIN-2026-014',
    title: '2026 Financial Plan Amendment and Utility Rate Stabilization',
    department: 'Corporate Services',
    executiveSummary:
      'Adjusts the 2026 financial plan to absorb fuel volatility while keeping utility rate increases within the adopted forecast.',
    recommendations:
      'THAT Council endorse the 2026 financial plan amendment and direct staff to bring forward the corresponding amendment bylaw.',
    financialImpact:
      'The amendment reallocates $185,000 from surplus stabilization reserves and avoids a mid-year utility surcharge.',
    legalImpact: 'The financial plan amendment will require bylaw updates before year-end adoption.',
    attachmentFileName: 'Regular Council - 23 Feb 2026 - Agenda - Pdf.pdf',
  },
  {
    agendaItemId: '6cf1cd4c-6501-4254-b994-16a9fedb34a2',
    reportNumber: 'ENG-2026-021',
    title: 'Asset Management Program Service Level Framework',
    department: 'Engineering and Public Works',
    executiveSummary:
      'Establishes service level targets for roads, drainage, parks, and civic facilities so capital planning aligns with council priorities.',
    recommendations:
      'THAT Council approve the draft asset management service level framework and direct staff to integrate it into the 2027 capital planning cycle.',
    financialImpact:
      'Implementation will use existing 2026 consulting funds and improve long-range capital forecasting accuracy.',
    legalImpact:
      'The framework supports statutory asset management planning obligations but does not create a new regulatory instrument.',
    attachmentFileName: 'Resume 2025 - Baker Tilly.pdf',
  },
  {
    agendaItemId: '77d20173-9c13-449d-858b-e2c57120b602',
    reportNumber: 'OPS-2026-009',
    title: 'Fleet Replacement Tender Award for Public Works Operations',
    department: 'Operations',
    executiveSummary:
      'Recommends awarding the fleet replacement contract for two tandem dump trucks and one sidewalk unit before the summer paving season.',
    recommendations:
      'THAT Council award the 2026 fleet replacement tender to Valley Industrial Equipment in the amount of $642,800 excluding GST.',
    financialImpact: 'Funding is available in the adopted equipment reserve and approved 2026 capital plan.',
    legalImpact: 'The contract award follows the municipality procurement bylaw and delegated purchasing thresholds.',
    attachmentFileName: 'TiViMate Users Guide 5.1.6.pdf',
  },
  {
    agendaItemId: '8bd7fc13-c644-4a26-b4c0-e4b17a0585a9',
    reportNumber: 'REC-2026-006',
    title: 'Accessibility Improvements for Recreation Facilities',
    department: 'Parks, Recreation and Culture',
    executiveSummary:
      'Presents a phased retrofit plan for washrooms, entry doors, and spectator viewing areas at the civic arena and aquatics centre.',
    recommendations:
      'THAT Council endorse Phase 1 recreation accessibility improvements and authorize grant application submissions for external funding.',
    financialImpact:
      'Phase 1 requires $120,000 in municipal contribution, offset by a pending accessibility infrastructure grant request.',
    legalImpact: 'Work will improve compliance with current accessibility standards and reduce barrier-related service risks.',
    attachmentFileName: 'Visual Style Guide for NotebookLM Presentations.pdf',
  },
  {
    agendaItemId: '0c78f440-45c1-4cca-9ebd-402c7c493bc2',
    reportNumber: 'FIRE-2026-004',
    title: 'Quarterly Fire Services Operations and Training Update',
    department: 'Protective Services',
    executiveSummary:
      'Summarizes first-quarter incident response metrics, volunteer recruitment progress, and upcoming live-burn training requirements.',
    recommendations: 'THAT Council receive the quarterly fire services operations update for information.',
    financialImpact: 'The report is informational and can be delivered within the approved training and operating budgets.',
    legalImpact: 'No additional statutory obligations are triggered by receipt of the report.',
    attachmentFileName: 'WPMU-DEV-Invoice-2025-06-05.pdf',
  },
];

async function api(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${options.method || 'GET'} ${path} failed ${response.status}: ${text}`);
  }

  return response.json();
}

function attachmentBase64(fileName) {
  const filePath = resolve(process.cwd(), 'assets', 'attachments', fileName);
  return readFileSync(filePath).toString('base64');
}

async function ensureWorkflow() {
  const workflows = await api('/workflows/configurations');
  let workflow = workflows.find((entry) => entry.code === workflowCode);

  if (!workflow) {
    workflow = await api('/workflows/configurations', {
      method: 'POST',
      body: JSON.stringify({
        code: workflowCode,
        name: 'Training Regular Council Report Workflow',
        description: 'Default approval route for the persistent April 10, 2026 training package.',
        domain: 'REPORT',
        isActive: true,
        isDefault: true,
      }),
    });
  }

  const stageKeys = new Set((workflow.stages || []).map((stage) => stage.key));

  if (!stageKeys.has('DIRECTOR')) {
    workflow = await api(`/workflows/configurations/${workflow.id}/stages`, {
      method: 'POST',
      body: JSON.stringify({
        key: 'DIRECTOR',
        name: 'Director Review',
        approverRole: 'DIRECTOR',
        requireOnlyOneApproval: true,
        isOrdered: true,
        minimumApprovals: 1,
      }),
    });
  }

  if (!(workflow.stages || []).some((stage) => stage.key === 'CAO')) {
    workflow = await api(`/workflows/configurations/${workflow.id}/stages`, {
      method: 'POST',
      body: JSON.stringify({
        key: 'CAO',
        name: 'CAO Approval',
        approverRole: 'CAO',
        requireOnlyOneApproval: true,
        isOrdered: true,
        minimumApprovals: 1,
      }),
    });
  }

  return workflow;
}

async function ensureReport(workflowId, plan) {
  const existing = await api(`/reports?agendaItemId=${encodeURIComponent(plan.agendaItemId)}`);
  const current = existing[0];

  const payload = {
    workflowConfigId: workflowId,
    title: plan.title,
    department: plan.department,
    executiveSummary: plan.executiveSummary,
    recommendations: plan.recommendations,
    financialImpact: plan.financialImpact,
    legalImpact: plan.legalImpact,
  };

  const createPayload = {
    agendaItemId: plan.agendaItemId,
    reportNumber: plan.reportNumber,
    ...payload,
  };

  const report = current
    ? await api(`/reports/${current.id}`, { method: 'PATCH', body: JSON.stringify(payload) })
    : await api('/reports', { method: 'POST', body: JSON.stringify(createPayload) });

  const attachments = await api(`/reports/${report.id}/attachments`);
  if (attachments.length === 0) {
    const contentBase64 = attachmentBase64(plan.attachmentFileName);
    await api(`/reports/${report.id}/attachments`, {
      method: 'POST',
      body: JSON.stringify({
        fileName: plan.attachmentFileName,
        mimeType: 'application/pdf',
        sizeBytes: Buffer.from(contentBase64, 'base64').byteLength,
        contentBase64,
      }),
    });
  }

  let latest = report;
  if (latest.workflowStatus === 'DRAFT' || latest.workflowStatus === 'REJECTED') {
    latest = await api(`/reports/${latest.id}/submit`, { method: 'POST' });
  }
  if (latest.workflowStatus === 'PENDING_DIRECTOR_APPROVAL') {
    latest = await api(`/workflows/reports/${latest.id}/approve-director`, {
      method: 'POST',
      body: JSON.stringify({ comments: 'Backfilled into the persistent April 10 training package.' }),
    });
  }
  if (latest.workflowStatus === 'PENDING_CAO_APPROVAL') {
    latest = await api(`/workflows/reports/${latest.id}/approve-cao`, {
      method: 'POST',
      body: JSON.stringify({ comments: 'Approved for the persistent training package.' }),
    });
  }
  if (latest.workflowStatus === 'PENDING_WORKFLOW_APPROVAL') {
    latest = await api(`/workflows/reports/${latest.id}/approve-current`, {
      method: 'POST',
      body: JSON.stringify({ comments: 'Advanced by training report backfill script.' }),
    });
  }
  if (latest.workflowStatus === 'PENDING_WORKFLOW_APPROVAL') {
    latest = await api(`/workflows/reports/${latest.id}/approve-current`, {
      method: 'POST',
      body: JSON.stringify({ comments: 'Advanced by training report backfill script.' }),
    });
  }
  if (latest.workflowStatus === 'APPROVED') {
    latest = await api(`/reports/${latest.id}/publish`, { method: 'POST' });
  }

  return latest;
}

async function removeManualTestArtifacts() {
  const testReports = await api('/reports?agendaItemId=6cf1cd4c-6501-4254-b994-16a9fedb34a2');
  const manual = testReports.find((report) => report.title === 'Manual DB Report Test');
  if (manual) {
    await api(`/reports/${manual.id}`, { method: 'DELETE' });
  }

  const workflows = await api('/workflows/configurations');
  for (const workflow of workflows.filter((entry) => entry.code === 'MANUAL_DB_TEST' || entry.code === 'MANUAL_DB_TEST2')) {
    await api(`/workflows/configurations/${workflow.id}`, { method: 'DELETE' });
  }
}

async function main() {
  await removeManualTestArtifacts();
  const workflow = await ensureWorkflow();
  for (const plan of reportPlans) {
    const report = await ensureReport(workflow.id, plan);
    console.log(`${plan.reportNumber}: ${report.workflowStatus}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
