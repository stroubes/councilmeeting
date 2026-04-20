import { expect, test } from './fixtures/auth.fixture';
import type { APIRequestContext } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { mkdir } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { MeetingRecord } from '../../src/api/types/meeting.types';
import type { MinutesRecord } from '../../src/api/types/minutes.types';
import type { AgendaRecord, AgendaItemRecord } from '../../src/api/types/agenda.types';
import type { StaffReportRecord, ReportAttachmentRecord } from '../../src/api/types/report.types';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000/api';
const RUN_TOKEN = `${Date.now()}`.slice(-5);
const KEEP_TRAINING_DATA = process.env.KEEP_TRAINING_DATA === '1';
const CAPTURE_TRAINING_SCREENSHOTS = process.env.CAPTURE_TRAINING_SCREENSHOTS === '1';
const SKIP_END_MEETING = process.env.SKIP_END_MEETING === '1';
const TRAINING_SCREENSHOT_DIR = resolve(process.cwd(), 'screenshots', 'training', 'regular-council-april-10-2026');

type ApiUser = {
  id: string;
  email: string;
  displayName: string;
  roles: string[];
  permissions: string[];
};

type ApiOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  user?: ApiUser;
};

type MotionRecord = {
  id: string;
  agendaItemId?: string;
  title: string;
  body: string;
  status: 'DRAFT' | 'LIVE' | 'CARRIED' | 'DEFEATED' | 'WITHDRAWN';
  motionPhase: 'PROPOSED' | 'SECONDED' | 'DEBATING' | 'CALLED';
  moverUserId?: string;
  seconderUserId?: string;
  sortOrder: number;
};

type ResolutionRecord = {
  id: string;
  meetingId: string;
  motionId?: string;
  resolutionNumber: string;
  title: string;
  body: string;
  status: 'DRAFT' | 'ADOPTED';
  voteFor: number;
  voteAgainst: number;
  voteAbstain: number;
};

type PublicMeetingPackage = {
  meetingId: string;
  meetingTitle: string;
  agenda: AgendaRecord | null;
  reports: StaffReportRecord[];
  minutes: MinutesRecord | null;
  resolutions: ResolutionRecord[];
};

type WorkflowRecord = {
  id: string;
  code: string;
  name: string;
  stages: Array<{
    id: string;
    key: string;
    name: string;
    approverRole: string;
    sortOrder: number;
  }>;
};

const ALL_PERMISSIONS = [
  'meeting.read',
  'meeting.read.in_camera',
  'meeting.write',
  'meeting.start',
  'meeting.end',
  'meeting.publish',
  'agenda.write',
  'agenda.publish',
  'motion.propose',
  'motion.second',
  'motion.open_debate',
  'motion.close_debate',
  'motion.call',
  'report.submit',
  'report.approve.director',
  'report.approve.cao',
  'templates.manage',
  'minutes.write',
  'minutes.adopt',
  'minutes.publish',
  'vote.record',
  'public.publish',
  'resolution.manage',
  'action.manage',
  'bylaw.read',
  'bylaw.write',
] as const;

const ADMIN_USER: ApiUser = {
  id: '9c0d4057-91b3-4d31-8d77-c2dcafe00001',
  email: 'e2e-admin@municipality.local',
  displayName: 'E2E Admin',
  roles: ['ADMIN'],
  permissions: [...ALL_PERMISSIONS],
};

const CLERK_USER: ApiUser = {
  id: '9c0d4057-91b3-4d31-8d77-c2dcafe00002',
  email: 'clerk@municipality.local',
  displayName: 'Jordan Clerk',
  roles: ['STAFF'],
  permissions: [
    'meeting.read',
    'meeting.write',
    'meeting.start',
    'meeting.end',
    'agenda.write',
    'report.submit',
    'minutes.write',
  ],
};

const DIRECTOR_USER: ApiUser = {
  id: '9c0d4057-91b3-4d31-8d77-c2dcafe00003',
  email: 'director@municipality.local',
  displayName: 'Avery Director',
  roles: ['DIRECTOR'],
  permissions: [
    'meeting.read',
    'meeting.read.in_camera',
    'agenda.write',
    'resolution.manage',
    'action.manage',
    'report.approve.director',
    'minutes.write',
  ],
};

const CAO_USER: ApiUser = {
  id: '9c0d4057-91b3-4d31-8d77-c2dcafe00004',
  email: 'cao@municipality.local',
  displayName: 'Morgan CAO',
  roles: ['CAO'],
  permissions: [
    'meeting.read',
    'meeting.read.in_camera',
    'meeting.start',
    'meeting.end',
    'meeting.publish',
    'agenda.write',
    'agenda.publish',
    'resolution.manage',
    'action.manage',
    'report.approve.cao',
    'minutes.adopt',
    'minutes.publish',
    'public.publish',
  ],
};

const MAYOR_USER: ApiUser = {
  id: '9c0d4057-91b3-4d31-8d77-c2dcafe00005',
  email: 'mayor@municipality.local',
  displayName: 'Mayor Eleanor Hayes',
  roles: ['COUNCIL_MEMBER'],
  permissions: ['meeting.read', 'meeting.read.in_camera', 'motion.propose', 'motion.second', 'vote.record', 'conflict.declare'],
};

