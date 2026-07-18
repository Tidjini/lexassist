const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  const tz = await page.evaluate(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
  console.log('Browser timezone:', tz);

  await page.goto('http://localhost:3000/sign-in');
  await page.getByLabel('Email').fill('admin@ecole-test.dz');
  await page.getByLabel('Password').fill('TestPass123!');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.waitForURL(/accueil/, { timeout: 15000 });

  await page.goto('http://localhost:3000/groupes/13/seances');
  await page.waitForTimeout(1000);

  const dates = await page.locator('p.capitalize').allTextContents();
  console.log('dates affichées dans le vrai groupe:', dates);

  await browser.close();
})();
