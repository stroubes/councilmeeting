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

  // Intercept ALL fetches including the state endpoint
  page.on('request', (request: Request) => {
    if (request.url().includes('meeting-display')) {
      console.log(`REQUEST: ${request.url()}`);
    }
  });

  page.on('response', (response: Response) => {
    if (response.url().includes('meeting-display')) {
      console.log(`RESPONSE: ${response.url()} - Status: ${response.status()}`);
    }
  });

  console.log(`Navigating to ${TARGET_URL}...`);
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Wait a short time
  await page.waitForTimeout(2000);

  // Check what's happening with the display state API specifically
  const apiCheck = await page.evaluate(async (meetingId) => {
    const API = 'http://localhost:3000/api';
    
    // This is exactly what the frontend does in getPublicMeetingDisplayState
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
      called: true,
      status: response.status,
      isJson: !!json,
      displayMode: json?.displayMode,
      hasPresentation: !!json?.presentation?.currentPresentation,
      rawLength: text.length
    };
  }, MEETING_ID);

  console.log('\n=== API CHECK ===');
  console.log(JSON.stringify(apiCheck, null, 2));

  // Now let's manually trigger what should happen
  const manualApply = await page.evaluate(async (meetingId) => {
    const API = 'http://localhost:3000/api';
    
    // Fetch the state
    const response = await fetch(`${API}/meeting-display/public/state?meetingId=${meetingId}`);
    const state = await response.json();
    
    // Check what mode would be computed as
    const mode = state.displayMode;
    const presentation = state.presentation?.currentPresentation;
    const presentationSlideNumber = state.presentation?.currentSlideNumber ?? 1;
    const presentationTotalSlides = state.presentation?.totalSlides ?? 0;
    
    return {
      mode,
      presentationId: presentation?.id,
      presentationTitle: presentation?.title,
      slideNumber: presentationSlideNumber,
      totalSlides: presentationTotalSlides,
      // What would the component render?
      wouldShowPresentation: mode === 'PRESENTATION' && presentation !== null,
      wouldShowAgenda: mode === 'AGENDA' && !state.agenda.currentItem
    };
  }, MEETING_ID);

  console.log('\n=== MANUAL APPLY SIMULATION ===');
  console.log(JSON.stringify(manualApply, null, 2));

  // Check current DOM state
  const domState = await page.evaluate(() => {
    const modeEl = document.querySelector('.motion-screen-mode');
    const h2El = document.querySelector('.motion-screen-card h2');
    return {
      modeText: modeEl?.textContent,
      h2Text: h2El?.textContent,
      hasPresentationClass: !!document.querySelector('.live-meeting-screen-presentation'),
      hasPresentationCard: !!document.querySelector('.presentation-live-card')
    };
  });

  console.log('\n=== DOM STATE ===');
  console.log(JSON.stringify(domState, null, 2));

  // Let's also check if the problem is with React not re-rendering
  // by looking at if the data is actually there but just not displayed
  const fullAnalysis = await page.evaluate(() => {
    const root = document.getElementById('root');
    return {
      rootHTML: root?.innerHTML.substring(0, 500),
      // Check for hidden presentation elements
      hasHiddenPresentation: !!document.querySelector('[class*="presentation"][style*="display"]'),
      allDivs: document.querySelectorAll('div').length,
      sections: document.querySelectorAll('section').length
    };
  });

  console.log('\n=== FULL ANALYSIS ===');
  console.log(JSON.stringify(fullAnalysis, null, 2));

  await browser.close();
}

inspect().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Inspection failed:', err);
  process.exit(1);
});
