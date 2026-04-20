const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  const failedRequests = [];
  page.on('requestfailed', request => {
    failedRequests.push(request.method() + ' ' + request.url() + ' - ' + (request.failure() && request.failure().errorText));
  });

  console.log('Navigating to login page...');
  await page.goto('http://localhost:5173/login');
  await page.waitForLoadState('networkidle');

  const title = await page.title();
  console.log('Title:', title);

  const devLoginBtn = page.getByText('Use Local Dev Login');
  const hasDevLogin = await devLoginBtn.count() > 0;
  console.log('Has Dev Login button:', hasDevLogin);

  if (hasDevLogin) {
    console.log('Clicking Dev Login...');
    await devLoginBtn.click();
    await page.waitForTimeout(3000);

    const url = page.url();
    console.log('URL after click:', url);

    const errorEl = page.locator('.inline-alert');
    if (await errorEl.count() > 0) {
      const errorText = await errorEl.textContent();
      console.log('Error message:', errorText);
    }

    const bodyText = await page.locator('body').textContent();
    console.log('Page shows:', bodyText.slice(0, 300));
  }

  if (consoleErrors.length > 0) {
    console.log('Console errors:', consoleErrors.slice(0, 5));
  }

  if (failedRequests.length > 0) {
    console.log('Failed requests:', failedRequests.slice(0, 5));
  }

  await browser.close();
})();