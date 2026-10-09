const { chromium } = require('@playwright/test');
const fs = require('fs');

async function testSpeed() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  
  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <body style="margin:0; background:#000;">
        <canvas id="c" width="1080" height="1920"></canvas>
        <script>
          const c = document.getElementById('c');
          const ctx = c.getContext('2d');
          window.draw = function(f) {
            ctx.fillStyle = '#0a1210';
            ctx.fillRect(0, 0, 1080, 1920);
            ctx.fillStyle = '#19c37d';
            ctx.fillRect(100 + (f % 500), 500, 300, 200);
          };
        </script>
      </body>
    </html>
  `);

  console.log('Testing 30 frames with toDataURL (JPEG)...');
  const t0 = Date.now();
  for (let i = 0; i < 30; i++) {
    const dataUrl = await page.evaluate((frame) => {
      window.draw(frame);
      return c.toDataURL('image/jpeg', 0.92);
    }, i);
    const buf = Buffer.from(dataUrl.slice(23), 'base64');
  }
  const t1 = Date.now();
  console.log(`30 frames with toDataURL took ${(t1 - t0)}ms (${((t1 - t0) / 30).toFixed(1)}ms per frame)`);

  console.log('Testing 30 frames with page.screenshot (JPEG)...');
  const t2 = Date.now();
  for (let i = 0; i < 30; i++) {
    await page.evaluate((frame) => window.draw(frame), i);
    await page.screenshot({ type: 'jpeg', quality: 92 });
  }
  const t3 = Date.now();
  console.log(`30 frames with page.screenshot took ${(t3 - t2)}ms (${((t3 - t2) / 30).toFixed(1)}ms per frame)`);

  await browser.close();
}

testSpeed().catch(console.error);