const COUNCILLOR_ONE: ApiUser = {
  id: '9c0d4057-91b3-4d31-8d77-c2dcafe00006',
  email: 'council1@municipality.local',
  displayName: 'Councillor Priya Shah',
  roles: ['COUNCIL_MEMBER'],
  permissions: ['meeting.read', 'meeting.read.in_camera', 'motion.propose', 'motion.second', 'vote.record', 'conflict.declare'],
};

const COUNCILLOR_TWO: ApiUser = {
  id: '9c0d4057-91b3-4d31-8d77-c2dcafe00007',
  email: 'council2@municipality.local',
  displayName: 'Councillor Mateo Chen',
  roles: ['COUNCIL_MEMBER'],
  permissions: ['meeting.read', 'meeting.read.in_camera', 'motion.propose', 'motion.second', 'vote.record', 'conflict.declare'],
};

const COUNCILLOR_THREE: ApiUser = {
  id: '9c0d4057-91b3-4d31-8d77-c2dcafe00008',
  email: 'council3@municipality.local',
  displayName: 'Councillor Olivia Martin',
  roles: ['COUNCIL_MEMBER'],
  permissions: ['meeting.read', 'meeting.read.in_camera', 'motion.propose', 'motion.second', 'vote.record', 'conflict.declare'],
};

const COUNCILLOR_FOUR: ApiUser = {
  id: '9c0d4057-91b3-4d31-8d77-c2dcafe00009',
  email: 'council4@municipality.local',
  displayName: 'Councillor Liam Foster',
  roles: ['COUNCIL_MEMBER'],
  permissions: ['meeting.read', 'meeting.read.in_camera', 'motion.propose', 'motion.second', 'vote.record', 'conflict.declare'],
};

const ATTACHMENT_FILE_NAMES = [
  'Regular Council - 23 Feb 2026 - Agenda - Pdf.pdf',
  'Resume 2025 - Baker Tilly.pdf',
  'TiViMate Users Guide 5.1.6.pdf',
  'Visual Style Guide for NotebookLM Presentations.pdf',
  'WPMU-DEV-Invoice-2025-06-05.pdf',
] as const;

const REQUIRED_REGULAR_COUNCIL_SECTIONS = [
  'Call to Order',
  'Approval of Agenda',
  'Disclosure of Pecuniary Interest',
  'Adoption of Previous Minutes',
  'Staff Reports and Correspondence',
  'Bylaws',
  'Confirming Bylaw',
  'Adjournment',
] as const;

async function apiFetch<T>(request: APIRequestContext, path: string, options: ApiOptions = {}): Promise<T> {
  const method = options.method ?? 'GET';
  const user = options.user ?? ADMIN_USER;
  const csrfToken = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const response = await request.fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-CMMS-CSRF': csrfToken,
      'X-Dev-Bypass': 'true',
      'X-Dev-User-Oid': user.id,
      'X-Dev-User-Email': user.email,
      'X-Dev-User-Name': user.displayName,
      'X-Dev-Roles': user.roles.join(','),
      'X-Dev-Permissions': user.permissions.join(','),
    },
    data: options.body,
  });

  if (!response.ok()) {
    const bodyText = await response.text();
    throw new Error(`API ${method} ${path} failed ${response.status()}: ${bodyText}`);
  }

  return response.json() as Promise<T>;
}

function attachmentPath(fileName: string): string {
  return resolve(process.cwd(), '..', 'assets', 'attachments', fileName);
}

function fileToBase64(fileName: string): string {
  return readFileSync(attachmentPath(fileName)).toString('base64');
}

function currentYearResolutionNumber(sequence: number): string {
  return `RC-2026-0410-${String(sequence).padStart(2, '0')}-${RUN_TOKEN}`;
}

function minutesMotionFromResolution(resolution: ResolutionRecord, motion: MotionRecord, mover: ApiUser, seconder: ApiUser) {
  return {
    id: motion.id,
    agendaItemId: motion.agendaItemId,
    title: resolution.title,
    mover: mover.displayName,
    seconder: seconder.displayName,
    outcome: motion.status,
    notes: resolution.body,
  };
}

async function cleanupMeeting(request: APIRequestContext, meetingId: string): Promise<void> {
  try {
    await apiFetch<{ ok: true }>(request, `/meetings/${meetingId}`, { method: 'DELETE', user: ADMIN_USER });
  } catch {
    // Keep cleanup best-effort so earlier assertion failures remain visible.
  }
}

async function captureTrainingScreenshot(page: { goto: (url: string) => Promise<unknown>; waitForLoadState: (state: 'networkidle') => Promise<unknown>; screenshot: (options: { path: string; fullPage: boolean }) => Promise<unknown> }, slug: string): Promise<void> {
  if (!CAPTURE_TRAINING_SCREENSHOTS) {
    return;
  }

  await mkdir(TRAINING_SCREENSHOT_DIR, { recursive: true });
  await page.screenshot({
    path: resolve(TRAINING_SCREENSHOT_DIR, `${slug}.png`),
    fullPage: true,
  });
}

async function createMeeting(
  request: APIRequestContext,
  user: ApiUser,
  payload: { title: string; startsAt: string; location: string; description?: string },
): Promise<MeetingRecord> {
  return apiFetch<MeetingRecord>(request, '/meetings', {
    method: 'POST',
    user,
    body: {
      title: payload.title,
      description: payload.description,
      meetingTypeCode: 'COUNCIL',
      startsAt: payload.startsAt,
      location: payload.location,
      isPublic: true,
    },
  });
}

