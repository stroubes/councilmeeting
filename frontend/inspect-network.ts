import { chromium, Page, Request, Response } from '@playwright/test';

const MEETING_ID = '911e47b7-87ec-4ce3-a48d-af49637f3468';
const TARGET_URL = `http://localhost:5173/public/live-meeting/${MEETING_ID}`;

async function inspect() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  // Track all network requests and responses
  const networkLog: { time: number; type: string; url: string; details: string }[] = [];
  let startTime = Date.now();

  page.on('request', (req) => {
    if (req.url().includes('meeting-display')) {
      networkLog.push({
        time: Date.now() - startTime,
        type: 'REQUEST',
        url: req.url(),
        details: `method=${req.method()}`
      });
    }
  });

  page.on('response', (resp) => {
    if (resp.url().includes('meeting-display')) {
      networkLog.push({
        time: Date.now() - startTime,
        type: 'RESPONSE',
        url: resp.url(),
        details: `status=${resp.status()}`
      });
    }
  });

  page.on('requestfailed', (req) => {
    if (req.url().includes('meeting-display')) {
      networkLog.push({
        time: Date.now() - startTime,
        type: 'FAILED',
        url: req.url(),
        details: req.failure()?.errorText || 'unknown'
      });
    }
  });

  console.log(`Navigating to ${TARGET_URL}...`);
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Wait for network to settle
  await page.waitForTimeout(3000);

  console.log('\n=== NETWORK LOG ===');
  networkLog.forEach(entry => {
    console.log(`[${entry.time}ms] ${entry.type}: ${entry.url}`);
    console.log(`    ${entry.details}`);
  });

  // Now check EventSource state
  const esState = await page.evaluate(() => {
    const es = (window as any).__esInstance;
    if (!es) return { error: 'No ES instance found' };
    return {
      readyState: es.readyState,
      url: es.url
    };
  });
  
  console.log('\n=== EVENT SOURCE STATE ===');
  console.log(JSON.stringify(esState, null, 2));

  await browser.close();
}

inspect().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
