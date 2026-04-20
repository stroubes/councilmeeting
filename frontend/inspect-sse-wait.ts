import { chromium, ConsoleMessage } from '@playwright/test';

const MEETING_ID = '911e47b7-87ec-4ce3-a48d-af49637f3468';
const TARGET_URL = `http://localhost:5173/public/live-meeting/${MEETING_ID}`;

async function inspect() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  // Simple SSE tracking
  await page.addInitScript(() => {
    (window as any).__sse = { messages: [], errors: [], readyState: null };
    const OriginalES = window.EventSource;
    window.EventSource = function(url: string, ...args: any[]) {
      const es = new OriginalES(url, ...args);
      (window as any).__sse.es = es;
      (window as any).__sse.readyState = es.readyState;
      es.onopen = () => { (window as any).__sse.readyState = es.readyState; console.log('SSE OPEN'); };
      es.onmessage = (e) => { (window as any).__sse.messages.push(e.data); console.log('SSE MSG:', e.data.substring(0, 100)); };
      es.onerror = () => { (window as any).__sse.readyState = es.readyState; console.log('SSE ERROR, readyState=' + es.readyState); };
      return es;
    } as any;
  });

  page.on('console', (msg) => {
    if (msg.text().includes('SSE')) console.log('BROWSER:', msg.text());
  });

  console.log(`Navigating to ${TARGET_URL}...`);
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Wait longer to see if SSE connects
  console.log('Waiting 8 seconds for SSE...');
  await page.waitForTimeout(8000);

  const sseState = await page.evaluate(() => (window as any).__sse);
  
  console.log('\n=== SSE STATE AFTER 8 SECONDS ===');
  console.log('ReadyState:', sseState?.readyState, '(0=CONNECTING, 1=OPEN)');
  console.log('Messages:', sseState?.messages?.length);
  console.log('Has ES instance:', !!sseState?.es);
  if (sseState?.es) {
    console.log('ES readyState directly:', sseState.es.readyState);
  }

  // Final DOM
  const dom = await page.evaluate(() => ({
    mode: document.querySelector('.motion-screen-mode')?.textContent,
    h2: document.querySelector('.motion-screen-card h2')?.textContent
  }));
  console.log('\nDOM:', dom.mode, '/', dom.h2);

  await browser.close();
}

inspect().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
