import { chromium, ConsoleMessage, Page, Request, Response } from '@playwright/test';

const MEETING_ID = '911e47b7-87ec-4ce3-a48d-af49637f3468';
const BASE_URL = 'http://localhost:5173';
const TARGET_URL = `${BASE_URL}/public/live-meeting/${MEETING_ID}`;

interface FailedRequest {
  url: string;
  status: number;
  failure: string | null;
}

async function inspect() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  const consoleErrors: string[] = [];
  const consoleWarnings: string[] = [];
  const failedRequests: FailedRequest[] = [];

  // Capture console messages
  page.on('console', (msg: ConsoleMessage) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    } else if (msg.type() === 'warning') {
      consoleWarnings.push(msg.text());
    }
  });

  // Capture failed requests
  page.on('requestfailed', (request: Request) => {
    failedRequests.push({
      url: request.url(),
      status: 0,
      failure: request.failure()?.errorText || null
    });
  });

  page.on('response', (response: Response) => {
    if (response.status() >= 400) {
      failedRequests.push({
        url: response.url(),
        status: response.status(),
        failure: response.statusText()
      });
    }
  });

  console.log(`Navigating to ${TARGET_URL}...`);
  await page.goto(TARGET_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

  // Wait for React to render and any polling/websockets to settle
  await page.waitForTimeout(5000);

  const title = await page.title();

  // Analyze DOM - break into smaller pieces to avoid context issues
  const totalElements = await page.evaluate(() => document.querySelectorAll('*').length);
  const rootChildren = await page.evaluate(() => document.getElementById('root')?.children.length || 0);

  // Get body HTML (first 3000 chars)
  const bodyHTML = await page.evaluate(() => document.body.innerHTML.substring(0, 3000));

  // Get key elements
  const keySelectors = [
    'canvas',
    'iframe',
    '[data-testid]',
    '[class*="presentation"]',
    '[class*="canvas"]',
    '[class*="slide"]',
    '[class*="pdf"]',
    '[id*="presentation"]',
    '[id*="pdf"]'
  ];

  const keyElements: { selector: string; count: number }[] = [];
  for (const sel of keySelectors) {
    const count = await page.evaluate((s) => document.querySelectorAll(s).length, sel);
    if (count > 0) {
      keyElements.push({ selector: sel, count });
    }
  }

  // Check canvas elements
  const canvasData = await page.evaluate(() => {
    const canvases = document.querySelectorAll('canvas');
    return Array.from(canvases).map((canvas, i) => {
      const style = getComputedStyle(canvas);
      const rect = canvas.getBoundingClientRect();
      let hasContent = false;
      try {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          for (let j = 0; j < data.length; j += 4) {
            if (data[j + 3] !== 0) { hasContent = true; break; }
          }
        }
      } catch {}
      return {
        index: i,
        width: canvas.width,
        height: canvas.height,
        display: style.display,
        visibility: style.visibility,
        opacity: style.opacity,
        boundingBox: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
        hasContent,
        backgroundColor: style.backgroundColor
      };
    });
  });

  // Check PDF.js state
  const pdfjsData = await page.evaluate(() => {
    const pdfjsLib = (window as any)['pdfjs-dist/build/pdf'];
    const pdfViewer = document.querySelector('[class*="pdfViewer"], [class*="viewer"]');
    const canvasWrapper = document.querySelector('[class*="canvasWrapper"], [id*="canvasWrapper"]');
    const pages = document.querySelectorAll('.page, [data-page-number]');
    const textLayers = document.querySelectorAll('.textLayer');
    const annotationLayers = document.querySelectorAll('.annotationLayer');

    return {
      pdfjsLoaded: !!pdfjsLib,
      pdfjsVersion: pdfjsLib?.version || null,
      pdfViewerExists: !!pdfViewer,
      canvasWrapperExists: !!canvasWrapper,
      pagesCount: pages.length,
      textLayersCount: textLayers.length,
      annotationLayersCount: annotationLayers.length,
      pdfjsGlobal: Object.keys(window).filter(k => k.includes('pdf'))
    };
  });

  // Check presentation state
  const presentationData = await page.evaluate(() => {
    const meetingMode = document.querySelector('[data-meeting-mode]')?.getAttribute('data-meeting-mode');
    const modeEl = document.querySelector('[class*="mode"]');
    const hasPresentationActive = !!document.querySelector('[data-presentation-active="true"], .presentation-active');
    const currentSlideEl = document.querySelector('[data-current-slide], .current-slide');
    const slidesCountEl = document.querySelector('[data-slides-count], .slides-count');

    return {
      meetingMode,
      modeText: modeEl?.textContent || null,
      presentationActive: hasPresentationActive,
      currentSlide: currentSlideEl ? parseInt(currentSlideEl.textContent || '0') : null,
      slidesCount: slidesCountEl ? parseInt(slidesCountEl.textContent || '0') : null
    };
  });

  // Get visible text content
  const visibleText = await page.evaluate(() => {
    const elements = document.querySelectorAll('h1, h2, h3, h4, p, span, button, div');
    const result: { tag: string; text: string; visible: boolean }[] = [];
    for (const el of elements) {
      const style = getComputedStyle(el);
      if (style.display !== 'none' && style.visibility !== 'hidden' && el.textContent?.trim()) {
        result.push({
          tag: el.tagName,
          text: el.textContent.trim().substring(0, 100),
          visible: el.getBoundingClientRect().height > 0
        });
      }
    }
    return result.slice(0, 40);
  });

  // Check if there's an API endpoint for meeting state
  const apiCheck = await page.evaluate(async () => {
    try {
      // Check if there's a meeting API
      const resp = await fetch('/api/meetings/911e47b7-87ec-4ce3-a48d-af49637f3468', {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      const data = await resp.json().catch(() => null);
      return { status: resp.status, hasData: !!data, data: data ? JSON.stringify(data).substring(0, 500) : null };
    } catch {
      return { status: 0, hasData: false, error: 'Fetch failed' };
    }
  });

  await browser.close();

  // Print report
  console.log('\n========== INSPECTION REPORT ==========\n');
  console.log(`URL: ${TARGET_URL}`);
  console.log(`Title: ${title}`);
  console.log(`Total elements: ${totalElements}`);
  console.log(`Root children: ${rootChildren}`);

  console.log('\n--- CONSOLE ERRORS ---');
  if (consoleErrors.length === 0) {
    console.log('No console errors');
  } else {
    consoleErrors.forEach(err => console.log(`ERROR: ${err}`));
  }

  console.log('\n--- CONSOLE WARNINGS ---');
  if (consoleWarnings.length === 0) {
    console.log('No console warnings');
  } else {
    consoleWarnings.slice(0, 10).forEach(warn => console.log(`WARN: ${warn}`));
  }

  console.log('\n--- FAILED REQUESTS ---');
  if (failedRequests.length === 0) {
    console.log('No failed requests');
  } else {
    failedRequests.forEach(req => {
      console.log(`FAILED: ${req.url} (${req.status}) - ${req.failure}`);
    });
  }

  console.log('\n--- KEY ELEMENTS ---');
  keyElements.forEach(el => {
    console.log(`  ${el.selector}: count=${el.count}`);
  });

  console.log('\n--- CANVAS ELEMENTS ---');
  if (canvasData.length === 0) {
    console.log('No canvas elements found');
  } else {
    canvasData.forEach(canvas => {
      console.log(`Canvas[${canvas.index}]:`);
      console.log(`  Dimensions: ${canvas.width}x${canvas.height}`);
      console.log(`  Display: ${canvas.display}, Visibility: ${canvas.visibility}, Opacity: ${canvas.opacity}`);
      console.log(`  Bounding box: x=${canvas.boundingBox.x.toFixed(0)}, y=${canvas.boundingBox.y.toFixed(0)}, w=${canvas.boundingBox.width.toFixed(0)}, h=${canvas.boundingBox.height.toFixed(0)}`);
      console.log(`  Has content: ${canvas.hasContent}`);
      console.log(`  Background: ${canvas.backgroundColor}`);
    });
  }

  console.log('\n--- PDF.JS STATE ---');
  console.log(`PDF.js loaded: ${pdfjsData.pdfjsLoaded}`);
  console.log(`PDF.js version: ${pdfjsData.pdfjsVersion}`);
  console.log(`PDF viewer exists: ${pdfjsData.pdfViewerExists}`);
  console.log(`Canvas wrapper exists: ${pdfjsData.canvasWrapperExists}`);
  console.log(`Pages count: ${pdfjsData.pagesCount}`);
  console.log(`Text layers count: ${pdfjsData.textLayersCount}`);
  console.log(`Annotation layers count: ${pdfjsData.annotationLayersCount}`);
  console.log(`PDF.js globals: ${pdfjsData.pdfjsGlobal.join(', ')}`);

  console.log('\n--- PRESENTATION STATE ---');
  console.log(`Meeting mode attr: ${presentationData.meetingMode}`);
  console.log(`Meeting mode text: ${presentationData.modeText}`);
  console.log(`Presentation active: ${presentationData.presentationActive}`);
  console.log(`Current slide: ${presentationData.currentSlide}`);
  console.log(`Slides count: ${presentationData.slidesCount}`);

  console.log('\n--- VISIBLE TEXT CONTENT ---');
  visibleText.forEach(el => {
    if (el.visible) {
      console.log(`<${el.tag}>: "${el.text}"`);
    }
  });

  console.log('\n--- API CHECK ---');
  console.log(`Status: ${apiCheck.status}`);
  console.log(`Has data: ${apiCheck.hasData}`);
  if (apiCheck.data) console.log(`Data: ${apiCheck.data}`);

  console.log('\n--- BODY HTML (first 3000 chars) ---');
  console.log(bodyHTML);

  console.log('\n========== END REPORT ==========\n');
}

inspect().then(() => {
  process.exit(0);
}).catch(err => {
  console.error('Inspection failed:', err);
  process.exit(1);
});
