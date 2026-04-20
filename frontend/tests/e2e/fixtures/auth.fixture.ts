import { test as base, type Page } from '@playwright/test';

export type AuthBypassUser = {
  oid?: string;
  email?: string;
  displayName?: string;
  roles?: string[];
  permissions?: string[];
};

const ADMIN_BYPASS_USER: AuthBypassUser = {
  oid: 'e2e-test-user',
  email: 'e2e@municipality.local',
  displayName: 'E2E Test Admin',
  roles: ['ADMIN'],
  permissions: [
    'meeting.read', 'meeting.read.in_camera', 'meeting.write', 'meeting.start', 'meeting.end', 'meeting.publish',
    'agenda.read', 'agenda.write', 'agenda.publish',
    'minutes.read', 'minutes.write', 'minutes.publish', 'minutes.adopt',
    'bylaw.read', 'bylaw.write',
    'motion.propose', 'motion.second', 'motion.open_debate', 'motion.close_debate', 'motion.call',
    'vote.record',
    'attendee.read', 'attendee.write',
    'report.submit', 'report.approve.director', 'report.approve.cao',
    'templates.manage',
    'public.publish', 'resolution.manage', 'action.manage',
    'workflow.execute',
  ],
};

type TestFixtures = {
  bypassUser: AuthBypassUser;
  bypassPage: Page;
};

export const test = base.extend<TestFixtures>({
  bypassUser: ADMIN_BYPASS_USER,
  bypassPage: async ({ page, bypassUser }, use) => {
    await page.goto('/');
    await page.evaluate(
      (userData) => {
        localStorage.clear();
        sessionStorage.clear();
        localStorage.setItem('cmms.dev_bypass', 'true');
        if (userData) {
          localStorage.setItem('cmms.dev_bypass_user', JSON.stringify(userData));
        }
      },
      bypassUser,
    );
    await page.reload();
    await page.waitForLoadState('networkidle');
    await use(page);
  },
});

export { expect } from '@playwright/test';
