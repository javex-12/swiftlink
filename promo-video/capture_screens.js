const { chromium } = require('@playwright/test');

async function captureScreens() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  
  // Mobile device context (iPhone 15 Pro Max style: 430x932, dpr 3 for ultra-crisp screenshots)
  const context = await browser.newContext({
    viewport: { width: 430, height: 932 },
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  });

  const page = await context.newPage();

  // 1. Landing Page
  console.log('Capturing Landing Page...');
  await page.goto('http://localhost:3000/?v=landing', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'promo-video/cap_landing_mobile.png' });

  // 2. Pro Editor / Dashboard
  console.log('Capturing Pro Editor / Dashboard...');
  try {
    await page.goto('http://localhost:3000/pro', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'promo-video/cap_editor_mobile.png' });
  } catch (e) {
    console.log('Pro error:', e.message);
  }

  // 3. Customer Storefront
  console.log('Capturing Customer Storefront...');
  try {
    await page.goto('http://localhost:3000/?shop=kemi-studio', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'promo-video/cap_storefront_mobile.png' });
  } catch (e) {
    console.log('Storefront error:', e.message);
  }

  // 4. Also capture Desktop/Tablet Store Editor for rich detail
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2
  });
  const desktopPage = await desktopContext.newPage();
  try {
    await desktopPage.goto('http://localhost:3000/pro', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await desktopPage.waitForTimeout(3000);
    await desktopPage.screenshot({ path: 'promo-video/cap_editor_desktop.png' });
  } catch (e) {
    console.log('Desktop error:', e.message);
  }

  await browser.close();
  console.log('Screenshots captured successfully!');
}

captureScreens().catch(err => console.error(err));
