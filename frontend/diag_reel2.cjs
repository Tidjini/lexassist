const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('pageerror', (err) => console.log('PAGEERROR:', err.message));
  page.on('console', (msg) => { if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text()); });

  await page.goto('http://localhost:3000/sign-in');
  await page.getByLabel('Email').fill('admin@ecole-test.dz');
  await page.getByLabel('Password').fill('TestPass123!');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(/accueil/, { timeout: 15000 });

  await page.goto('http://localhost:3000/groupes/13/seances');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/tmp/groupe13-seances.png', fullPage: true });

  await browser.close();
})();
