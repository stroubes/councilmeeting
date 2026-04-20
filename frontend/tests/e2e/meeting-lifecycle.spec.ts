import { test, expect, type Page } from './fixtures/auth.fixture';
import type { MeetingRecord } from '../../src/api/types/meeting.types';
import type { MinutesRecord } from '../../src/api/types/minutes.types';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000/api';
const TINY_PDF_BASE64 =
  'JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCAzMDAgMTQ0XSAvUmVzb3VyY2VzIDw8IC9Gb250IDw8IC9GMSA1IDAgUiA+PiA+PiAvQ29udGVudHMgNCAwIFIgPj4KZW5kb2JqCjQgMCBvYmoKPDwgL0xlbmd0aCA0NCA+PgpzdHJlYW0KQlQgL0YxIDI0IFRmIDcyIDcyIFRkIChIZWxsbyBDTU1TKSBUaiBFVAplbmRzdHJlYW0KZW5kb2JqCjUgMCBvYmoKPDwgL1R5cGUgL0ZvbnQgL1N1YnR5cGUgL1R5cGUxIC9CYXNlRm9udCAvSGVsdmV0aWNhID4+CmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA1OCAwMDAwMCBuIAowMDAwMDAwMTE1IDAwMDAwIG4gCjAwMDAwMDAyNDEgMDAwMDAgbiAKMDAwMDAwMDMzNSAwMDAwMCBuIAp0cmFpbGVyCjw8IC9Sb290IDEgMCBSIC9TaXplIDYgPj4Kc3RhcnR4cmVmCjQwNQolJUVPRg==';

const PERMISSIONS = 'meeting.read,meeting.read.in_camera,meeting.write,agenda.read,agenda.write,minutes.read,minutes.write,minutes.publish,minutes.adopt,bylaw.read,bylaw.write,vote.write,attendee.read,attendee.write,workflow.execute';

async function apiFetch<T>(request: APIRequestContext, path: string, options?: RequestInit): Promise<T> {
  const method = options?.method ?? 'GET';
  const csrfToken = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-CMMS-CSRF': csrfToken,
    'X-Dev-Bypass': 'true',
    'X-Dev-User-Oid': 'e2e-test-user',
    'X-Dev-User-Email': 'e2e@municipality.local',
    'X-Dev-User-Name': 'E2E Test Admin',
    'X-Dev-Roles': 'ADMIN',
    'X-Dev-Permissions': PERMISSIONS,
  };

  const response = await request.fetch(`${API_BASE}${path}`, {
    method,
    headers,
    data: options?.body ? JSON.parse(options.body as string) : undefined,
  });

  if (!response.ok()) {
    const bodyText = await response.text();
    throw new Error(`API ${method} ${path} failed ${response.status()}: ${bodyText}`);
  }

  return response.json() as Promise<T>;
}

async function createMeeting(page: Page, title: string, meetingTypeCode: string, isInCamera: boolean): Promise<MeetingRecord> {
  const startsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  return apiFetch<MeetingRecord>(page.request, '/meetings', {
    method: 'POST',
    body: JSON.stringify({
      title,
      meetingTypeCode,
      startsAt,
      location: 'Council Chamber',
      isPublic: !isInCamera,
    }),
  });
}

async function createMinutes(page: Page, meetingId: string, isInCamera: boolean): Promise<MinutesRecord> {
  return apiFetch<MinutesRecord>(page.request, '/minutes', {
    method: 'POST',
    body: JSON.stringify({
      meetingId,
      isInCamera,
      contentJson: {
        schemaVersion: 1,
        summary: '',
        attendance: [],
        motions: [],
        votes: [],
        actionItems: [],
        notes: [],
      },
    }),
  });
}

async function createPresentation(page: Page, meetingId: string) {
  return apiFetch<{ id: string; pageCount: number }>(page.request, '/presentations', {
    method: 'POST',
    body: JSON.stringify({
      meetingId,
      title: 'E2E Presentation Deck',
      fileName: 'e2e-presentation.pdf',
      mimeType: 'application/pdf',
      contentBase64: TINY_PDF_BASE64,
    }),
  });
}

