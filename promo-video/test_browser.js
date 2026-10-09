const { chromium } = require('@playwright/test');

async function testEdge() {
  for (const ch of ['msedge', 'chrome']) {
    try {
      console.log(`Testing channel: ${ch} ...`);
      const browser = await chromium.launch({ channel: ch, headless: true });
      console.log(`Success with ${ch}!`);
      const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
      await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });
      await page.screenshot({ path: 'promo-video/captured_landing.png' });
      console.log('Captured landing screenshot successfully!');
      await browser.close();
      return;
    } catch (e) {
      console.log(`Channel ${ch} failed:`, e.message);
    }
  }
}

testEdge();
