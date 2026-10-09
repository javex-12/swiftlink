const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function renderFullPromo() {
  console.log('=== SwiftLink Pro Cinema Render Pipeline ===');
  const tStart = Date.now();

  const framesDirA = path.join(__dirname, 'frames_A');
  const framesDirB = path.join(__dirname, 'frames_B');
  if (!fs.existsSync(framesDirA)) fs.mkdirSync(framesDirA, { recursive: true });
  if (!fs.existsSync(framesDirB)) fs.mkdirSync(framesDirB, { recursive: true });

  const TOTAL_FRAMES = 960; // 32.0s * 30fps
  const HOOK_FRAMES = 90;   // First 3.0s (frames 0 to 89)

  console.log('Launching headless browser...');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });

  const engineUrl = 'file:///' + path.resolve(__dirname, 'render_engine.html').replace(/\\/g, '/');

  // Parallel workers for rendering
  const NUM_WORKERS = 3;
  const chunkSize = Math.ceil(TOTAL_FRAMES / NUM_WORKERS);

  console.log(`Rendering 960 frames across ${NUM_WORKERS} workers...`);

  const workerPromises = [];
  for (let w = 0; w < NUM_WORKERS; w++) {
    const startF = w * chunkSize;
    const endF = Math.min(TOTAL_FRAMES, (w + 1) * chunkSize);

    workerPromises.push((async (workerId, startFrame, endFrame) => {
      const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
      await page.goto(engineUrl, { waitUntil: 'load' });
      await page.waitForTimeout(500);

      for (let f = startFrame; f < endFrame; f++) {
        const frameNumStr = String(f).padStart(4, '0');
        const dataUrl = await page.evaluate((frameIdx) => {
          window.renderFrame(frameIdx, false);
          return canvas.toDataURL('image/jpeg', 0.95);
        }, f);

        const base64Data = dataUrl.replace(/^data:image\/jpeg;base64,/, '');
        const buf = Buffer.from(base64Data, 'base64');
        fs.writeFileSync(path.join(framesDirA, `frame_${frameNumStr}.jpg`), buf);

        if ((f - startFrame + 1) % 60 === 0 || f === endFrame - 1) {
          console.log(`[Worker ${workerId}] Rendered frame ${f + 1}/${endFrame} (${(((f - startFrame + 1) / (endFrame - startFrame)) * 100).toFixed(0)}%)`);
        }
      }
      await page.close();
    })(w, startF, endF));
  }

  await Promise.all(workerPromises);
  console.log('Completed Hook A frame sequence rendering!');

  // Render Hook B frames (only first 90 frames: 0.0s - 3.0s)
  console.log('Rendering Hook B unique frames (0 to 89)...');
  const pageB = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  await pageB.goto(engineUrl, { waitUntil: 'load' });
  await pageB.waitForTimeout(500);

  for (let f = 0; f < HOOK_FRAMES; f++) {
    const frameNumStr = String(f).padStart(4, '0');
    const dataUrl = await pageB.evaluate((frameIdx) => {
      window.renderFrame(frameIdx, true); // isHookB = true
      return canvas.toDataURL('image/jpeg', 0.95);
    }, f);

    const base64Data = dataUrl.replace(/^data:image\/jpeg;base64,/, '');
    const buf = Buffer.from(base64Data, 'base64');
    fs.writeFileSync(path.join(framesDirB, `frame_${frameNumStr}.jpg`), buf);
  }
  await pageB.close();

  // Copy remaining frames (90 to 959) from frames_A to frames_B (hardlink or copy)
  console.log('Linking shared frames for Hook B...');
  for (let f = HOOK_FRAMES; f < TOTAL_FRAMES; f++) {
    const frameNumStr = String(f).padStart(4, '0');
    const src = path.join(framesDirA, `frame_${frameNumStr}.jpg`);
    const dst = path.join(framesDirB, `frame_${frameNumStr}.jpg`);
    try {
      fs.linkSync(src, dst);
    } catch {
      fs.copyFileSync(src, dst);
    }
  }

  await browser.close();
  const renderTime = ((Date.now() - tStart) / 1000).toFixed(1);
  console.log(`All frames generated in ${renderTime}s! Now encoding MP4 with FFmpeg...`);

  // ENCODE DELIVERABLE 1: promo-video/swiftlink_promo_32s.mp4 (Hook A)
  const outA = path.join(__dirname, 'swiftlink_promo_32s.mp4');
  const audioMaster = path.join(__dirname, 'soundtrack_master.wav');
  const ffmpegCmdA = `ffmpeg -y -framerate 30 -i "${path.join(framesDirA, 'frame_%04d.jpg')}" -i "${audioMaster}" -c:v libx264 -profile:v high -level 4.2 -preset medium -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart "${outA}"`;
  
  console.log('Encoding Deliverable A: swiftlink_promo_32s.mp4...');
  execSync(ffmpegCmdA, { stdio: 'inherit' });

  // ENCODE DELIVERABLE 2: promo-video/swiftlink_promo_hookB.mp4 (Hook B)
  const outB = path.join(__dirname, 'swiftlink_promo_hookB.mp4');
  const ffmpegCmdB = `ffmpeg -y -framerate 30 -i "${path.join(framesDirB, 'frame_%04d.jpg')}" -i "${audioMaster}" -c:v libx264 -profile:v high -level 4.2 -preset medium -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -ar 48000 -shortest -movflags +faststart "${outB}"`;

  console.log('Encoding Deliverable B: swiftlink_promo_hookB.mp4...');
  execSync(ffmpegCmdB, { stdio: 'inherit' });

  const totalTime = ((Date.now() - tStart) / 1000).toFixed(1);
  console.log(`=== FINISHED ALL DELIVERABLES IN ${totalTime}s ===`);
}

renderFullPromo().catch(console.error);
