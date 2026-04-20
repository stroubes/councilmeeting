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

  const sseMessages: string[] = [];
  const consoleMessages: { type: string; text: string }[] = [];

  // Capture SSE messages by intercepting EventSource
  await page.addInitScript(() => {
    (window as any).__sseMessages = [];
    const OriginalEventSource = window.EventSource;
    window.EventSource = function(url: string, ...args: any[]) {
      const es = new OriginalEventSource(url, ...args);
      (window as any).__originalES = es;
      es.onmessage = (event: MessageEvent) => {
        (window as any).__sseMessages = (window as any).__sseMessages || [];
        (window as any).__sseMessages.push(event.data);
        console.log('SSE message:', event.data);
      };
      es.onerror = (err: any) => {
        console.log('SSE error:', err);
      };
      return es;
    } as any;
    (window as any).__EventSource = OriginalEventSource;
  });

  page.on('console', (msg: ConsoleMessage) => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
    if (msg.text().includes('SSE')) {
      console.log(`BROWSER CONSOLE: ${msg.type()}: ${msg.text()}`);
    }
  });

  console.log(`Navigating to ${TARGET_URL}...`);
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Wait for initial load
  await page.waitForTimeout(3000);

  // Check SSE messages
  const sseCheck = await page.evaluate(() => {
    return {
      messages: (window as any).__sseMessages,
      hasES: !!(window as any).__originalES
    };
  });

  console.log('\n=== SSE MESSAGES AFTER 3 SECONDS ===');
  console.log(JSON.stringify(sseCheck, null, 2));

  // Wait more for SSE
  await page.waitForTimeout(5000);

  // Check state
  const afterWait = await page.evaluate(() => {
    const modeText = document.querySelector('.motion-screen-mode')?.textContent;
    const h2Text = document.querySelector('.motion-screen-card h2')?.textContent;
    return {
      modeText,
      h2Text,
      sseMessages: (window as any).__sseMessages
    };
  });

  console.log('\n=== STATE AFTER 8 SECONDS ===');
  console.log(JSON.stringify(afterWait, null, 2));

  // Check if there's a timing issue - maybe the state is being set but then reset
  // Let's also check if there's an error being silently caught
  const errorCheck = await page.evaluate(() => {
    // Try to manually check the React state via the fiber
    const root = document.getElementById('root');
    // @ts-ignore
    const fiberKey = Object.keys(root || {}).find(k => k.startsWith('__reactFiber'));
    return {
      rootExists: !!root,
      fiberKey: fiberKey
    };
  });

  console.log('\n=== FIBER CHECK ===');
  console.log(JSON.stringify(errorCheck, null, 2));

  // Check the API directly to confirm it's still returning PRESENTATION
  const apiCheck = await page.evaluate(async (meetingId) => {
    const API = 'http://localhost:3000/api';
    const resp = await fetch(`${API}/meeting-display/public/state?meetingId=${meetingId}`);
    const data = await resp.json();
    return {
      status: resp.status,
      displayMode: data.displayMode,
      hasPresentation: !!data.presentation?.currentPresentation
    };
  }, MEETING_ID);

  console.log('\n=== API CHECK ===');
  console.log(JSON.stringify(apiCheck, null, 2));

  console.log('\n=== ALL CONSOLE MESSAGES ===');
  consoleMessages.forEach(m => {
    if (m.type === 'error' || m.text.includes('SSE') || m.text.includes('Error') || m.text.includes('error')) {
      console.log(`${m.type}: ${m.text}`);
    }
  });

  await browser.close();
}

inspect().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Inspection failed:', err);
  process.exit(1);
});
