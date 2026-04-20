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

  // Inject code to intercept EventSource before page loads
  await page.addInitScript(() => {
    (window as any).__esLog = [];
    (window as any).__esInstance = null;
    
    const OriginalEventSource = window.EventSource;
    
    window.EventSource = class extends OriginalEventSource {
      constructor(url: string, ...args: any[]) {
        (window as any).__esLog.push({ event: 'constructor', url, time: Date.now() });
        super(url, ...args);
        (window as any).__esInstance = this;
        
        this.onopen = (event: MessageEvent) => {
          (window as any).__esLog.push({ event: 'onopen', url, time: Date.now() });
          console.log('EventSource onopen fired for:', url);
        };
        
        this.onmessage = (event: MessageEvent) => {
          (window as any).__esLog.push({ event: 'onmessage', url, data: event.data?.substring(0, 100), time: Date.now() });
          console.log('EventSource onmessage:', event.data);
        };
        
        this.onerror = (event: MessageEvent) => {
          (window as any).__esLog.push({ event: 'onerror', url, time: Date.now(), readyState: this.readyState });
          console.log('EventSource onerror:', this.readyState);
        };
      }
    } as any;
    
    // Also intercept setInterval to track polling
    (window as any).__intervalIds = [];
    const originalSetInterval = window.setInterval;
    window.setInterval = function(...args: any[]) {
      const id = originalSetInterval.apply(this, args);
      (window as any).__intervalIds.push({ id, args: args[0]?.toString().substring(0, 100), time: Date.now() });
      console.log('setInterval called, id:', id);
      return id;
    };
    
    const originalClearInterval = window.clearInterval;
    (window as any).__clearedIntervals = [];
    window.clearInterval = function(id: number) {
      (window as any).__clearedIntervals.push({ id, time: Date.now() });
      console.log('clearInterval called for id:', id);
      return originalClearInterval.apply(this, arguments);
    };
  });

  const startTime = Date.now();
  const requests: { url: string; status: number; time: number }[] = [];

  page.on('request', (request: Request) => {
    if (request.url().includes('meeting-display')) {
      requests.push({
        url: request.url(),
        status: 0,
        time: Date.now() - startTime
      });
    }
  });

  page.on('response', (response: Response) => {
    if (response.url().includes('meeting-display')) {
      const req = requests.find(r => r.url === response.url());
      if (req) req.status = response.status();
    }
  });

  console.log(`Navigating to ${TARGET_URL}...`);
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Wait for everything to settle
  await page.waitForTimeout(5000);

  // Get all the timing data
  const data = await page.evaluate(() => {
    return {
      esLog: (window as any).__esLog,
      intervalIds: (window as any).__intervalIds,
      clearedIntervals: (window as any).__clearedIntervals,
      esInstance: (window as any).__esInstance ? {
        readyState: (window as any).__esInstance.readyState,
        url: (window as any).__esInstance.url
      } : null
    };
  });

  console.log('\n=== EVENTSOURCE LOG ===');
  data.esLog?.forEach((entry: any) => {
    console.log(`[${entry.time}ms] ${entry.event}:`, JSON.stringify(entry));
  });

  console.log('\n=== SETINTERVAL CALLS ===');
  data.intervalIds?.forEach((entry: any) => {
    console.log(`[${entry.time}ms] Created interval id=${entry.id}: ${entry.args}...`);
  });

  console.log('\n=== CLEARINTERVAL CALLS ===');
  data.clearedIntervals?.forEach((entry: any) => {
    console.log(`[${entry.time}ms] Cleared interval id=${entry.id}`);
  });

  console.log('\n=== EVENTSOURCE INSTANCE STATE ===');
  console.log(JSON.stringify(data.esInstance, null, 2));

  console.log('\n=== NETWORK REQUESTS ===');
  requests.forEach(req => {
    console.log(`[${req.time}ms] ${req.url} - Status: ${req.status}`);
  });

  // Final DOM state
  const domState = await page.evaluate(() => ({
    modeText: document.querySelector('.motion-screen-mode')?.textContent,
    h2Text: document.querySelector('.motion-screen-card h2')?.textContent
  }));

  console.log('\n=== DOM STATE ===');
  console.log(JSON.stringify(domState, null, 2));

  await browser.close();
}

inspect().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Inspection failed:', err);
  process.exit(1);
});
