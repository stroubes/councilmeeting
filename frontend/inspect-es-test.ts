import { chromium } from '@playwright/test';

const MEETING_ID = '911e47b7-87ec-4ce3-a48d-af49637f3468';
const TARGET_URL = `http://localhost:5173/public/live-meeting/${MEETING_ID}`;

async function inspect() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  const page = await context.newPage();

  // Test 1: Direct SSE via fetch to see what the browser sees
  console.log('=== TEST 1: Direct SSE via fetch ===');
  const sseFetchResult = await page.evaluate(async () => {
    try {
      const response = await fetch('http://localhost:3000/api/meeting-display/public/stream?meetingId=911e47b7-87ec-4ce3-a48d-af49637f3468', {
        headers: { 'Accept': 'text/event-stream' }
      });
      return {
        status: response.status,
        contentType: response.headers.get('content-type'),
        bodyUsed: response.bodyUsed,
        // Try to read just the first chunk
        bodyLocked: response.body?.locked
      };
    } catch (e) {
      return { error: String(e) };
    }
  });
  console.log(JSON.stringify(sseFetchResult, null, 2));

  // Test 2: Regular API call to verify backend is up
  console.log('\n=== TEST 2: Regular API call ===');
  const apiResult = await page.evaluate(async () => {
    try {
      const response = await fetch('http://localhost:3000/api/meeting-display/public/state?meetingId=911e47b7-87ec-4ce3-a48d-af49637f3468');
      const data = await response.json();
      return { status: response.status, displayMode: data.displayMode };
    } catch (e) {
      return { error: String(e) };
    }
  });
  console.log(JSON.stringify(apiResult, null, 2));

  // Test 3: EventSource with proper event listener
  console.log('\n=== TEST 3: EventSource with onopen/onmessage ===');
  const esResult = await page.evaluate(async () => {
    return new Promise((resolve) => {
      const es = new EventSource('http://localhost:3000/api/meeting-display/public/stream?meetingId=911e47b7-87ec-4ce3-a48d-af49637f3468');
      
      const startTime = Date.now();
      
      es.onopen = () => {
        resolve({
          event: 'onopen',
          readyState: es.readyState,
          time: Date.now() - startTime
        });
        es.close();
      };
      
      es.onmessage = (event) => {
        resolve({
          event: 'onmessage',
          data: event.data.substring(0, 100),
          time: Date.now() - startTime
        });
        es.close();
      };
      
      es.onerror = () => {
        resolve({
          event: 'onerror',
          readyState: es.readyState,
          time: Date.now() - startTime
        });
        es.close();
      };
      
      // Timeout after 5 seconds
      setTimeout(() => {
        resolve({
          event: 'timeout',
          readyState: es.readyState,
          time: Date.now() - startTime
        });
        es.close();
      }, 5000);
    });
  });
  console.log(JSON.stringify(esResult, null, 2));

  await browser.close();
}

inspect().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
