import { chromium, ConsoleMessage, Page, Request, Response } from '@playwright/test';

const MEETING_ID = '911e47b7-87ec-4ce3-a48d-af49637f3468';
const BASE_URL = 'http://localhost:5173';
const API_BASE_URL = 'http://localhost:3000/api';
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

  // Check API endpoint DIRECTLY (not through Vite proxy)
  console.log('\n--- CHECKING API ENDPOINTS DIRECTLY ---');
  
  const apiStateResponse = await page.evaluate(async (meetingId) => {
    const API = 'http://localhost:3000/api';
    try {
      const resp = await fetch(`${API}/meeting-display/public/state?meetingId=${meetingId}`);
      const text = await resp.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }
      return { 
        status: resp.status, 
        ok: resp.ok, 
        contentType: resp.headers.get('content-type'),
        isJson: !!data,
        dataPreview: text.substring(0, 500)
      };
    } catch (e) {
      return { status: 0, ok: false, error: String(e) };
    }
  }, MEETING_ID);

  console.log('State API:', JSON.stringify(apiStateResponse, null, 2));

  // Check presentation content endpoint
  const contentResponse = await page.evaluate(async (meetingId) => {
    const API = 'http://localhost:3000/api';
    try {
      const resp = await fetch(`${API}/meeting-display/public/presentation-content?meetingId=${meetingId}`);
      const text = await resp.text();
      return { 
        status: resp.status, 
        ok: resp.ok, 
        contentType: resp.headers.get('content-type'),
        preview: text.substring(0, 200)
      };
    } catch (e) {
      return { status: 0, ok: false, error: String(e) };
    }
  }, MEETING_ID);

  console.log('Presentation Content API:', JSON.stringify(contentResponse, null, 2));

  // Check stream endpoint (SSE)
  const streamResponse = await page.evaluate(async (meetingId) => {
    const API = 'http://localhost:3000/api';
    try {
      const resp = await fetch(`${API}/meeting-display/public/stream?meetingId=${meetingId}`, {
        headers: { 'Accept': 'text/event-stream' }
      });
      return { 
        status: resp.status, 
        ok: resp.ok, 
        contentType: resp.headers.get('content-type')
      };
    } catch (e) {
      return { status: 0, ok: false, error: String(e) };
    }
  }, MEETING_ID);

  console.log('Stream API:', JSON.stringify(streamResponse, null, 2));

  // Check public meetings list
  const meetingsResponse = await page.evaluate(async () => {
    const API = 'http://localhost:3000/api';
    try {
      const resp = await fetch(`${API}/public/meetings`);
      const data = await resp.json();
      return { 
        status: resp.status, 
        ok: resp.ok, 
        count: Array.isArray(data) ? data.length : 'N/A',
        meetings: Array.isArray(data) ? data.map((m: any) => ({ id: m.id, title: m.title })).slice(0, 3) : null
      };
    } catch (e) {
      return { status: 0, ok: false, error: String(e) };
    }
  });

  console.log('Public Meetings API:', JSON.stringify(meetingsResponse, null, 2));

  // Get displayState info from React component
  const displayState = await page.evaluate(() => {
    // Try to access React internal state through the root element
    const root = document.getElementById('root');
    // @ts-ignore
    const keys = Object.keys(root || {}).filter(k => k.startsWith('__react'));
    
    // Check for any data attributes that might reveal state
    const modeEl = document.querySelector('[class*="mode"]');
    const statusEl = document.querySelector('[class*="status"]');
    
    return {
      reactKeys: keys,
      modeText: modeEl?.textContent,
      statusText: statusEl?.textContent
    };
  });

  console.log('React State Info:', JSON.stringify(displayState, null, 2));

  // Get body HTML to see what's actually rendered
  const bodyHTML = await page.evaluate(() => document.body.innerHTML.substring(0, 2000));

  // Check for canvas (may exist but be hidden)
  const canvasInfo = await page.evaluate(() => {
    const canvases = document.querySelectorAll('canvas');
    return Array.from(canvases).map(canvas => {
      const style = getComputedStyle(canvas);
      const rect = canvas.getBoundingClientRect();
      return {
        className: canvas.className,
        display: style.display,
        visibility: style.visibility,
        width: canvas.width,
        height: canvas.height,
        cssWidth: style.width,
        cssHeight: style.height,
        boundingBox: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
      };
    });
  });

  console.log('Canvas elements:', JSON.stringify(canvasInfo, null, 2));

  // Check all API requests made
  console.log('\n--- ALL API REQUESTS ---');
  allRequests
    .filter(r => r.url.includes('/api/'))
    .forEach(req => {
      console.log(`${req.type}: ${req.url} (status: ${req.status})`);
    });

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

  console.log('\n--- BODY HTML ---');
  console.log(bodyHTML);

  await browser.close();
}

inspect().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Inspection failed:', err);
  process.exit(1);
});