async function cleanupMeeting(page: Page, meetingId: string): Promise<void> {
  try {
    await apiFetch(page.request, `/meetings/${meetingId}`, { method: 'DELETE' });
  } catch {
    // ignore cleanup errors
  }
}

test.describe('Full Meeting Lifecycle', () => {
  // auth bypass is handled by the bypassPage fixture

  test('unauthenticated user is redirected to login', async ({ page }) => {
    const freshContext = await page.context().newPage();
    await freshContext.goto(`${BASE_URL}/dashboard`);
    await expect(freshContext).toHaveURL(/\/login/);
    await freshContext.close();
  });

  test('authenticated user can access dashboard', async ({ bypassPage }) => {
    await bypassPage.goto('/dashboard');
    await bypassPage.waitForLoadState('networkidle');
    await expect(bypassPage.locator('h1:has-text("Dashboard")')).toBeVisible({ timeout: 10_000 });
  });

  test('sidebar navigation links are present', async ({ bypassPage }) => {
    await bypassPage.goto('/dashboard');
    await bypassPage.waitForLoadState('networkidle');

    await expect(bypassPage.locator('text=Meetings').first()).toBeVisible();
    await expect(bypassPage.locator('text=Agendas').first()).toBeVisible();
    await expect(bypassPage.locator('text=Minutes').first()).toBeVisible();
  });

  test('minutes register shows empty state when no minutes exist', async ({ bypassPage }) => {
    await bypassPage.goto('/minutes');
    await bypassPage.waitForLoadState('networkidle');
    await expect(bypassPage.locator('.empty-state').filter({ hasText: 'No minutes records yet' }).first()).toBeVisible({ timeout: 10_000 });
  });

  test('minutes lifecycle: create → start → finalize → adopt → publish', async ({ bypassPage }) => {
    const meeting = await createMeeting(bypassPage, 'E2E Test Council Meeting', 'COUNCIL', false);
    try {
      await bypassPage.goto('/minutes');
      await bypassPage.waitForLoadState('networkidle');

      await bypassPage.getByRole('button', { name: 'Create Minutes' }).click();
      await bypassPage.waitForSelector('.drawer-root', { state: 'visible' });

      await bypassPage.selectOption('#create-minutes-meeting', meeting.id);
      await bypassPage.getByRole('button', { name: 'Create Minutes' }).last().click();

      await bypassPage.waitForLoadState('networkidle');
      await expect(bypassPage.locator('.toast-success').first()).toBeVisible({ timeout: 10_000 });

      const table = bypassPage.locator('.data-table tbody');
      await expect(table.locator('tr').first()).toBeVisible({ timeout: 5_000 });
      const statusCell = table.locator('tr').first().locator('td').nth(2);
      await expect(statusCell).toContainText('Draft', { timeout: 5_000 });

      await bypassPage.waitForLoadState('networkidle');
      await bypassPage.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find(b => b.textContent?.includes('Begin Session'));
        if (btn) btn.click();
      });
      await bypassPage.waitForLoadState('networkidle');
      await expect(bypassPage.locator('.toast-success').first()).toBeVisible({ timeout: 10_000 });

      await bypassPage.waitForLoadState('networkidle');
      await bypassPage.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find(b => b.textContent?.includes('Finalize Draft'));
        if (btn) btn.click();
      });
      await bypassPage.waitForLoadState('networkidle');
      await expect(bypassPage.locator('.toast-success').first()).toBeVisible({ timeout: 10_000 });

      await bypassPage.waitForLoadState('networkidle');
      await bypassPage.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const adoptBtn = buttons.find(b => b.textContent?.includes('Adopt Minutes'));
        if (adoptBtn) adoptBtn.click();
      });
      await bypassPage.waitForLoadState('networkidle');
      await expect(bypassPage.locator('.toast-success').first()).toBeVisible({ timeout: 10_000 });

      await bypassPage.waitForLoadState('networkidle');
      await bypassPage.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const publishBtn = buttons.find(b => b.textContent?.includes('Publish'));
        if (publishBtn) publishBtn.click();
      });
      await bypassPage.waitForLoadState('networkidle');
      await expect(bypassPage.locator('.toast-success').first()).toBeVisible({ timeout: 10_000 });
    } finally {
      await cleanupMeeting(bypassPage, meeting.id);
    }
  });

  test('minutes register has in-camera filter toggle', async ({ bypassPage }) => {
    await bypassPage.goto('/minutes');
    await bypassPage.waitForLoadState('networkidle');
    const toggle = bypassPage.locator('text=Show in-camera minutes only');
    await expect(toggle).toBeVisible();
  });

  test('meeting details shows in-camera button for in-camera meeting', async ({ bypassPage }) => {
    const meeting = await createMeeting(bypassPage, 'E2E In-Camera Session', 'IN_CAMERA', true);
    try {
      await bypassPage.goto(`/meetings/${meeting.id}`);
      await bypassPage.waitForLoadState('networkidle');

      const recordBtn = bypassPage.locator('button:has-text("Record In-Camera Minutes")');
      await expect(recordBtn).toBeVisible({ timeout: 10_000 });
    } finally {
      await cleanupMeeting(bypassPage, meeting.id);
    }
  });

  test('meeting details does NOT show in-camera button for public meeting', async ({ bypassPage }) => {
    const meeting = await createMeeting(bypassPage, 'E2E Public Council Meeting', 'COUNCIL', false);
    try {
      await bypassPage.goto(`/meetings/${meeting.id}`);
      await bypassPage.waitForLoadState('networkidle');

      await bypassPage.waitForTimeout(2_000);
      const recordBtn = bypassPage.locator('button:has-text("Record In-Camera Minutes")');
      await expect(recordBtn).not.toBeVisible();
    } finally {
      await cleanupMeeting(bypassPage, meeting.id);
    }
  });

  test('public live meeting screen renders presentation mode after clerk enables it', async ({ bypassPage }) => {
    const meeting = await createMeeting(bypassPage, 'E2E Presentation Display Meeting', 'COUNCIL', false);

    try {
      const presentation = await createPresentation(bypassPage, meeting.id);
      await apiFetch(bypassPage.request, `/meeting-display/${meeting.id}/set-presentation`, {
        method: 'POST',
        body: JSON.stringify({ presentationId: presentation.id }),
      });
      await apiFetch(bypassPage.request, `/meeting-display/${meeting.id}/show-presentation`, {
        method: 'POST',
        body: JSON.stringify({}),
      });

      await bypassPage.goto(`/public/live-meeting/${meeting.id}`);
      await expect(bypassPage.getByText('Presentation Mode')).toBeVisible({ timeout: 10_000 });
      await expect(bypassPage.getByText('Presentation - Slide 1 of 1')).toBeVisible({ timeout: 10_000 });
      await expect(bypassPage.locator('.presentation-screen-canvas')).toBeVisible({ timeout: 10_000 });
      await expect(bypassPage.getByText('Awaiting Presentation')).not.toBeVisible();
    } finally {
      await cleanupMeeting(bypassPage, meeting.id);
    }
  });

  test('public live meeting screen stays stable when clerk advances slide', async ({ bypassPage }) => {
    const meeting = await createMeeting(bypassPage, 'E2E Slide Advance Meeting', 'COUNCIL', false);

    try {
      const presentation = await createPresentation(bypassPage, meeting.id);
      await apiFetch(bypassPage.request, `/meeting-display/${meeting.id}/set-presentation`, {
        method: 'POST',
        body: JSON.stringify({ presentationId: presentation.id }),
      });
      await apiFetch(bypassPage.request, `/meeting-display/${meeting.id}/show-presentation`, {
        method: 'POST',
        body: JSON.stringify({}),
      });

      await bypassPage.goto(`/public/live-meeting/${meeting.id}`);
      await expect(bypassPage.getByText('Presentation - Slide 1 of 1')).toBeVisible({ timeout: 10_000 });

      await apiFetch(bypassPage.request, `/meeting-display/${meeting.id}/presentation/next`, {
        method: 'POST',
        body: JSON.stringify({}),
      });

      await expect(bypassPage.getByText('Presentation Mode')).toBeVisible({ timeout: 5_000 });
      await expect(bypassPage.locator('.presentation-screen-canvas')).toBeVisible({ timeout: 5_000 });
    } finally {
      await cleanupMeeting(bypassPage, meeting.id);
    }
  });

  test('record in-camera minutes creates a minutes record', async ({ bypassPage }) => {
    const meeting = await createMeeting(bypassPage, 'E2E In-Camera Minutes Test', 'IN_CAMERA', true);
    try {
      await bypassPage.goto(`/meetings/${meeting.id}`);
      await bypassPage.waitForLoadState('networkidle');

      await bypassPage.locator('button:has-text("Record In-Camera Minutes")').click();
      await bypassPage.waitForLoadState('networkidle');
      await expect(bypassPage.locator('.toast-success').first()).toBeVisible({ timeout: 10_000 });

      const minutes: MinutesRecord[] = await apiFetch(bypassPage.request, '/minutes?meetingId=' + meeting.id);
      expect(minutes.some((m) => m.isInCamera && m.meetingId === meeting.id)).toBeTruthy();
    } finally {
      await cleanupMeeting(bypassPage, meeting.id);
    }
  });

  test('minutes rich text editor opens on edit click', async ({ bypassPage }) => {
    const uniqueTitle = `E2E Rich Text Test Meeting ${Date.now()}`;
    const meeting = await createMeeting(bypassPage, uniqueTitle, 'COUNCIL', false);
    await createMinutes(bypassPage, meeting.id, false);
    try {
      await bypassPage.goto('/minutes');
      await bypassPage.waitForLoadState('networkidle');

      const table = bypassPage.locator('.data-table tbody');
      await table.locator('tr').filter({ hasText: uniqueTitle }).locator('button:has-text("Edit")').click();

      await bypassPage.waitForSelector('.drawer-root');
      const editor = bypassPage.locator('.ProseMirror');
      await expect(editor).toBeVisible({ timeout: 5_000 });
    } finally {
      await cleanupMeeting(bypassPage, meeting.id);
    }
  });

  test('meetings list page loads and shows meeting register', async ({ bypassPage }) => {
    await bypassPage.goto('/meetings');
    await bypassPage.waitForLoadState('networkidle');
    await expect(bypassPage.locator('text=Meeting Register')).toBeVisible({ timeout: 10_000 });
    await expect(bypassPage.locator('button:has-text("New Meeting")')).toBeVisible();
  });

  test('agendas list page loads', async ({ bypassPage }) => {
    await bypassPage.goto('/agendas');
    await bypassPage.waitForLoadState('networkidle');
    await expect(bypassPage.getByRole('heading', { name: /Agenda/i }).first()).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Agenda Workflow', () => {
  let meetingId: string;

  test.beforeEach(async ({ bypassPage }) => {
    const meeting = await createMeeting(bypassPage, 'E2E Agenda Workflow Test', 'COUNCIL', false);
    meetingId = meeting.id;
  });

  test.afterEach(async ({ bypassPage }) => {
    if (meetingId) {
      await cleanupMeeting(bypassPage, meetingId);
    }
  });

  test('can create agenda for a meeting', async ({ bypassPage }) => {
    await bypassPage.goto('/agendas');
    await bypassPage.waitForLoadState('networkidle');

    await bypassPage.locator('button:has-text("New Agenda")').click();
    await bypassPage.waitForSelector('.drawer-root', { state: 'visible' });

    await bypassPage.fill('#create-agenda-title', 'E2E Test Agenda');
    await bypassPage.selectOption('#create-agenda-meeting', meetingId);

    await bypassPage.locator('button:has-text("Create Agenda")').click();
    await bypassPage.waitForLoadState('networkidle');

    await expect(bypassPage.locator('.toast-success').first()).toBeVisible({ timeout: 10_000 });
  });
});
