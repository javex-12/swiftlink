const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function renderContactSheet() {
  console.log('Launching browser for contact sheet extraction...');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });

  const engineUrl = 'file:///' + path.resolve(__dirname, 'render_engine.html').replace(/\\/g, '/');
  await page.goto(engineUrl, { waitUntil: 'load' });
  await page.waitForTimeout(1000);

  const sampleFrames = [
    { frame: 20, name: 'frame_01_0.67s_hook.png' },
    { frame: 60, name: 'frame_02_2.00s_hookA_caption.png' },
    { frame: 80, name: 'frame_03_2.67s_turn_silence.png' },
    { frame: 110, name: 'frame_04_3.67s_turn_logo_reveal.png' },
    { frame: 195, name: 'frame_05_6.50s_build_products_in.png' },
    { frame: 285, name: 'frame_06_9.50s_build_complete_store.png' },
    { frame: 360, name: 'frame_07_12.00s_customer_status_share.png' },
    { frame: 450, name: 'frame_08_15.00s_customer_order_bubble.png' },
    { frame: 560, name: 'frame_09_18.67s_wa_chat_vendor_reply.png' },
    { frame: 630, name: 'frame_10_21.00s_wa_chat_dispatch_confirm.png' },
    { frame: 740, name: 'frame_11_24.67s_payoff_orders_list.png' },
    { frame: 920, name: 'frame_12_30.67s_cta_endcard.png' }
  ];

  const framesDir = path.join(__dirname, 'sample_frames');
  if (!fs.existsSync(framesDir)) fs.mkdirSync(framesDir);

  for (const sf of sampleFrames) {
    console.log(`Rendering frame ${sf.frame} (${sf.name})...`);
    await page.evaluate((f) => {
      window.renderFrame(f, false);
    }, sf.frame);
    await page.screenshot({ path: path.join(framesDir, sf.name), type: 'png' });
  }

  // Also render Hook B sample at frame 60
  await page.evaluate((f) => {
    window.renderFrame(f, true);
  }, 60);
  await page.screenshot({ path: path.join(framesDir, 'frame_02b_hookB_sample.png'), type: 'png' });

  await browser.close();
  console.log('Sample frames captured!');

  // Combine the 12 key frames into a 4x3 contact sheet using FFmpeg tile filter
  console.log('Generating contact sheet montage with FFmpeg...');
  const inputArgs = sampleFrames.map(sf => `-i "${path.join(framesDir, sf.name)}"`).join(' ');
  const filterGraph = `"[0][1][2][3][4][5][6][7][8][9][10][11]xstack=inputs=12:layout=0_0|w0_0|w0+w1_0|w0+w1+w2_0|0_h0|w0_h0|w0+w1_h0|w0+w1+w2_h0|0_h0+h1|w0_h0+h1|w0+w1_h0+h1|w0+w1+w2_h0+h1,scale=1920:2560"`;
  
  const contactSheetPath = path.join(__dirname, 'contact_sheet.png');
  const ffmpegCmd = `ffmpeg -y ${inputArgs} -filter_complex ${filterGraph} "${contactSheetPath}"`;
  
  try {
    execSync(ffmpegCmd, { stdio: 'inherit' });
    console.log('Generated promo-video/contact_sheet.png successfully!');
  } catch (err) {
    console.error('FFmpeg montage failed:', err.message);
  }
}

renderContactSheet().catch(console.error);
