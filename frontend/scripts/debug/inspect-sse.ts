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

  const consoleMessages: { type: string; text: string }[] = [];
  const sseMessages: string[] = [];
  const allRequests: { url: string; status: number; type: string }[] = [];

  // Capture console messages
  page.on('console', (msg: ConsoleMessage) => {
    consoleMessages.push({ type: msg.type(), text: msg.text() });
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
  });

  console.log(`Navigating to ${TARGET_URL}...`);
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Wait for initial load and state fetch
  await page.waitForTimeout(3000);

  // Manually trigger state fetch and check what happens
  const stateData = await page.evaluate(async (meetingId) => {
    const API = 'http://localhost:3000/api';
    try {
      const resp = await fetch(`${API}/meeting-display/public/state?meetingId=${meetingId}`);
      const data = await resp.json();
      return {
        status: resp.status,
        displayMode: data.displayMode,
        presentation: data.presentation ? {
          currentPresentation: data.presentation.currentPresentation,
          currentSlideNumber: data.presentation.currentSlideNumber,
          totalSlides: data.presentation.totalSlides
        } : null,
        motion: data.motion,
        agenda: data.agenda
      };
    } catch (e) {
      return { error: String(e) };
    }
  }, MEETING_ID);

  console.log('\n--- STATE FROM API ---');
  console.log(JSON.stringify(stateData, null, 2));

  // Check React state by examining the DOM more carefully
  const domAnalysis = await page.evaluate(() => {
    const modeEl = document.querySelector('[class*="mode"]');
    const statusEl = document.querySelector('[class*="status"]');
    const cardEl = document.querySelector('.motion-screen-card');
    const emptyEl = document.querySelector('.motion-screen-empty');
    const h2El = cardEl?.querySelector('h2');
    const pEl = cardEl?.querySelector('p');
    
    return {
      mode: modeEl?.textContent,
      status: statusEl?.textContent,
      cardClasses: cardEl?.className,
      emptyClasses: emptyEl?.className,
      h2Text: h2El?.textContent,
      pText: pEl?.textContent,
      hasPresentationClass: document.querySelector('.live-meeting-screen-presentation') !== null
    };
  });

  console.log('\n--- DOM ANALYSIS ---');
  console.log(JSON.stringify(domAnalysis, null, 2));

  // Wait more for potential SSE updates
  await page.waitForTimeout(5000);

  // Check if any SSE messages were received
  const sseCheck = await page.evaluate(() => {
    // Look for any toast or notification that might indicate state change
    const toasts = document.querySelectorAll('.toast-viewport > *');
    return {
      toastCount: toasts.length,
      modeText: document.querySelector('[class*="mode"]')?.textContent,
      h2Text: document.querySelector('.motion-screen-card h2')?.textContent,
      hasPresentationCanvas: document.querySelector('canvas.presentation-screen-canvas') !== null,
      hasPresentationStage: document.querySelector('.presentation-screen-stage') !== null
    };
  });

  console.log('\n--- SSE CHECK AFTER 5 MORE SECONDS ---');
  console.log(JSON.stringify(sseCheck, null, 2));

  // Check canvas specifically
  const canvasCheck = await page.evaluate(() => {
    const allCanvases = document.querySelectorAll('canvas');
    return Array.from(allCanvases).map(c => ({
      class: c.className,
      width: c.width,
      height: c.height,
      style: c.getAttribute('style'),
      bounding: c.getBoundingClientRect()
    }));
  });

  console.log('\n--- CANVAS CHECK ---');
  console.log(JSON.stringify(canvasCheck, null, 2));

  // Get the full body HTML
  const bodyHTML = await page.evaluate(() => document.body.innerHTML);

  console.log('\n--- BODY HTML ---');
  console.log(bodyHTML.substring(0, 3000));

  console.log('\n--- ALL CONSOLE MESSAGES ---');
  consoleMessages.forEach(m => console.log(`${m.type}: ${m.text}`));

  await browser.close();
}

inspect().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Inspection failed:', err);
  process.exit(1);
});
