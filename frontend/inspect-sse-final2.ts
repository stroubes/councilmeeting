import { chromium, Page, Request, Response } from '@playwright/test';

const MEETING_ID = '911e47b7-87ec-4ce3-a48d-af49637f3468';
const TARGET_URL = `http://localhost:5173/public/live-meeting/${MEETING_ID}`;

async function inspect() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  const networkLog: { time: number; type: string; url: string; status?: number }[] = [];
  let startTime = Date.now();

  page.on('request', (req) => {
    if (req.url().includes('localhost:3000')) {
      networkLog.push({
        time: Date.now() - startTime,
        type: 'REQUEST',
        url: req.url()
      });
    }
  });

  page.on('response', (resp) => {
    if (resp.url().includes('localhost:3000')) {
      const entry = networkLog.find(e => e.url === resp.url());
      if (entry) entry.status = resp.status();
      console.log(`[${Date.now() - startTime}ms] RESPONSE: ${resp.url()} status=${resp.status()}`);
    }
  });

  page.on('requestfailed', (req) => {
    if (req.url().includes('localhost:3000')) {
      networkLog.push({
        time: Date.now() - startTime,
        type: 'FAILED',
        url: req.url(),
        status: -1
      });
      console.log(`[${Date.now() - startTime}ms] FAILED: ${req.url()} ${req.failure()?.errorText}`);
    }
  });

  console.log(`\n=== NAVIGATING TO ${TARGET_URL} ===\n`);
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Wait for network to settle
  await page.waitForTimeout(5000);

  console.log('\n=== SUMMARY ===');
  
  // Check if SSE request succeeded
  const sseReq = networkLog.find(e => e.url.includes('/stream'));
  console.log('SSE Stream:');
  console.log('  Request made:', !!sseReq);
  console.log('  Response status:', sseReq?.status);
  
  // Check if state request was made
  const stateReq = networkLog.find(e => e.url.includes('/state'));
  console.log('State API:');
  console.log('  Request made:', !!stateReq);
  console.log('  Response status:', stateReq?.status);

  // Final DOM state
  const dom = await page.evaluate(() => ({
    mode: document.querySelector('.motion-screen-mode')?.textContent,
    h2: document.querySelector('.motion-screen-card h2')?.textContent
  }));
  console.log('\nDOM State:', dom.mode, '/', dom.h2);

  // The key question: did SSE onopen fire?
  const sseOpened = await page.evaluate(() => {
    return new Promise((resolve) => {
      const es = new EventSource('http://localhost:3000/api/meeting-display/public/stream?meetingId=911e47b7-87ec-4ce3-a48d-af49637f3468');
      const timeout = setTimeout(() => {
        resolve({ event: 'timeout', readyState: es.readyState });
        es.close();
      }, 3000);
      
      es.onopen = () => {
        clearTimeout(timeout);
        resolve({ event: 'onopen', readyState: es.readyState });
        es.close();
      };
      es.onerror = () => {
        clearTimeout(timeout);
        resolve({ event: 'onerror', readyState: es.readyState });
        es.close();
      };
    });
  });
  console.log('\nFresh SSE test from same page:', JSON.stringify(sseOpened));

  await browser.close();
}

inspect().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
