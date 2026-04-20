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

  // Track ALL requests with timing
  const requests: { url: string; status: number; time: number }[] = [];
  let startTime = 0;

  page.on('request', (request: Request) => {
    if (startTime === 0) startTime = Date.now();
    if (request.url().includes('meeting-display')) {
      requests.push({
        url: request.url(),
        status: 0,
        time: Date.now() - startTime
      });
      console.log(`[${Date.now() - startTime}ms] REQUEST: ${request.url()}`);
    }
  });

  page.on('response', (response: Response) => {
    if (response.url().includes('meeting-display')) {
      const req = requests.find(r => r.url === response.url());
      if (req) req.status = response.status();
      console.log(`[${Date.now() - startTime}ms] RESPONSE: ${response.url()} - Status: ${response.status()}`);
    }
  });

  // Intercept console
  const consoleMessages: string[] = [];
  page.on('console', (msg: ConsoleMessage) => {
    consoleMessages.push(msg.text());
  });

  console.log(`\n=== NAVIGATING TO ${TARGET_URL} ===\n`);
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Wait and capture more requests
  await page.waitForTimeout(3000);

  // Check for any fetch to state endpoint after initial load
  const hasStateFetch = requests.some(r => r.url.includes('/state'));
  console.log(`\n=== WAS /state ENDPOINT CALLED? ===`);
  console.log(`Found: ${hasStateFetch}`);
  requests.forEach(r => {
    console.log(`  ${r.url} - status: ${r.status} at ${r.time}ms`);
  });

  // Now manually check what the component sees
  const componentState = await page.evaluate(() => {
    // Get the text content of key elements
    const modeText = document.querySelector('.motion-screen-mode')?.textContent;
    const h2Text = document.querySelector('.motion-screen-card h2')?.textContent;
    const bodyText = document.querySelector('.motion-screen-card p')?.textContent;
    return { modeText, h2Text, bodyText };
  });

  console.log(`\n=== COMPONENT STATE (DOM) ===`);
  console.log(JSON.stringify(componentState, null, 2));

  // Check if the issue is that the React state is not being set
  // by looking at what the initial render would be
  console.log(`\n=== INITIAL RENDER (useState defaults) ===`);
  console.log(`displayState = null`);
  console.log(`mode = null ?? 'AGENDA' = 'AGENDA'`);
  console.log(`agendaItem = null ?? null = null`);
  console.log(`presentation = null ?? null = null`);
  console.log(`Since mode is 'AGENDA' and agendaItem is null, renders empty/agenda state`);

  // Now let's manually call the API and see what should happen
  const apiResult = await page.evaluate(async (meetingId) => {
    const API = 'http://localhost:3000/api';
    const resp = await fetch(`${API}/meeting-display/public/state?meetingId=${meetingId}`);
    const data = await resp.json();
    return {
      status: resp.status,
      displayMode: data.displayMode,
      presentationExists: !!data.presentation?.currentPresentation,
      presentationTitle: data.presentation?.currentPresentation?.title,
      agendaItemExists: !!data.agenda?.currentItem
    };
  }, MEETING_ID);

  console.log(`\n=== API RESULT ===`);
  console.log(JSON.stringify(apiResult, null, 2));

  console.log(`\n=== CONCLUSION ===`);
  console.log(`The API returns displayMode="PRESENTATION" with a valid presentation.`);
  console.log(`But the DOM shows "Agenda Mode" with no presentation.`);
  console.log(`This means the React state is not being updated from the API response.`);

  // Check if there are any React errors
  const reactErrors = consoleMessages.filter(m => 
    m.includes('Error') || m.includes('error') || m.includes('Uncaught')
  );
  if (reactErrors.length > 0) {
    console.log(`\n=== REACT ERRORS ===`);
    reactErrors.forEach(e => console.log(e));
  }

  await browser.close();
}

inspect().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Inspection failed:', err);
  process.exit(1);
});
