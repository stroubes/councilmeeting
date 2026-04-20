import { chromium, Page, Request, Response } from '@playwright/test';

const MEETING_ID = '911e47b7-87ec-4ce3-a48d-af49637f3468';

async function inspect() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ 
    viewport: { width: 1920, height: 1080 },
    // Test with both HTTP and HTTPS
  });
  const page = await context.newPage();

  // Track ALL requests
  page.on('request', (req) => {
    if (req.url().includes('localhost:3000')) {
      console.log('REQUEST:', req.url());
    }
  });

  page.on('response', (resp) => {
    if (resp.url().includes('localhost:3000')) {
      console.log('RESPONSE:', resp.url(), 'status=' + resp.status());
    }
  });

  page.on('requestfailed', (req) => {
    if (req.url().includes('localhost:3000')) {
      console.log('FAILED:', req.url(), req.failure()?.errorText);
    }
  });

  // Directly go to the API endpoint (not through the frontend)
  console.log('Loading http://localhost:3000 directly...');
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'domcontentloaded', timeout: 10000 });
    console.log('Loaded backend directly, title:', await page.title());
  } catch (e) {
    console.log('Error loading backend:', e);
  }

  // Now test the SSE from the backend page
  console.log('\nTesting SSE from backend context...');
  const sseResult = await page.evaluate(async () => {
    return new Promise((resolve) => {
      const es = new EventSource('http://localhost:3000/api/meeting-display/public/stream?meetingId=911e47b7-87ec-4ce3-a48d-af49637f3468');
      const timeout = setTimeout(() => {
        resolve({ event: 'timeout', readyState: es.readyState });
        es.close();
      }, 5000);
      
      es.onopen = () => {
        clearTimeout(timeout);
        resolve({ event: 'onopen', readyState: es.readyState });
        es.close();
      };
      es.onmessage = (e) => {
        clearTimeout(timeout);
        resolve({ event: 'onmessage', data: e.data.substring(0, 100) });
        es.close();
      };
      es.onerror = (e) => {
        clearTimeout(timeout);
        resolve({ event: 'onerror', readyState: es.readyState });
        es.close();
      };
    });
  });
  console.log('SSE Result:', JSON.stringify(sseResult));

  await browser.close();
}

inspect().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
