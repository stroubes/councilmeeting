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

  // Intercept the API call to see what the frontend receives
  page.on('response', async (response) => {
    if (response.url().includes('/meeting-display/public/state')) {
      const status = response.status();
      const headers = response.headers();
      let body;
      try {
        body = await response.json();
      } catch {
        body = await response.text();
      }
      console.log('\n=== INTERCEPTED /meeting-display/public/state ===');
      console.log(`Status: ${status}`);
      console.log(`Headers: ${JSON.stringify(headers)}`);
      console.log(`Body: ${JSON.stringify(body).substring(0, 2000)}`);
    }
  });

  // Capture console messages
  const consoleMessages: { type: string; text: string }[] = [];
  page.on('console', (msg: ConsoleMessage) => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
  });

  console.log(`Navigating to ${TARGET_URL}...`);
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Wait for React to render and network to settle
  await page.waitForTimeout(5000);

  // Now manually fetch and see what's happening
  const manualFetch = await page.evaluate(async (meetingId) => {
    const API = 'http://localhost:3000/api';
    
    // This is exactly what the frontend does
    const response = await fetch(`${API}/meeting-display/public/state?meetingId=${meetingId}`, {
      method: 'GET',
      credentials: 'omit',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    const text = await response.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
    
    return {
      status: response.status,
      statusText: response.statusText,
      contentType: response.headers.get('content-type'),
      bodyLength: text.length,
      isJson: !!json,
      parsed: json ? {
        displayMode: json.displayMode,
        hasPresentation: !!json.presentation?.currentPresentation,
        presentationId: json.presentation?.currentPresentation?.id,
        slideNum: json.presentation?.currentSlideNumber,
        totalSlides: json.presentation?.totalSlides
      } : null,
      rawPreview: text.substring(0, 500)
    };
  }, MEETING_ID);

  console.log('\n=== MANUAL FETCH (simulating frontend) ===');
  console.log(JSON.stringify(manualFetch, null, 2));

  // Check what React state is
  const reactState = await page.evaluate(() => {
    // Get the root element
    const root = document.getElementById('root');
    if (!root) return { error: 'No root' };
    
    // Try to access React internal fiber
    // @ts-ignore
    const keys = Object.keys(root).filter(k => k.includes('react') || k.includes('React'));
    
    // Check DOM state
    const modeText = document.querySelector('.motion-screen-mode')?.textContent;
    const hasPresentationClass = document.querySelector('.live-meeting-screen-presentation') !== null;
    const cardContent = document.querySelector('.motion-screen-card')?.innerHTML;
    
    return {
      modeText,
      hasPresentationClass,
      cardContent: cardContent?.substring(0, 200),
      reactKeysFound: keys
    };
  });

  console.log('\n=== REACT STATE (DOM) ===');
  console.log(JSON.stringify(reactState, null, 2));

  // Wait longer to see if SSE triggers update
  await page.waitForTimeout(5000);

  const afterWait = await page.evaluate(() => {
    return {
      modeText: document.querySelector('.motion-screen-mode')?.textContent,
      h2Text: document.querySelector('.motion-screen-card h2')?.textContent
    };
  });

  console.log('\n=== AFTER 5 MORE SECONDS ===');
  console.log(JSON.stringify(afterWait, null, 2));

  console.log('\n=== ALL CONSOLE MESSAGES ===');
  consoleMessages.forEach(m => console.log(`${m.type}: ${m.text}`));

  await browser.close();
}

inspect().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Inspection failed:', err);
  process.exit(1);
});