async function addAgendaItem(
  request: APIRequestContext,
  agendaId: string,
  payload: {
    itemType: AgendaItemRecord['itemType'];
    title: string;
    description?: string;
    parentItemId?: string;
  },
): Promise<AgendaRecord> {
  return apiFetch<AgendaRecord>(request, `/agendas/${agendaId}/items`, {
    method: 'POST',
    user: CLERK_USER,
    body: {
      itemType: payload.itemType,
      title: payload.title,
      description: payload.description,
      parentItemId: payload.parentItemId,
      isPublicVisible: true,
      isInCamera: false,
    },
  });
}

async function createMotion(
  request: APIRequestContext,
  payload: { meetingId: string; agendaItemId?: string; title: string; body: string; moverUserId?: string },
): Promise<MotionRecord> {
  return apiFetch<MotionRecord>(request, '/motions', {
    method: 'POST',
    user: ADMIN_USER,
    body: payload,
  });
}

async function createResolution(
  request: APIRequestContext,
  payload: {
    meetingId: string;
    agendaItemId?: string;
    motionId?: string;
    resolutionNumber: string;
    title: string;
    body: string;
    movedBy: string;
    secondedBy: string;
    voteFor: number;
    voteAgainst: number;
    voteAbstain: number;
    isActionRequired?: boolean;
    dueDate?: string;
  },
): Promise<ResolutionRecord> {
  return apiFetch<ResolutionRecord>(request, '/resolutions', {
    method: 'POST',
    user: CAO_USER,
    body: payload,
  });
}

