import { chromium, ConsoleMessage, Page, Request, Response } from '@playwright/test';

const MEETING_ID = '911e47b7-87ec-4ce3-a48d-af49637f3468';
const BASE_URL = 'http://localhost:5173';
const TARGET_URL = `${BASE_URL}/public/live-meeting/${MEETING_ID}`;

async function inspect() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const consoleErrors: string[] = [];
  const consoleWarnings: string[] = [];
  const allRequests: { url: string; status: number; type: string }[] = [];
  const failedRequests: { url: string; status: number; failure: string | null }[] = [];

  // Capture console messages
  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    } else if (msg.type() === 'warning') {
      consoleWarnings.push(msg.text());
    }
  });

  // Capture all requests
  page.on('request', (request: Request) => {
    allRequests.push({
      url: request.url(),
      status: 0,
      type: request.resourceType()
    });
  });

  // Capture responses
  page.on('response', (response: Response) => {
    const req = allRequests.find(r => r.url === response.url());
    if (req) {
      req.status = response.status();
    }
    if (response.status() >= 400) {
      failedRequests.push({
        url: response.url(),
        status: response.status(),
        failure: response.statusText()
      });
    }
  });

  page.on('requestfailed', (request: Request) => {
    failedRequests.push({
      url: request.url(),
      status: 0,
      failure: request.failure()?.errorText || null
    });
  });

  console.log(`Navigating to ${TARGET_URL}...`);
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Wait for React to render and any polling/websockets to settle
  await page.waitForTimeout(8000);

  const title = await page.title();

  // Get displayState by checking React state (if accessible)
  const reactState = await page.evaluate(() => {
    // Try to find React internal state
    const root = document.getElementById('root');
    if (!root) return null;
    
    // @ts-ignore
    const keys = Object.keys(root).filter(k => k.startsWith('__react') || k.startsWith('_react'));
    return { reactKeys: keys.slice(0, 5) };
  });

  // Check API endpoint directly
  const apiResponse = await page.evaluate(async (meetingId) => {
    try {
      const resp = await fetch(`/api/meeting-display/public/state?meetingId=${meetingId}`);
      const data = await resp.json();
      return { status: resp.status, ok: resp.ok, data: JSON.stringify(data).substring(0, 1000) };
    } catch (e) {
      return { status: 0, ok: false, error: String(e) };
    }
  }, MEETING_ID);

  // Check presentation content endpoint
  const contentResponse = await page.evaluate(async (meetingId) => {
    try {
      const resp = await fetch(`/api/meeting-display/public/presentation-content?meetingId=${meetingId}`);
      return { status: resp.status, ok: resp.ok, contentType: resp.headers.get('content-type') };
    } catch (e) {
      return { status: 0, ok: false, error: String(e) };
    }
  }, MEETING_ID);

  // Get full body HTML
  const bodyHTML = await page.evaluate(() => document.body.innerHTML);

  // Check canvas (which should exist in DOM but might be hidden)
  const canvasInfo = await page.evaluate(() => {
    const canvas = document.querySelector('canvas.presentation-screen-canvas');
    if (!canvas) return { exists: false };
    const style = getComputedStyle(canvas);
    const rect = canvas.getBoundingClientRect();
    return {
      exists: true,
      display: style.display,
      visibility: style.visibility,
      opacity: style.opacity,
      width: canvas.width,
      height: canvas.height,
      cssWidth: style.width,
      cssHeight: style.height,
      boundingBox: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      inDOM: document.contains(canvas)
    };
  });

  // Check presentation-frame
  const frameInfo = await page.evaluate(() => {
    const frame = document.querySelector('.presentation-screen-stage');
    if (!frame) return { exists: false };
    const style = getComputedStyle(frame);
    const rect = frame.getBoundingClientRect();
    return {
      exists: true,
      display: style.display,
      visibility: style.visibility,
      opacity: style.opacity,
      boundingBox: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
      childCount: frame.children.length
    };
  });

  await browser.close();

  // Print report
  console.log('\n========== DETAILED INSPECTION REPORT ==========\n');
  console.log(`URL: ${TARGET_URL}`);
  console.log(`Title: ${title}`);
  console.log(`React internal keys: ${JSON.stringify(reactState)}`);

  console.log('\n--- API: /api/meeting-display/public/state ---');
  console.log(`Status: ${apiResponse.status}`);
  console.log(`OK: ${apiResponse.ok}`);
  if (apiResponse.data) console.log(`Data: ${apiResponse.data}`);
  if (apiResponse.error) console.log(`Error: ${apiResponse.error}`);

  console.log('\n--- API: /api/meeting-display/public/presentation-content ---');
  console.log(`Status: ${contentResponse.status}`);
  console.log(`OK: ${contentResponse.ok}`);
  if (contentResponse.contentType) console.log(`Content-Type: ${contentResponse.contentType}`);
  if (contentResponse.error) console.log(`Error: ${contentResponse.error}`);

  console.log('\n--- CONSOLE ERRORS ---');
  if (consoleErrors.length === 0) {
    console.log('No console errors');
  } else {
    consoleErrors.forEach(err => console.log(`ERROR: ${err}`));
  }

  console.log('\n--- FAILED REQUESTS ---');
  if (failedRequests.length === 0) {
    console.log('No failed requests');
  } else {
    failedRequests.forEach(req => {
      console.log(`FAILED: ${req.url} (${req.status}) - ${req.failure}`);
    });
  }

  console.log('\n--- ALL NETWORK REQUESTS (API-related) ---');
  allRequests
    .filter(r => r.url.includes('/api/'))
    .forEach(req => {
      console.log(`${req.type}: ${req.url} (status: ${req.status})`);
    });

  console.log('\n--- CANVAS ELEMENT ---');
  console.log(JSON.stringify(canvasInfo, null, 2));

  console.log('\n--- PRESENTATION FRAME ---');
  console.log(JSON.stringify(frameInfo, null, 2));

  console.log('\n--- BODY HTML ---');
  console.log(bodyHTML);

  console.log('\n========== END REPORT ==========\n');
}

inspect().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Inspection failed:', err);
  process.exit(1);
});
