import { chromium, ConsoleMessage, Page } from '@playwright/test';

const MEETING_ID = '911e47b7-87ec-4ce3-a48d-af49637f3468';
const TARGET_URL = `http://localhost:5173/public/live-meeting/${MEETING_ID}`;

async function inspect() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  // Inject detailed SSE interception
  await page.addInitScript(() => {
    (window as any).__sse = {
      log: [] as any[],
      messages: [] as string[],
      errors: [] as any[],
      readyState: null as number | null,
      url: null as string | null
    };

    const OriginalES = (window as any).__OriginalEventSource = window.EventSource;
    
    window.EventSource = function(url: string, ...args: any[]) {
      const es = new (OriginalES as any)(url, ...args);
      (window as any).__sse.url = url;
      (window as any).__sse.readyState = es.readyState;
      
      (window as any).__sse.log.push({ event: 'constructor', readyState: es.readyState, time: Date.now() });
      
      es.onopen = (event: MessageEvent) => {
        (window as any).__sse.readyState = es.readyState;
        (window as any).__sse.log.push({ event: 'onopen', readyState: es.readyState, time: Date.now() });
        console.log('SSE onopen fired', JSON.stringify({ readyState: es.readyState, url }));
      };
      
      es.onmessage = (event: MessageEvent) => {
        (window as any).__sse.log.push({ event: 'onmessage', dataPreview: event.data?.substring(0, 100), time: Date.now() });
        (window as any).__sse.messages.push(event.data);
        console.log('SSE onmessage:', event.data?.substring(0, 200));
      };
      
      es.onerror = (event: MessageEvent) => {
        (window as any).__sse.readyState = es.readyState;
        (window as any).__sse.errors.push({ readyState: es.readyState, time: Date.now() });
        (window as any).__sse.log.push({ event: 'onerror', readyState: es.readyState, time: Date.now() });
        console.log('SSE onerror fired', JSON.stringify({ readyState: es.readyState }));
      };
      
      return es;
    } as any;
    
    // Expose EventSource constructor for reference
    (window as any).__EventSource = OriginalES;
  });

  const consoleLogs: string[] = [];
  page.on('console', (msg: ConsoleMessage) => {
    consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    if (msg.text().includes('SSE')) {
      console.log(`BROWSER: ${msg.text()}`);
    }
  });

  console.log(`Navigating to ${TARGET_URL}...`);
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Wait for SSE to potentially fire
  await page.waitForTimeout(4000);

  // Check SSE state
  const sseState = await page.evaluate(() => (window as any).__sse);
  
  console.log('\n=== SSE STATE ===');
  console.log('URL:', sseState?.url);
  console.log('ReadyState:', sseState?.readyState, '(0=CONNECTING, 1=OPEN, 2=CLOSING, 3=CLOSED)');
  console.log('Messages received:', sseState?.messages?.length);
  console.log('Errors:', sseState?.errors?.length);
  console.log('\nSSE Log (chronological):');
  sseState?.log?.forEach((entry: any) => {
    console.log(`  ${entry.event}: readyState=${entry.readyState}, data=${entry.dataPreview || 'N/A'}`);
  });

  console.log('\n=== SSE MESSAGES ===');
  if (sseState?.messages?.length > 0) {
    sseState.messages.forEach((msg: string, i: number) => {
      try {
        const parsed = JSON.parse(msg);
        console.log(`Message ${i}: displayMode=${parsed.displayMode}, hasPresentation=${!!parsed.presentation?.currentPresentation}`);
      } catch {
        console.log(`Message ${i}: ${msg.substring(0, 200)}`);
      }
    });
  } else {
    console.log('No messages received');
  }

  // Check final DOM state
  const domState = await page.evaluate(() => ({
    modeText: document.querySelector('.motion-screen-mode')?.textContent,
    h2Text: document.querySelector('.motion-screen-card h2')?.textContent,
    hasPresentationClass: !!document.querySelector('.live-meeting-screen-presentation'),
    hasPresentationCanvas: !!document.querySelector('canvas.presentation-screen-canvas')
  }));

  console.log('\n=== DOM STATE ===');
  console.log(JSON.stringify(domState, null, 2));

  // Now test manually calling loadState via the console
  console.log('\n=== MANUAL TEST ===');
  const manualTest = await page.evaluate(async () => {
    const API = 'http://localhost:3000/api';
    const meetingId = '911e47b7-87ec-4ce3-a48d-af49637f3468';
    
    // Manually call the API
    const response = await fetch(`${API}/meeting-display/public/state?meetingId=${meetingId}`);
    const data = await response.json();
    
    // Simulate what applyIncomingState would do
    return {
      apiStatus: response.status,
      displayMode: data.displayMode,
      presentation: data.presentation ? {
        id: data.presentation.currentPresentation?.id,
        slide: data.presentation.currentSlideNumber,
        total: data.presentation.totalSlides
      } : null
    };
  });
  
  console.log(JSON.stringify(manualTest, null, 2));

  console.log('\n=== CONSOLE ERRORS ===');
  consoleLogs.filter(l => l.startsWith('[error]')).forEach(l => console.log(l));

  await browser.close();
  
  // Print summary
  console.log('\n========== FINDINGS SUMMARY ==========');
  console.log(`SSE URL: ${sseState?.url}`);
  console.log(`SSE ReadyState: ${sseState?.readyState}`);
  console.log(`SSE onopen fired: ${sseState?.log?.some((l: any) => l.event === 'onopen')}`);
  console.log(`SSE onmessage fired: ${sseState?.log?.some((l: any) => l.event === 'onmessage')}`);
  console.log(`SSE onerror fired: ${sseState?.log?.some((l: any) => l.event === 'onerror')}`);
  console.log(`Messages received: ${sseState?.messages?.length}`);
  console.log(`\nDOM shows: "${domState.modeText}" / "${domState.h2Text}"`);
  console.log(`\nManual API call returns: displayMode="${manualTest.displayMode}", presentation=${manualTest.presentation ? 'YES' : 'NO'}`);
}

inspect().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