test.describe('Regular council meeting walkthrough', () => {
  test('creates and publishes a full April 10 2026 regular council meeting package', async ({ bypassPage }) => {
    const createdMeetingIds: string[] = [];
    let workflowId: string | null = null;

    try {
      const previousMeeting = await createMeeting(bypassPage.request, CLERK_USER, {
        title: 'Regular Council Meeting - March 27, 2026',
        startsAt: '2026-03-27T18:00:00.000Z',
        location: 'Council Chamber',
        description: 'Prior regular council meeting used as the source for adoption of previous minutes.',
      });
      createdMeetingIds.push(previousMeeting.id);
      await apiFetch<MeetingRecord>(bypassPage.request, `/meetings/${previousMeeting.id}/publish`, {
        method: 'POST',
        user: CAO_USER,
      });

      const previousMinutes = await apiFetch<MinutesRecord>(bypassPage.request, '/minutes', {
        method: 'POST',
        user: CLERK_USER,
        body: {
          meetingId: previousMeeting.id,
          isInCamera: false,
          contentJson: {
            schemaVersion: 1,
            summary: 'Council adopted the February financial summary and directed staff to prepare the spring capital status report.',
            attendance: [
              { id: randomUUID(), personName: MAYOR_USER.displayName, role: 'CHAIR', present: true },
              { id: randomUUID(), personName: COUNCILLOR_ONE.displayName, role: 'COUNCIL_MEMBER', present: true },
            ],
            motions: [
              {
                id: randomUUID(),
                title: 'Adopt the March 27, 2026 regular council minutes',
                mover: MAYOR_USER.displayName,
                seconder: COUNCILLOR_ONE.displayName,
                outcome: 'CARRIED',
                notes: 'Carried unanimously.',
              },
            ],
            votes: [
              {
                id: randomUUID(),
                method: 'RECORDED',
                yesCount: 2,
                noCount: 0,
                abstainCount: 0,
                recordedVotes: [
                  { personName: MAYOR_USER.displayName, vote: 'YES' },
                  { personName: COUNCILLOR_ONE.displayName, vote: 'YES' },
                ],
              },
            ],
            actionItems: [],
            notes: ['Published as the reference minutes package for adoption at the April 10 meeting.'],
          },
        },
      });
      await apiFetch<MinutesRecord>(bypassPage.request, `/minutes/${previousMinutes.id}/finalize`, {
        method: 'POST',
        user: CLERK_USER,
      });
      await apiFetch<MinutesRecord>(bypassPage.request, `/minutes/${previousMinutes.id}/adopt`, {
        method: 'POST',
        user: CAO_USER,
      });
      await apiFetch<MinutesRecord>(bypassPage.request, `/minutes/${previousMinutes.id}/publish`, {
        method: 'POST',
        user: CAO_USER,
      });

      const regularMeeting = await createMeeting(bypassPage.request, CLERK_USER, {
        title: 'Regular Council Meeting - April 10, 2026',
        startsAt: '2026-04-10T18:00:00.000Z',
        location: 'Council Chamber',
        description: 'End-to-end training meeting covering agenda preparation, approvals, public publication, motions, resolutions, and minutes.',
      });
      createdMeetingIds.push(regularMeeting.id);

      const publishedMeeting = await apiFetch<MeetingRecord>(bypassPage.request, `/meetings/${regularMeeting.id}/publish`, {
        method: 'POST',
        user: CAO_USER,
      });
      expect(publishedMeeting.publishStatus).toBe('PUBLISHED');

      if (CAPTURE_TRAINING_SCREENSHOTS) {
        await bypassPage.goto(`${BASE_URL}/meetings`);
        await bypassPage.waitForLoadState('networkidle');
        await expect(bypassPage.getByText('Regular Council Meeting - April 10, 2026').first()).toBeVisible();
        await captureTrainingScreenshot(bypassPage, '01-meeting-created-and-published');
      }

      let agenda = await apiFetch<AgendaRecord>(bypassPage.request, '/agendas', {
        method: 'POST',
        user: CLERK_USER,
        body: {
          meetingId: regularMeeting.id,
          title: 'Regular Council Agenda - April 10, 2026',
        },
      });

      const sectionIds = new Map<string, string>();
      for (const title of REQUIRED_REGULAR_COUNCIL_SECTIONS) {
        agenda = await addAgendaItem(bypassPage.request, agenda.id, {
          itemType: 'SECTION',
          title,
        });
        sectionIds.set(title, agenda.items.find((item) => item.title === title)?.id ?? '');
      }

      agenda = await addAgendaItem(bypassPage.request, agenda.id, {
        itemType: 'INFO_ITEM',
        parentItemId: sectionIds.get('Adoption of Previous Minutes'),
        title: 'Adoption of the March 27, 2026 Regular Council Minutes',
        description:
          'Recommendation: THAT Council adopt the Regular Council Meeting minutes of March 27, 2026 as presented.',
      });

      const reportWorkflow = await apiFetch<WorkflowRecord>(bypassPage.request, '/workflows/configurations', {
        method: 'POST',
        user: ADMIN_USER,
        body: {
          code: `E2E_REPORT_${Date.now()}`,
          name: 'E2E Regular Council Report Workflow',
          description: 'Two-stage approval workflow created by the April 10 regular council meeting scenario.',
          domain: 'REPORT',
          isActive: true,
          isDefault: false,
        },
      });
      workflowId = reportWorkflow.id;

      await apiFetch<WorkflowRecord>(bypassPage.request, `/workflows/configurations/${reportWorkflow.id}/stages`, {
        method: 'POST',
        user: ADMIN_USER,
        body: {
          key: 'DIRECTOR',
          name: 'Director Review',
          approverRole: 'DIRECTOR',
          requireOnlyOneApproval: true,
          isOrdered: true,
          minimumApprovals: 1,
        },
      });
      await apiFetch<WorkflowRecord>(bypassPage.request, `/workflows/configurations/${reportWorkflow.id}/stages`, {
        method: 'POST',
        user: ADMIN_USER,
        body: {
          key: 'CAO',
          name: 'CAO Approval',
          approverRole: 'CAO',
          requireOnlyOneApproval: true,
          isOrdered: true,
          minimumApprovals: 1,
        },
      });

      const reportPlans = [
        {
          title: '2026 Financial Plan Amendment and Utility Rate Stabilization',
          reportNumber: 'FIN-2026-014',
          department: 'Corporate Services',
          executiveSummary:
            'Adjusts the 2026 financial plan to absorb fuel volatility while keeping utility rate increases within the adopted forecast.',
          recommendations:
            'THAT Council endorse the 2026 financial plan amendment and direct staff to bring forward the corresponding amendment bylaw.',
          financialImpact:
            'The amendment reallocates $185,000 from surplus stabilization reserves and avoids a mid-year utility surcharge.',
          legalImpact:
            'The financial plan amendment will require bylaw updates before year-end adoption.',
          attachmentFileName: ATTACHMENT_FILE_NAMES[0],
        },
        {
          title: 'Asset Management Program Service Level Framework',
          reportNumber: 'ENG-2026-021',
          department: 'Engineering and Public Works',
          executiveSummary:
            'Establishes service level targets for roads, drainage, parks, and civic facilities so capital planning aligns with council priorities.',
          recommendations:
            'THAT Council approve the draft asset management service level framework and direct staff to integrate it into the 2027 capital planning cycle.',
          financialImpact:
            'Implementation will use existing 2026 consulting funds and improve long-range capital forecasting accuracy.',
          legalImpact:
            'The framework supports statutory asset management planning obligations but does not create a new regulatory instrument.',
          attachmentFileName: ATTACHMENT_FILE_NAMES[1],
        },
        {
          title: 'Fleet Replacement Tender Award for Public Works Operations',
          reportNumber: 'OPS-2026-009',
          department: 'Operations',
          executiveSummary:
            'Recommends awarding the fleet replacement contract for two tandem dump trucks and one sidewalk unit before the summer paving season.',
          recommendations:
            'THAT Council award the 2026 fleet replacement tender to Valley Industrial Equipment in the amount of $642,800 excluding GST.',
          financialImpact:
            'Funding is available in the adopted equipment reserve and approved 2026 capital plan.',
          legalImpact:
            'The contract award follows the municipality procurement bylaw and delegated purchasing thresholds.',
          attachmentFileName: ATTACHMENT_FILE_NAMES[2],
        },
        {
          title: 'Accessibility Improvements for Recreation Facilities',
          reportNumber: 'REC-2026-006',
          department: 'Parks, Recreation and Culture',
          executiveSummary:
            'Presents a phased retrofit plan for washrooms, entry doors, and spectator viewing areas at the civic arena and aquatics centre.',
          recommendations:
            'THAT Council endorse Phase 1 recreation accessibility improvements and authorize grant application submissions for external funding.',
          financialImpact:
            'Phase 1 requires $120,000 in municipal contribution, offset by a pending accessibility infrastructure grant request.',
          legalImpact:
            'Work will improve compliance with current accessibility standards and reduce barrier-related service risks.',
          attachmentFileName: ATTACHMENT_FILE_NAMES[3],
        },
        {
          title: 'Quarterly Fire Services Operations and Training Update',
          reportNumber: 'FIRE-2026-004',
          department: 'Protective Services',
          executiveSummary:
            'Summarizes first-quarter incident response metrics, volunteer recruitment progress, and upcoming live-burn training requirements.',
          recommendations:
            'THAT Council receive the quarterly fire services operations update for information.',
          financialImpact:
            'The report is informational and can be delivered within the approved training and operating budgets.',
          legalImpact:
            'No additional statutory obligations are triggered by receipt of the report.',
          attachmentFileName: ATTACHMENT_FILE_NAMES[4],
        },
      ] as const;

      const publishedReports: StaffReportRecord[] = [];
      const reportAgendaItems: AgendaItemRecord[] = [];

      for (const plan of reportPlans) {
        agenda = await addAgendaItem(bypassPage.request, agenda.id, {
          itemType: 'STAFF_REPORT',
          parentItemId: sectionIds.get('Staff Reports and Correspondence'),
          title: plan.title,
          description: `${plan.reportNumber} - ${plan.department}`,
        });

        const agendaItem = agenda.items.find((item) => item.title === plan.title);
        expect(agendaItem).toBeDefined();
        reportAgendaItems.push(agendaItem as AgendaItemRecord);

        const report = await apiFetch<StaffReportRecord>(bypassPage.request, '/reports', {
          method: 'POST',
          user: CLERK_USER,
          body: {
            agendaItemId: agendaItem?.id,
            workflowConfigId: reportWorkflow.id,
            reportNumber: plan.reportNumber,
            title: plan.title,
            department: plan.department,
            executiveSummary: plan.executiveSummary,
            recommendations: plan.recommendations,
            financialImpact: plan.financialImpact,
            legalImpact: plan.legalImpact,
          },
        });

        const attachment = await apiFetch<ReportAttachmentRecord>(bypassPage.request, `/reports/${report.id}/attachments`, {
          method: 'POST',
          user: CLERK_USER,
          body: {
            fileName: plan.attachmentFileName,
            mimeType: 'application/pdf',
            sizeBytes: Buffer.from(fileToBase64(plan.attachmentFileName), 'base64').byteLength,
            contentBase64: fileToBase64(plan.attachmentFileName),
          },
        });
        expect(attachment.sourceType).toBe('LOCAL');
        expect(attachment.sourceSharePointWebUrl).toContain('/api/reports/local-attachments/');

        const localAttachmentResponse = await bypassPage.request.fetch(attachment.sourceSharePointWebUrl ?? '');
        expect(localAttachmentResponse.ok()).toBeTruthy();

        await apiFetch<StaffReportRecord>(bypassPage.request, `/reports/${report.id}/submit`, {
          method: 'POST',
          user: CLERK_USER,
        });
        await apiFetch<StaffReportRecord>(bypassPage.request, `/workflows/reports/${report.id}/approve-director`, {
          method: 'POST',
          user: DIRECTOR_USER,
          body: { comments: 'Director review complete. Ready for executive approval.' },
        });
        await apiFetch<StaffReportRecord>(bypassPage.request, `/workflows/reports/${report.id}/approve-cao`, {
          method: 'POST',
          user: CAO_USER,
          body: { comments: 'Approved for the April 10 regular council package.' },
        });
        const publishedReport = await apiFetch<StaffReportRecord>(bypassPage.request, `/reports/${report.id}/publish`, {
          method: 'POST',
          user: CAO_USER,
        });
        expect(publishedReport.workflowStatus).toBe('PUBLISHED');
        publishedReports.push(publishedReport);
      }

      agenda = await addAgendaItem(bypassPage.request, agenda.id, {
        itemType: 'BYLAW',
        parentItemId: sectionIds.get('Bylaws'),
        title: 'Financial Plan Amendment Bylaw No. 2198, 2026',
        description: 'First three readings for the 2026 financial plan amendment bylaw.',
      });
      agenda = await addAgendaItem(bypassPage.request, agenda.id, {
        itemType: 'OTHER',
        parentItemId: sectionIds.get('Confirming Bylaw'),
        title: 'Confirming Bylaw No. 2199, 2026',
        description: 'Confirms proceedings of the April 10, 2026 regular council meeting.',
      });

      await apiFetch<AgendaRecord>(bypassPage.request, `/agendas/${agenda.id}/submit-director`, {
        method: 'POST',
        user: CLERK_USER,
      });
      await apiFetch<AgendaRecord>(bypassPage.request, `/agendas/${agenda.id}/approve-director`, {
        method: 'POST',
        user: DIRECTOR_USER,
      });
      await apiFetch<AgendaRecord>(bypassPage.request, `/agendas/${agenda.id}/approve-cao`, {
        method: 'POST',
        user: CAO_USER,
      });
      const publishedAgenda = await apiFetch<AgendaRecord>(bypassPage.request, `/agendas/${agenda.id}/publish`, {
        method: 'POST',
        user: CAO_USER,
      });
      expect(publishedAgenda.status).toBe('PUBLISHED');

      if (CAPTURE_TRAINING_SCREENSHOTS) {
        await bypassPage.goto(`${BASE_URL}/agendas`);
        await bypassPage.waitForLoadState('networkidle');
        await expect(bypassPage.getByText('Regular Council Agenda - April 10, 2026').first()).toBeVisible();
        await captureTrainingScreenshot(bypassPage, '02-agenda-published');
      }

      const publicAgendas = await apiFetch<AgendaRecord[]>(bypassPage.request, '/public/agendas');
      const publicAgenda = publicAgendas.find((entry) => entry.meetingId === regularMeeting.id);
      expect(publicAgenda).toBeDefined();
      expect(publicAgenda?.items.filter((item) => item.itemType === 'STAFF_REPORT')).toHaveLength(5);

      const attendees = [
        { user: MAYOR_USER, role: 'CHAIR' },
        { user: COUNCILLOR_ONE, role: 'COUNCIL_MEMBER' },
        { user: COUNCILLOR_TWO, role: 'COUNCIL_MEMBER' },
        { user: COUNCILLOR_THREE, role: 'COUNCIL_MEMBER' },
        { user: COUNCILLOR_FOUR, role: 'COUNCIL_MEMBER' },
        { user: CLERK_USER, role: 'STAFF' },
      ] as const;

      for (const attendee of attendees) {
        await apiFetch(bypassPage.request, '/attendees', {
          method: 'POST',
          user: ADMIN_USER,
          body: {
            meetingId: regularMeeting.id,
            userId: attendee.user.id,
            role: attendee.role,
            status: 'PRESENT',
            arrivedAt: '2026-04-10T17:52:00.000Z',
          },
        });
      }

      const quorum = await apiFetch<{ isQuorumMet: boolean; presentCount: number }>(
        bypassPage.request,
        `/attendees/meeting/${regularMeeting.id}/quorum`,
        { user: ADMIN_USER },
      );
      expect(quorum.presentCount).toBeGreaterThanOrEqual(4);

      const startedMeeting = await apiFetch<MeetingRecord>(bypassPage.request, `/meetings/${regularMeeting.id}/start`, {
        method: 'POST',
        user: ADMIN_USER,
      });
      expect(startedMeeting.status).toBe('IN_PROGRESS');

      const minutesAdoptionItem = publishedAgenda.items.find((item) =>
        item.title.includes('Adoption of the March 27, 2026 Regular Council Minutes'),
      );
      expect(minutesAdoptionItem).toBeDefined();

      const motionDefinitions = [
        {
          agendaItemId: sectionIds.get('Approval of Agenda'),
          title: 'Approve the April 10, 2026 regular council agenda',
          body: 'THAT Council approve the April 10, 2026 regular council agenda as circulated.',
          mover: MAYOR_USER,
          seconder: COUNCILLOR_ONE,
          votePattern: ['YEA', 'YEA', 'YEA', 'YEA', 'YEA'] as const,
          createResolution: false,
        },
        {
          agendaItemId: minutesAdoptionItem?.id,
          title: 'Adopt the March 27, 2026 regular council minutes',
          body: 'THAT Council adopt the March 27, 2026 regular council meeting minutes as presented.',
          mover: COUNCILLOR_TWO,
          seconder: COUNCILLOR_THREE,
          votePattern: ['YEA', 'YEA', 'YEA', 'YEA', 'YEA'] as const,
          createResolution: false,
        },
        {
          agendaItemId: reportAgendaItems[1]?.id,
          title: 'Adopt the asset management service level framework',
          body: reportPlans[1].recommendations,
          mover: MAYOR_USER,
          seconder: COUNCILLOR_TWO,
          votePattern: ['YEA', 'YEA', 'YEA', 'YEA', 'ABSTAIN'] as const,
          createResolution: true,
          resolutionTitle: 'Asset Management Service Level Framework Endorsed',
          isActionRequired: true,
          dueDate: '2026-06-30T00:00:00.000Z',
        },
        {
          agendaItemId: reportAgendaItems[2]?.id,
          title: 'Award the fleet replacement tender',
          body: reportPlans[2].recommendations,
          mover: COUNCILLOR_ONE,
          seconder: COUNCILLOR_FOUR,
          votePattern: ['YEA', 'YEA', 'YEA', 'NAY', 'YEA'] as const,
          createResolution: true,
          resolutionTitle: 'Fleet Replacement Tender Award Approved',
        },
        {
          agendaItemId: reportAgendaItems[3]?.id,
          title: 'Authorize phase 1 recreation accessibility improvements',
          body: reportPlans[3].recommendations,
          mover: COUNCILLOR_THREE,
          seconder: COUNCILLOR_ONE,
          votePattern: ['YEA', 'YEA', 'YEA', 'YEA', 'YEA'] as const,
          createResolution: true,
          resolutionTitle: 'Recreation Accessibility Improvements Authorized',
        },
      ] as const;

      const councilVotingOrder = [MAYOR_USER, COUNCILLOR_ONE, COUNCILLOR_TWO, COUNCILLOR_THREE, COUNCILLOR_FOUR] as const;
      const carriedMotions: MotionRecord[] = [];
      const adoptedResolutions: ResolutionRecord[] = [];

      for (let index = 0; index < motionDefinitions.length; index += 1) {
        const definition = motionDefinitions[index];
        const motion = await createMotion(bypassPage.request, {
          meetingId: regularMeeting.id,
          agendaItemId: definition.agendaItemId,
          title: definition.title,
          body: definition.body,
          moverUserId: definition.mover.id,
        });

        await apiFetch<MotionRecord>(bypassPage.request, `/motions/${motion.id}/propose`, {
          method: 'POST',
          user: definition.mover,
        });
        await apiFetch<MotionRecord>(bypassPage.request, `/motions/${motion.id}/second`, {
          method: 'POST',
          user: definition.seconder,
        });
        await apiFetch<MotionRecord>(bypassPage.request, `/motions/${motion.id}/open-debate`, {
          method: 'POST',
          user: ADMIN_USER,
        });
        await apiFetch<MotionRecord>(bypassPage.request, `/motions/${motion.id}/close-debate`, {
          method: 'POST',
          user: ADMIN_USER,
        });
        await apiFetch<MotionRecord>(bypassPage.request, `/motions/${motion.id}/call-vote`, {
          method: 'POST',
          user: ADMIN_USER,
        });

        for (let voteIndex = 0; voteIndex < councilVotingOrder.length; voteIndex += 1) {
          await apiFetch(bypassPage.request, '/votes', {
            method: 'POST',
            user: ADMIN_USER,
            body: {
              motionId: motion.id,
              councilMemberId: councilVotingOrder[voteIndex].id,
              voteValue: definition.votePattern[voteIndex],
            },
          });
        }

        const yesCount = definition.votePattern.filter((choice) => choice === 'YEA').length;
        const noCount = definition.votePattern.filter((choice) => choice === 'NAY').length;
        const abstainCount = definition.votePattern.filter((choice) => choice === 'ABSTAIN').length;
        const outcome = yesCount > noCount ? 'CARRIED' : 'DEFEATED';

        const completedMotion = await apiFetch<MotionRecord>(bypassPage.request, `/motions/${motion.id}/set-outcome`, {
          method: 'POST',
          user: ADMIN_USER,
          body: {
            status: outcome,
            resultNote:
              outcome === 'CARRIED'
                ? `Carried ${yesCount}-${noCount}-${abstainCount}.`
                : `Defeated ${yesCount}-${noCount}-${abstainCount}.`,
          },
        });

        if (completedMotion.status === 'CARRIED') {
          carriedMotions.push(completedMotion);
        }

        if (!definition.createResolution || completedMotion.status !== 'CARRIED') {
          continue;
        }

        const createdResolution = await createResolution(bypassPage.request, {
          meetingId: regularMeeting.id,
          agendaItemId: definition.agendaItemId,
          motionId: completedMotion.id,
          resolutionNumber: currentYearResolutionNumber(index + 1),
          title: definition.resolutionTitle,
          body: definition.body,
          movedBy: definition.mover.displayName,
          secondedBy: definition.seconder.displayName,
          voteFor: yesCount,
          voteAgainst: noCount,
          voteAbstain: abstainCount,
          isActionRequired: definition.isActionRequired,
          dueDate: definition.dueDate,
        });

        const persistedResolutions = await apiFetch<ResolutionRecord[]>(
          bypassPage.request,
          `/resolutions?meetingId=${encodeURIComponent(regularMeeting.id)}`,
          { user: ADMIN_USER },
        );
        const persistedResolution = persistedResolutions.find(
          (entry) => entry.resolutionNumber === createdResolution.resolutionNumber,
        );
        expect(persistedResolution).toBeDefined();

        const adoptedResolution = await apiFetch<ResolutionRecord>(bypassPage.request, `/resolutions/${persistedResolution?.id}`, {
          method: 'PATCH',
          user: CAO_USER,
          body: {
            status: 'ADOPTED',
            voteFor: yesCount,
            voteAgainst: noCount,
            voteAbstain: abstainCount,
            isActionRequired: definition.isActionRequired,
            dueDate: definition.dueDate,
          },
        });
        adoptedResolutions.push(adoptedResolution);
      }

      if (!SKIP_END_MEETING) {
        const completedMeeting = await apiFetch<MeetingRecord>(bypassPage.request, `/meetings/${regularMeeting.id}/end`, {
          method: 'POST',
          user: ADMIN_USER,
          body: { endStatus: 'COMPLETED' },
        });
        expect(completedMeeting.status).toBe('COMPLETED');
      }

      if (CAPTURE_TRAINING_SCREENSHOTS) {
        await bypassPage.goto(`${BASE_URL}/reports`);
        await bypassPage.waitForLoadState('networkidle');
        await captureTrainingScreenshot(bypassPage, '03-staff-reports-published');
      }

      const meetingMinutes = await apiFetch<MinutesRecord>(bypassPage.request, '/minutes', {
        method: 'POST',
        user: CLERK_USER,
        body: {
          meetingId: regularMeeting.id,
          isInCamera: false,
          contentJson: {
            schemaVersion: 1,
            summary: '',
            attendance: [],
            motions: [],
            votes: [],
            actionItems: [],
            notes: [],
          },
        },
      });

      await apiFetch<MinutesRecord>(bypassPage.request, `/minutes/${meetingMinutes.id}/start`, {
        method: 'POST',
        user: CLERK_USER,
      });

      const updatedMinutes = await apiFetch<MinutesRecord>(bypassPage.request, `/minutes/${meetingMinutes.id}`, {
        method: 'PATCH',
        user: CLERK_USER,
        body: {
          note: 'Populate final minutes for April 10, 2026 regular council meeting.',
          contentJson: {
            schemaVersion: 1,
            summary:
              'Council approved the April 10 agenda, adopted the previous regular council minutes, endorsed the asset management framework, awarded the fleet tender, and authorized phase 1 accessibility improvements.',
            attendance: attendees.map((entry) => ({
              id: entry.user.id,
              personName: entry.user.displayName,
              role: entry.role,
              present: true,
              arrivalAt: '2026-04-10T17:52:00.000Z',
            })),
            motions: adoptedResolutions.map((resolution, index) =>
              minutesMotionFromResolution(
                resolution,
                carriedMotions[index + 2],
                motionDefinitions[index + 2].mover,
                motionDefinitions[index + 2].seconder,
              ),
            ),
            votes: adoptedResolutions.map((resolution, index) => ({
              id: carriedMotions[index + 2].id,
              motionId: carriedMotions[index + 2].id,
              method: 'RECORDED',
              yesCount: resolution.voteFor,
              noCount: resolution.voteAgainst,
              abstainCount: resolution.voteAbstain,
              recordedVotes: councilVotingOrder.map((member, voteIndex) => ({
                personName: member.displayName,
                vote:
                  motionDefinitions[index + 2].votePattern[voteIndex] === 'YEA'
                    ? 'YES'
                    : motionDefinitions[index + 2].votePattern[voteIndex] === 'NAY'
                      ? 'NO'
                      : 'ABSTAIN',
              })),
            })),
            actionItems: [
              {
                id: randomUUID(),
                description: 'Incorporate the approved asset management service levels into 2027 capital planning materials.',
                owner: 'Engineering and Public Works',
                dueDate: '2026-06-30T00:00:00.000Z',
                status: 'OPEN',
              },
            ],
            notes: [
              'Agenda package was approved by Director and CAO before publication.',
              'Five staff reports were published with local attachments because SharePoint was not configured in the test environment.',
              'Meeting concluded in public session with quorum maintained throughout proceedings.',
            ],
          },
        },
      });

      expect(updatedMinutes.contentJson.attendance).toHaveLength(6);
      expect(updatedMinutes.contentJson.motions).toHaveLength(3);
      expect(updatedMinutes.contentJson.votes).toHaveLength(3);

      const finalizedMinutes = await apiFetch<MinutesRecord>(bypassPage.request, `/minutes/${meetingMinutes.id}/finalize`, {
        method: 'POST',
        user: CLERK_USER,
      });
      expect(finalizedMinutes.status).toBe('FINALIZED');

      const adoptedMinutes = await apiFetch<MinutesRecord>(bypassPage.request, `/minutes/${meetingMinutes.id}/adopt`, {
        method: 'POST',
        user: CAO_USER,
      });
      expect(adoptedMinutes.status).toBe('ADOPTED');

      const publishedMinutes = await apiFetch<MinutesRecord>(bypassPage.request, `/minutes/${meetingMinutes.id}/publish`, {
        method: 'POST',
        user: CAO_USER,
      });
      expect(publishedMinutes.status).toBe('PUBLISHED');

      if (CAPTURE_TRAINING_SCREENSHOTS) {
        await bypassPage.goto(`${BASE_URL}/minutes`);
        await bypassPage.waitForLoadState('networkidle');
        await captureTrainingScreenshot(bypassPage, '04-minutes-published');

        await bypassPage.goto(`${BASE_URL}/resolutions`);
        await bypassPage.waitForLoadState('networkidle');
        await captureTrainingScreenshot(bypassPage, '05-resolutions-register');
      }

      expect(publishedReports).toHaveLength(5);
      expect(publishedReports.every((report) => report.workflowStatus === 'PUBLISHED')).toBeTruthy();

      const publicMinutes = await apiFetch<MinutesRecord[]>(bypassPage.request, '/public/minutes');
      expect(publicMinutes.some((record) => record.meetingId === regularMeeting.id)).toBeTruthy();

      const publicResolutions = await apiFetch<ResolutionRecord[]>(bypassPage.request, '/public/resolutions');
      expect(publicResolutions.filter((resolution) => resolution.meetingId === regularMeeting.id)).toHaveLength(3);

      const publicPackages = await apiFetch<PublicMeetingPackage[]>(bypassPage.request, '/public/packages?q=April%2010%2C%202026');
      const aprilPackage = publicPackages.find((pkg) => pkg.meetingId === regularMeeting.id);
      expect(aprilPackage).toBeDefined();
      expect(aprilPackage?.resolutions).toHaveLength(3);
      expect(aprilPackage?.minutes?.status).toBe('PUBLISHED');

      await bypassPage.goto(`${BASE_URL}/public`);
      await bypassPage.waitForLoadState('networkidle');

      await expect(bypassPage.getByRole('heading', { name: 'Public Portal' })).toBeVisible();
      await expect(bypassPage.getByText('Regular Council Meeting - April 10, 2026').first()).toBeVisible();
      await expect(bypassPage.getByRole('table', { name: 'Public resolutions' })).toContainText(adoptedResolutions[0].resolutionNumber);
      await expect(bypassPage.getByRole('table', { name: 'Public resolutions' })).toContainText(
        adoptedResolutions[adoptedResolutions.length - 1].resolutionNumber,
      );
      await expect(bypassPage.getByRole('heading', { name: 'Meeting Packages' })).toBeVisible();
      await expect(bypassPage.getByRole('table', { name: 'Public meeting packages' })).toContainText('Regular Council Meeting - April 10, 2026');
      await captureTrainingScreenshot(bypassPage, '06-public-portal-results');
    } finally {
      if (workflowId && !KEEP_TRAINING_DATA) {
        try {
          await apiFetch<{ ok: true }>(bypassPage.request, `/workflows/configurations/${workflowId}`, {
            method: 'DELETE',
            user: ADMIN_USER,
          });
        } catch {
          // Preserve the original test failure when workflow cleanup is not possible.
        }
      }
      if (!KEEP_TRAINING_DATA) {
        for (const meetingId of createdMeetingIds.reverse()) {
          await cleanupMeeting(bypassPage.request, meetingId);
        }
      }
    }
  });
});
