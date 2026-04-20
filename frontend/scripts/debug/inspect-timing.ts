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

  const consoleMessages: { time: number; type: string; text: string }[] = [];
  const networkLogs: { time: number; type: string; url: string; status?: number }[] = [];
  const startTime = Date.now();

  // Track timing of all events
  page.on('console', (msg: ConsoleMessage) => {
    consoleMessages.push({ 
      time: Date.now() - startTime, 
      type: msg.type(), 
      text: msg.text() 
    });
  });

  page.on('request', (request: Request) => {
    networkLogs.push({ 
      time: Date.now() - startTime, 
      type: 'request', 
      url: request.url() 
    });
  });

  page.on('response', (response: Response) => {
    const log = networkLogs.find(l => l.url === response.url());
    if (log) {
      log.status = response.status();
    }
  });

  console.log(`Navigating to ${TARGET_URL}...`);
  
  // Inject timing code BEFORE navigation
  await page.addInitScript(() => {
    (window as any).__timingLog = [];
    
    // Intercept fetch
    const originalFetch = window.fetch;
    (window as any).__originalFetch = originalFetch;
    window.fetch = async (input: RequestInfo, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input.url;
      const start = Date.now();
      (window as any).__timingLog.push({ event: 'fetch_start', url, time: Date.now() });
      try {
        const result = await originalFetch(input, init);
        (window as any).__timingLog.push({ event: 'fetch_end', url, status: result.status, duration: Date.now() - start });
        return result;
      } catch (e) {
        (window as any).__timingLog.push({ event: 'fetch_error', url, error: String(e) });
        throw e;
      }
    };

    // Intercept EventSource
    (window as any).__sseEvents = [];
    const OriginalES = window.EventSource;
    (window as any).__OriginalEventSource = OriginalES;
    window.EventSource = function(url: string, ...args: any[]) {
      (window as any).__timingLog.push({ event: 'es_create', url, time: Date.now() });
      const es = new OriginalES(url, ...args);
      (window as any).__esInstance = es;
      es.onopen = () => {
        (window as any).__timingLog.push({ event: 'es_onopen', url, time: Date.now() });
      };
      es.onmessage = (evt) => {
        (window as any).__timingLog.push({ event: 'es_onmessage', url, data: evt.data?.substring(0, 100), time: Date.now() });
        (window as any).__sseEvents.push(evt.data);
      };
      es.onerror = (err) => {
        (window as any).__timingLog.push({ event: 'es_onerror', url, time: Date.now() });
      };
      return es;
    } as any;
  });

  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Wait for things to settle
  await page.waitForTimeout(5000);

  // Get all timing data
  const timingData = await page.evaluate(() => {
    return {
      timingLog: (window as any).__timingLog,
      sseEvents: (window as any).__sseEvents,
      esExists: !!(window as any).__esInstance
    };
  });

  console.log('\n=== TIMING LOG (sorted by time) ===');
  timingData.timingLog
    .sort((a: any, b: any) => a.time - b.time)
    .forEach((entry: any) => {
      console.log(`[${entry.time}ms] ${entry.event}:`, JSON.stringify(entry));
    });

  console.log('\n=== SSE EVENTS ===');
  if (timingData.sseEvents.length === 0) {
    console.log('No SSE events received');
  } else {
    timingData.sseEvents.forEach((e: string, i: number) => {
      console.log(`Event ${i}: ${e.substring(0, 200)}`);
    });
  }

  // Final state
  const finalState = await page.evaluate(() => {
    return {
      modeText: document.querySelector('.motion-screen-mode')?.textContent,
      h2Text: document.querySelector('.motion-screen-card h2')?.textContent
    };
  });

  console.log('\n=== FINAL DOM STATE ===');
  console.log(JSON.stringify(finalState, null, 2));

  await browser.close();
}

inspect().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Inspection failed:', err);
  process.exit(1);
});
