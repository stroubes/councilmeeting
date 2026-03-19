import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const baseUrl = process.env.BASE_URL ?? 'http://127.0.0.1:4173';
const outputDir = new URL('../screenshots/', import.meta.url).pathname;

async function capture(page, route, fileName) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${outputDir}${fileName}`, fullPage: true });
}

async function main() {
  await mkdir(outputDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  const publicContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const publicPage = await publicContext.newPage();
  await capture(publicPage, '/login', '01-login.png');
  await publicContext.close();

  const authContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await authContext.addInitScript(() => {
    localStorage.setItem('cmms.access_token', 'dev-bypass-token');
  });
  const authPage = await authContext.newPage();

  await capture(authPage, '/dashboard', '02-dashboard.png');
  await capture(authPage, '/meetings', '03-meetings.png');
  await capture(authPage, '/agendas', '04-agendas.png');
  await capture(authPage, '/reports', '05-reports.png');
  await capture(authPage, '/approvals/director', '06-director-queue.png');
  await capture(authPage, '/approvals/cao', '07-cao-queue.png');
  await capture(authPage, '/public', '08-public-portal.png');
  await capture(authPage, '/in-camera', '09-in-camera.png');

  await authContext.close();
  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
