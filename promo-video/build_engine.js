const fs = require('fs');
const path = require('path');

const logoPng = fs.readFileSync(path.join(__dirname, '../public/logo.png')).toString('base64');
const logoDataUri = `data:image/png;base64,${logoPng}`;

console.log('Logo Data URI length:', logoDataUri.length);

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    background: #000;
    width: 1080px;
    height: 1920px;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  }
  #canvas {
    width: 1080px;
    height: 1920px;
    display: block;
  }
</style>
</head>
<body>
<canvas id="canvas" width="1080" height="1920"></canvas>
<script>
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const logoImg = new Image();
logoImg.src = "${logoDataUri}";

let imagesLoaded = false;
logoImg.onload = () => { imagesLoaded = true; };

// ─── BRAND TOKENS (From SwiftLink design tokens) ───────────────────────────
const C = {
  bg: '#0A1210',
  surface: '#111C18',
  surface2: '#14231D',
  border: '#1E2D27',
  borderStrong: '#2A4237',
  accent: '#19C37D',
  accentHover: '#16B070',
  accentDark: '#04140D',
  accentSubtle: '#142E23',
  text: '#E8F1EC',
  textMuted: '#9DB3A8',
  textSubtle: '#5C7C6D',
  waGreen: '#25D366',
  waDark: '#075E54',
  waLight: '#DCF8C6',
  waBg: '#0B141A',
  waBubbleIn: '#202C33',
  waBubbleOut: '#005C4B'
};

// ─── MOTION EASING ─────────────────────────────────────────────────────────
function easeOutQuad(x) { return 1 - (1 - x) * (1 - x); }
function easeInOutQuad(x) { return x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2; }
function easeOutBack(x) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}
function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ─── VECTOR LUXURY PRODUCT ICONS (Sleek minimalist brand art) ──────────────
function drawShirtIcon(ctx, x, y, size = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size, size);
  ctx.strokeStyle = '#9DB3A8';
  ctx.fillStyle = 'rgba(25, 195, 125, 0.12)';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  // Collar
  ctx.moveTo(-16, -24);
  ctx.lineTo(0, -12);
  ctx.lineTo(16, -24);
  // Shoulders & short sleeves
  ctx.lineTo(38, -12);
  ctx.lineTo(30, 8);
  ctx.lineTo(20, 4);
  // Torso
  ctx.lineTo(20, 28);
  ctx.lineTo(-20, 28);
  ctx.lineTo(-20, 4);
  ctx.lineTo(-30, 8);
  ctx.lineTo(-38, -12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Subtle collar crease & button line
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(0, 16);
  ctx.strokeStyle = '#19C37D';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  ctx.restore();
}

function drawToteIcon(ctx, x, y, size = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size, size);
  ctx.strokeStyle = '#9DB3A8';
  ctx.fillStyle = 'rgba(25, 195, 125, 0.12)';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Handles
  ctx.beginPath();
  ctx.arc(0, -14, 14, Math.PI, 0);
  ctx.stroke();

  // Bag body (trapezoid with rounded corners)
  roundRect(ctx, -24, -8, 48, 38, 6);
  ctx.fill();
  ctx.stroke();

  // Accent horizontal leather stitch
  ctx.beginPath();
  ctx.moveTo(-20, 4);
  ctx.lineTo(20, 4);
  ctx.strokeStyle = '#19C37D';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  ctx.restore();
}

function drawScarfIcon(ctx, x, y, size = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size, size);
  ctx.strokeStyle = '#9DB3A8';
  ctx.fillStyle = 'rgba(25, 195, 125, 0.12)';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.arc(0, -8, 16, 0, Math.PI * 2);
  ctx.stroke();

  // Folded tails
  ctx.beginPath();
  ctx.moveTo(-8, 6);
  ctx.lineTo(-12, 26);
  ctx.lineTo(-2, 24);
  ctx.lineTo(0, 8);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(4, 6);
  ctx.lineTo(10, 28);
  ctx.lineTo(18, 25);
  ctx.lineTo(12, 6);
  ctx.strokeStyle = '#19C37D';
  ctx.stroke();

  ctx.restore();
}

function drawCandleIcon(ctx, x, y, size = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size, size);
  ctx.strokeStyle = '#9DB3A8';
  ctx.fillStyle = 'rgba(25, 195, 125, 0.12)';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Candle Jar
  roundRect(ctx, -18, -10, 36, 40, 6);
  ctx.fill();
  ctx.stroke();

  // Flame
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.lineTo(0, -15);
  ctx.strokeStyle = '#8696a0';
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.quadraticCurveTo(6, -23, 0, -30);
  ctx.quadraticCurveTo(-6, -23, 0, -16);
  ctx.fillStyle = '#E8B93A';
  ctx.fill();

  ctx.restore();
}

// ─── ATMOSPHERIC BACKGROUND & LIGHTING ─────────────────────────────────────
function drawCinematicBackground(ctx, f, accentPulse = 0) {
  // Deep obsidian green base
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, 1080, 1920);

  // Radial volumetric glow from upper-middle
  const g1 = ctx.createRadialGradient(540, 640, 40, 540, 640, 900);
  g1.addColorStop(0, \`rgba(25, 195, 125, \${0.10 + accentPulse * 0.10})\`);
  g1.addColorStop(0.45, \`rgba(17, 28, 24, \${0.25 + accentPulse * 0.08})\`);
  g1.addColorStop(1, 'rgba(10, 18, 16, 0)');
  ctx.fillStyle = g1;
  ctx.fillRect(0, 0, 1080, 1920);

  // Anamorphic horizontal light streaks
  const g2 = ctx.createLinearGradient(0, 720, 1080, 720);
  g2.addColorStop(0, 'rgba(25, 195, 125, 0)');
  g2.addColorStop(0.5, \`rgba(25, 195, 125, \${0.06 + accentPulse * 0.08})\`);
  g2.addColorStop(1, 'rgba(25, 195, 125, 0)');
  ctx.fillStyle = g2;
  ctx.fillRect(0, 700, 1080, 40);

  // Deep luxury vignette
  const vig = ctx.createRadialGradient(540, 960, 550, 540, 960, 1150);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.72)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, 1080, 1920);
}

// ─── PHOTOREAL PHONE MOCKUP (Specular glass, bevels, screen glow) ─────────
function drawPhoneShell(ctx, x, y, w, h, scale = 1, rotDeg = 0, screenT = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate((rotDeg * Math.PI) / 180);
  ctx.scale(scale, scale);

  // Ambient screen glow spilling into environment
  const glow = ctx.createRadialGradient(0, 0, w * 0.3, 0, 0, w * 0.9);
  glow.addColorStop(0, 'rgba(25, 195, 125, 0.16)');
  glow.addColorStop(0.7, 'rgba(20, 46, 35, 0.08)');
  glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(-w, -h * 0.7, w * 2, h * 1.4);

  // Deep contact drop shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
  ctx.shadowBlur = 70;
  ctx.shadowOffsetY = 35;

  // Phone outer bezel (Titanium Obsidian)
  roundRect(ctx, -w/2, -h/2, w, h, 56);
  ctx.fillStyle = '#080e0c';
  ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  // Metallic rim highlight border
  ctx.lineWidth = 4;
  const rimGrad = ctx.createLinearGradient(-w/2, -h/2, w/2, h/2);
  rimGrad.addColorStop(0, 'rgba(255, 255, 255, 0.32)');
  rimGrad.addColorStop(0.3, 'rgba(30, 45, 39, 0.9)');
  rimGrad.addColorStop(0.7, 'rgba(25, 195, 125, 0.45)');
  rimGrad.addColorStop(1, 'rgba(255, 255, 255, 0.18)');
  ctx.strokeStyle = rimGrad;
  ctx.stroke();

  // Inner display chassis
  const pad = 12;
  const sw = w - pad * 2;
  const sh = h - pad * 2;
  roundRect(ctx, -sw/2, -sh/2, sw, sh, 46);
  ctx.fillStyle = '#0a1210';
  ctx.fill();

  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#1e2d27';
  ctx.stroke();

  ctx.restore();
}

function drawGlassSheen(ctx, w, h, animProgress = 0) {
  // Diagonal glass reflection highlight traversing subtly across the screen
  ctx.save();
  const sheenX = -w + (animProgress % 1.0) * (w * 2.5);
  const sheen = ctx.createLinearGradient(sheenX, -h/2, sheenX + 220, h/2);
  sheen.addColorStop(0, 'rgba(255, 255, 255, 0)');
  sheen.addColorStop(0.48, 'rgba(255, 255, 255, 0.035)');
  sheen.addColorStop(0.52, 'rgba(25, 195, 125, 0.05)');
  sheen.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = sheen;
  ctx.fillRect(-w/2, -h/2, w, h);
  ctx.restore();
}

function drawDynamicIsland(ctx, cx, topY) {
  roundRect(ctx, cx - 65, topY, 130, 26, 13);
  ctx.fillStyle = '#040807';
  ctx.fill();
  ctx.strokeStyle = '#14231d';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Micro lens dot
  ctx.beginPath();
  ctx.arc(cx + 42, topY + 13, 4.5, 0, Math.PI * 2);
  ctx.fillStyle = '#0c1612';
  ctx.fill();
}

// ─── BURNED-IN KINETIC CAPTIONS (TikTok Safe Zone Compliant) ───────────────
function drawCaption(ctx, titleText, highlightText = '', progress = 1) {
  const y = 1430; // TikTok safe zone center (Y: 1390-1470)
  const alpha = clamp(progress * 2, 0, 1);
  const slideY = (1 - easeOutBack(clamp(progress, 0, 1))) * 35;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(540, y + slideY);

  ctx.font = '900 42px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const fullText = highlightText ? \`\${titleText} \${highlightText}\` : titleText;
  const tw = ctx.measureText(fullText).width;
  const pw = Math.min(940, tw + 70);

  ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 8;

  roundRect(ctx, -pw/2, -45, pw, 90, 22);
  ctx.fillStyle = 'rgba(10, 18, 16, 0.95)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(30, 45, 39, 0.95)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.shadowColor = 'transparent';
  ctx.textBaseline = 'middle';

  if (!highlightText) {
    ctx.textAlign = 'center';
    ctx.fillStyle = C.text;
    ctx.fillText(titleText, 0, 0);
  } else {
    const w1 = ctx.measureText(titleText + ' ').width;
    const w2 = ctx.measureText(highlightText).width;
    const totalW = w1 + w2;
    const startX = -totalW / 2;

    ctx.textAlign = 'left';
    ctx.fillStyle = C.text;
    ctx.fillText(titleText, startX, 0);

    ctx.fillStyle = C.accent;
    ctx.fillText(highlightText, startX + w1, 0);
  }

  ctx.restore();
}

// Fine cinematic grain overlay
function applyFilmGrain(ctx, frameIndex) {
  // Subtle procedural micro noise in bottom and corners
  const step = 8;
  const seed = (frameIndex * 1337) % 1000;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.012)';
  for (let x = 0; x < 1080; x += 120) {
    for (let y = 0; y < 1920; y += 120) {
      if (((x * 31 + y * 17 + seed) % 7) === 0) {
        ctx.fillRect(x, y, 4, 4);
      }
    }
  }
}

// ─── MASTER FRAME RENDER DISPATCHER ─────────────────────────────────────────
window.renderFrame = function(frameIndex, isHookB = false) {
  const t = frameIndex / 30.0;
  ctx.clearRect(0, 0, 1080, 1920);

  // ══════════════════════════════════════════════════════════════════════════
  // SCENE 1: HOOK (0.00s – 2.50s / Frames 0 – 74)
  // ══════════════════════════════════════════════════════════════════════════
  if (t < 2.50) {
    const sceneP = t / 2.50;
    const shakeFreq = (t % 0.35 < 0.08) ? Math.sin(t * 120) * 5 : 0;
    
    ctx.save();
    ctx.translate(shakeFreq, shakeFreq * 0.7);
    drawCinematicBackground(ctx, frameIndex, sceneP * 0.35);

    const dms = [
      { text: "How much for the linen shirt?", time: "10:14 AM", enterT: 0.10, y: 460 },
      { text: "Price for size 42?", time: "10:15 AM", enterT: 0.40, y: 565 },
      { text: "Is this still available pls?", time: "10:15 AM", enterT: 0.75, y: 670 },
      { text: "Can I see real pictures of the bag?", time: "10:16 AM", enterT: 1.10, y: 775 },
      { text: "How much last? DM me", time: "10:16 AM", enterT: 1.45, y: 880 }
    ];

    dms.forEach(dm => {
      if (t >= dm.enterT) {
        const itemP = clamp((t - dm.enterT) / 0.22, 0, 1);
        const animScale = easeOutBack(itemP);
        const animAlpha = clamp(itemP * 1.5, 0, 1);

        ctx.save();
        ctx.globalAlpha = animAlpha;
        ctx.translate(540, dm.y);
        ctx.scale(animScale, animScale);

        const bw = 740;
        const bh = 82;
        roundRect(ctx, -bw/2, -bh/2, bw, bh, 20);
        ctx.fillStyle = C.surface;
        ctx.fill();
        ctx.strokeStyle = C.border;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // WhatsApp green dot
        ctx.beginPath();
        ctx.arc(-bw/2 + 35, 0, 8, 0, Math.PI * 2);
        ctx.fillStyle = C.waGreen;
        ctx.fill();

        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.font = '600 28px -apple-system, BlinkMacSystemFont, sans-serif';
        ctx.fillStyle = C.text;
        ctx.fillText(dm.text, -bw/2 + 65, 0);

        ctx.textAlign = 'right';
        ctx.font = '500 20px -apple-system, sans-serif';
        ctx.fillStyle = C.textMuted;
        ctx.fillText(dm.time, bw/2 - 25, 0);

        ctx.restore();
      }
    });

    // Unread counter badge spinning past 50+
    const unreadCount = Math.min(52, Math.floor(1 + (t / 1.8) * 51));
    ctx.save();
    ctx.translate(540, 340);
    roundRect(ctx, -145, -32, 290, 64, 32);
    ctx.fillStyle = 'rgba(220, 38, 38, 0.92)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '900 28px -apple-system, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(\`\${unreadCount} UNREAD DMs\`, 0, 0);
    ctx.restore();

    // Hook Caption
    const captionP = clamp((t - 0.25) / 0.4, 0, 1);
    if (!isHookB) {
      drawCaption(ctx, "You're losing sales", "in your DMs.", captionP);
    } else {
      drawCaption(ctx, "Replying to 100 DMs", "a day manually?", captionP);
    }

    ctx.restore();
    applyFilmGrain(ctx, frameIndex);
    return;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SCENE 2: THE TURN (2.50s – 5.00s / Frames 75 – 149)
  // ══════════════════════════════════════════════════════════════════════════
  if (t < 5.00) {
    if (t < 2.80) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 1080, 1920);
      return;
    }

    const sceneT = t - 2.80; // 0.0s to 2.20s
    drawCinematicBackground(ctx, frameIndex, 0.55);

    const lineP = clamp(sceneT / 0.45, 0, 1);
    const lineEase = easeOutQuad(lineP);
    const lineWidth = lineEase * 840;

    ctx.save();
    ctx.translate(540, 760);

    if (sceneT < 0.6) {
      const gLine = ctx.createLinearGradient(-lineWidth/2, 0, lineWidth/2, 0);
      gLine.addColorStop(0, 'rgba(25, 195, 125, 0)');
      gLine.addColorStop(0.5, C.accent);
      gLine.addColorStop(1, 'rgba(25, 195, 125, 0)');
      ctx.fillStyle = gLine;
      ctx.fillRect(-lineWidth/2, -4, lineWidth, 8);

      ctx.shadowColor = C.accent;
      ctx.shadowBlur = 30;
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(lineWidth/2 - 20, -6, 20, 12);
    }

    if (sceneT >= 0.35) {
      const logoP = clamp((sceneT - 0.35) / 0.55, 0, 1);
      const logoScale = easeOutBack(logoP);
      const logoAlpha = clamp(logoP * 1.5, 0, 1);

      ctx.save();
      ctx.globalAlpha = logoAlpha;
      ctx.scale(logoScale, logoScale);

      const bloom = ctx.createRadialGradient(0, 0, 20, 0, 0, 260);
      bloom.addColorStop(0, 'rgba(25, 195, 125, 0.5)');
      bloom.addColorStop(1, 'rgba(25, 195, 125, 0)');
      ctx.fillStyle = bloom;
      ctx.beginPath();
      ctx.arc(0, 0, 260, 0, Math.PI * 2);
      ctx.fill();

      if (imagesLoaded) {
        ctx.drawImage(logoImg, -140, -140, 280, 280);
      }

      ctx.restore();

      ctx.save();
      ctx.globalAlpha = clamp((sceneT - 0.6) / 0.4, 0, 1);
      ctx.font = '900 68px -apple-system, BlinkMacSystemFont, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = C.text;
      ctx.fillText("SWIFTLINK", 0, 200);

      ctx.font = '700 24px -apple-system, sans-serif';
      ctx.fillStyle = C.accent;
      ctx.letterSpacing = '6px';
      ctx.fillText("ONE LINK. ALL YOUR ORDERS.", 0, 255);
      ctx.restore();
    }

    ctx.restore();

    const capP = clamp((sceneT - 0.5) / 0.45, 0, 1);
    drawCaption(ctx, "What if your whole shop was", "ONE link?", capP);
    applyFilmGrain(ctx, frameIndex);
    return;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SCENE 3: THE BUILD (5.00s – 11.00s / Frames 150 – 329)
  // ══════════════════════════════════════════════════════════════════════════
  if (t < 11.00) {
    const sceneT = t - 5.00; // 0.0s to 6.0s
    drawCinematicBackground(ctx, frameIndex, 0.35);

    const dolly = 0.98 + (sceneT / 6.0) * 0.07;
    const phoneX = 540;
    const phoneY = 740;

    drawPhoneShell(ctx, phoneX, phoneY, 660, 1040, dolly, -1.2, sceneT / 6.0);

    ctx.save();
    ctx.translate(phoneX, phoneY);
    ctx.scale(dolly, dolly);

    // Screen clip
    roundRect(ctx, -315, -505, 630, 1010, 44);
    ctx.clip();

    ctx.fillStyle = '#0a1210';
    ctx.fillRect(-315, -505, 630, 1010);
    drawDynamicIsland(ctx, 0, -495);

    // Store Header: Kemi Studio
    ctx.textAlign = 'center';
    ctx.font = '800 28px -apple-system, sans-serif';
    ctx.fillStyle = C.text;
    ctx.fillText("Kemi Studio", 0, -420);

    ctx.font = '500 18px -apple-system, sans-serif';
    ctx.fillStyle = C.textMuted;
    ctx.fillText("swiftlinkpro.vercel.app/kemistudio", 0, -390);

    // Onboarding progress indicator
    roundRect(ctx, -270, -360, 540, 55, 14);
    ctx.fillStyle = C.surface2;
    ctx.fill();
    ctx.strokeStyle = C.border;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.font = '700 18px -apple-system, sans-serif';
    ctx.fillStyle = C.accent;
    ctx.fillText("✓ STORE SETUP: 4 OF 4 COMPLETE", -245, -325);

    // 4 Live Product Cards popping into place with vector luxury icons
    const products = [
      { name: "Linen Shirt", price: "₦18,500", drawIcon: drawShirtIcon, delay: 0.3 },
      { name: "Leather Tote", price: "₦24,000", drawIcon: drawToteIcon, delay: 1.1 },
      { name: "Silk Scarf", price: "₦9,200", drawIcon: drawScarfIcon, delay: 1.9 },
      { name: "Amber Candle", price: "₦7,500", drawIcon: drawCandleIcon, delay: 2.7 }
    ];

    const gridPositions = [
      { x: -140, y: -190 },
      { x: 140, y: -190 },
      { x: -140, y: 30 },
      { x: 140, y: 30 }
    ];

    products.forEach((p, idx) => {
      const pos = gridPositions[idx];
      if (sceneT >= p.delay) {
        const pP = clamp((sceneT - p.delay) / 0.35, 0, 1);
        const cardScale = easeOutBack(pP);

        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.scale(cardScale, cardScale);

        // Product Card Shell
        roundRect(ctx, -120, -100, 240, 200, 18);
        ctx.fillStyle = C.surface;
        ctx.fill();
        ctx.strokeStyle = C.borderStrong;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Thumbnail placeholder with vector art
        roundRect(ctx, -105, -85, 210, 105, 12);
        ctx.fillStyle = C.surface2;
        ctx.fill();

        p.drawIcon(ctx, 0, -32, 1.15);

        ctx.textAlign = 'left';
        ctx.font = '700 20px -apple-system, sans-serif';
        ctx.fillStyle = C.text;
        ctx.fillText(p.name, -100, 48);

        ctx.font = '800 22px -apple-system, sans-serif';
        ctx.fillStyle = C.accent;
        ctx.fillText(p.price, -100, 78);

        ctx.restore();
      }
    });

    // "Chat on WhatsApp" main button on store
    if (sceneT >= 3.4) {
      const btnP = clamp((sceneT - 3.4) / 0.35, 0, 1);
      ctx.save();
      ctx.translate(0, 210);
      ctx.scale(easeOutBack(btnP), easeOutBack(btnP));

      roundRect(ctx, -260, -32, 520, 64, 18);
      ctx.fillStyle = C.accent;
      ctx.fill();

      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '800 22px -apple-system, sans-serif';
      ctx.fillStyle = C.accentDark;
      ctx.fillText("Chat on WhatsApp", 0, 0);

      ctx.restore();
    }

    // Glass sheen sweep
    drawGlassSheen(ctx, 630, 1010, sceneT * 0.2);

    ctx.restore(); // end phone screen clip

    const capP = clamp(sceneT / 0.45, 0, 1);
    drawCaption(ctx, "Build your store", "in minutes.", capP);
    applyFilmGrain(ctx, frameIndex);
    return;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SCENE 4: CUSTOMER ORDERS ON WHATSAPP (11.00s – 17.00s / Frames 330 – 509)
  // ══════════════════════════════════════════════════════════════════════════
  if (t < 17.00) {
    const sceneT = t - 11.00; // 0.0s to 6.0s
    drawCinematicBackground(ctx, frameIndex, 0.4);

    const phoneX = 540;
    const phoneY = 740;
    const dolly = 1.02 + Math.sin(sceneT * 0.4) * 0.02;

    drawPhoneShell(ctx, phoneX, phoneY, 660, 1040, dolly, 1.2, sceneT / 6.0);

    ctx.save();
    ctx.translate(phoneX, phoneY);
    ctx.scale(dolly, dolly);

    roundRect(ctx, -315, -505, 630, 1010, 44);
    ctx.clip();

    ctx.fillStyle = '#0a1210';
    ctx.fillRect(-315, -505, 630, 1010);
    drawDynamicIsland(ctx, 0, -495);

    // WhatsApp Status Link Share (0.0s – 2.2s)
    if (sceneT < 2.2) {
      ctx.fillStyle = '#0b141a';
      ctx.fillRect(-315, -505, 630, 1010);

      ctx.textAlign = 'left';
      ctx.font = '700 22px -apple-system, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.fillText("My Status • Just now", -260, -420);

      roundRect(ctx, -260, -220, 520, 360, 24);
      ctx.fillStyle = C.surface;
      ctx.fill();
      ctx.strokeStyle = C.borderStrong;
      ctx.lineWidth = 2;
      ctx.stroke();

      roundRect(ctx, -240, -200, 480, 200, 16);
      ctx.fillStyle = C.surface2;
      ctx.fill();

      if (imagesLoaded) {
        ctx.drawImage(logoImg, -60, -160, 120, 120);
      }

      ctx.font = '800 24px -apple-system, sans-serif';
      ctx.fillStyle = C.text;
      ctx.fillText("Kemi Studio Official Store", -240, 45);

      ctx.font = '500 18px -apple-system, sans-serif';
      ctx.fillStyle = C.accent;
      ctx.fillText("swiftlinkpro.vercel.app/kemistudio", -240, 85);

      roundRect(ctx, -240, 110, 480, 50, 14);
      ctx.fillStyle = 'rgba(25, 195, 125, 0.15)';
      ctx.fill();
      ctx.font = '700 18px -apple-system, sans-serif';
      ctx.fillStyle = C.accent;
      ctx.fillText("👆 Tap link to shop", -240 + 160, 142);
    } 
    // Storefront detail & pre-filled WhatsApp Order tap (2.2s – 6.0s)
    else {
      roundRect(ctx, -270, -440, 540, 420, 20);
      ctx.fillStyle = C.surface;
      ctx.fill();
      ctx.strokeStyle = C.border;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Linen Shirt Hero Graphic
      roundRect(ctx, -250, -420, 500, 260, 14);
      ctx.fillStyle = C.surface2;
      ctx.fill();
      drawShirtIcon(ctx, 0, -290, 2.6);

      ctx.textAlign = 'left';
      ctx.font = '800 28px -apple-system, sans-serif';
      ctx.fillStyle = C.text;
      ctx.fillText("Linen Shirt", -250, -110);

      ctx.font = '800 26px -apple-system, sans-serif';
      ctx.fillStyle = C.accent;
      ctx.fillText("₦18,500", -250, -70);

      ctx.font = '700 18px -apple-system, sans-serif';
      ctx.fillStyle = C.textMuted;
      ctx.fillText("SELECT SIZE", -250, -25);

      ['S', 'M', 'L', 'XL'].forEach((sz, idx) => {
        const sx = -250 + idx * 70;
        roundRect(ctx, sx, -5, 55, 45, 12);
        if (sz === 'M') {
          ctx.fillStyle = C.accent;
          ctx.fill();
          ctx.fillStyle = C.accentDark;
        } else {
          ctx.fillStyle = C.surface2;
          ctx.fill();
          ctx.fillStyle = C.text;
        }
        ctx.textAlign = 'center';
        ctx.font = '700 18px -apple-system, sans-serif';
        ctx.fillText(sz, sx + 27, 23);
      });

      // Tapped action: Order lands in WhatsApp
      const waP = clamp((sceneT - 3.2) / 0.45, 0, 1);
      if (waP > 0) {
        const waY = 280 - (1 - easeOutBack(waP)) * 60;
        roundRect(ctx, -270, waY - 140, 540, 180, 22);
        ctx.fillStyle = 'rgba(17, 28, 24, 0.98)';
        ctx.fill();
        ctx.strokeStyle = C.accent;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.textAlign = 'left';
        ctx.font = '700 16px -apple-system, sans-serif';
        ctx.fillStyle = C.accent;
        ctx.fillText("● PRE-FILLED WHATSAPP ORDER", -245, waY - 100);

        ctx.font = '600 20px -apple-system, sans-serif';
        ctx.fillStyle = C.text;
        ctx.fillText('"Hi, I am interested in Linen Shirt', -245, waY - 65);
        ctx.fillText('(₦18,500) - Size M."', -245, waY - 35);

        ctx.textAlign = 'right';
        ctx.font = '500 16px -apple-system, sans-serif';
        ctx.fillStyle = C.accent;
        ctx.fillText("10:42 AM  ✓✓", 240, waY - 5);
      }
    }

    drawGlassSheen(ctx, 630, 1010, sceneT * 0.25);

    ctx.restore(); // end phone screen clip

    const capP = clamp(sceneT / 0.45, 0, 1);
    drawCaption(ctx, "Customers order straight", "on WhatsApp.", capP);
    applyFilmGrain(ctx, frameIndex);
    return;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SCENE 5: VENDOR STAYS IN CONTROL (17.00s – 22.00s / Frames 510 – 659)
  // ══════════════════════════════════════════════════════════════════════════
  if (t < 22.00) {
    const sceneT = t - 17.00; // 0.0s to 5.0s
    drawCinematicBackground(ctx, frameIndex, 0.35);

    const phoneX = 540;
    const phoneY = 740;
    const dolly = 1.0;

    drawPhoneShell(ctx, phoneX, phoneY, 660, 1040, dolly, 0, sceneT / 5.0);

    ctx.save();
    ctx.translate(phoneX, phoneY);

    roundRect(ctx, -315, -505, 630, 1010, 44);
    ctx.clip();

    ctx.fillStyle = '#0b141a';
    ctx.fillRect(-315, -505, 630, 1010);
    drawDynamicIsland(ctx, 0, -495);

    // WhatsApp Chat Header
    roundRect(ctx, -315, -450, 630, 85, 0);
    ctx.fillStyle = '#202c33';
    ctx.fill();

    // Customer Avatar
    ctx.beginPath();
    ctx.arc(-260, -408, 26, 0, Math.PI * 2);
    ctx.fillStyle = '#00a884';
    ctx.fill();
    ctx.textAlign = 'center';
    ctx.font = '700 22px -apple-system, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText("A", -260, -400);

    ctx.textAlign = 'left';
    ctx.font = '700 22px -apple-system, sans-serif';
    ctx.fillStyle = '#e9edef';
    ctx.fillText("Amaka (Customer)", -220, -418);

    ctx.font = '500 16px -apple-system, sans-serif';
    ctx.fillStyle = '#8696a0';
    ctx.fillText("online", -220, -394);

    // 1. Incoming Order Message
    roundRect(ctx, -280, -320, 520, 110, 18);
    ctx.fillStyle = '#202c33';
    ctx.fill();

    ctx.font = '600 20px -apple-system, sans-serif';
    ctx.fillStyle = '#e9edef';
    ctx.fillText("Hi, I am interested in Linen Shirt", -255, -285);
    ctx.fillText("(₦18,500) - Size M.", -255, -255);

    ctx.textAlign = 'right';
    ctx.font = '500 14px -apple-system, sans-serif';
    ctx.fillStyle = '#8696a0';
    ctx.fillText("10:42 AM", 220, -225);

    // 2. Vendor Reply (1.0s)
    if (sceneT >= 1.0) {
      const p1 = clamp((sceneT - 1.0) / 0.35, 0, 1);
      ctx.save();
      ctx.scale(easeOutBack(p1), easeOutBack(p1));

      roundRect(ctx, -240, -180, 520, 100, 18);
      ctx.fillStyle = '#005c4b';
      ctx.fill();

      ctx.textAlign = 'left';
      ctx.font = '600 20px -apple-system, sans-serif';
      ctx.fillStyle = '#e9edef';
      ctx.fillText("Hello Amaka! In stock. Dispatching", -215, -145);
      ctx.fillText("to Ikeja or Lekki?", -215, -115);

      ctx.textAlign = 'right';
      ctx.font = '500 14px -apple-system, sans-serif';
      ctx.fillStyle = '#53bdeb';
      ctx.fillText("10:43 AM  ✓✓", 260, -90);

      ctx.restore();
    }

    // 3. Customer Reply (2.4s)
    if (sceneT >= 2.4) {
      const p2 = clamp((sceneT - 2.4) / 0.35, 0, 1);
      ctx.save();
      ctx.scale(easeOutBack(p2), easeOutBack(p2));

      roundRect(ctx, -280, -50, 480, 75, 18);
      ctx.fillStyle = '#202c33';
      ctx.fill();

      ctx.textAlign = 'left';
      ctx.font = '600 20px -apple-system, sans-serif';
      ctx.fillStyle = '#e9edef';
      ctx.fillText("Lekki! Sent delivery details 👌", -255, -15);

      ctx.textAlign = 'right';
      ctx.font = '500 14px -apple-system, sans-serif';
      ctx.fillStyle = '#8696a0';
      ctx.fillText("10:44 AM", 180, 15);

      ctx.restore();
    }

    // 4. Vendor Confirmation (3.6s)
    if (sceneT >= 3.6) {
      const p3 = clamp((sceneT - 3.6) / 0.35, 0, 1);
      ctx.save();
      ctx.scale(easeOutBack(p3), easeOutBack(p3));

      roundRect(ctx, -240, 55, 520, 75, 18);
      ctx.fillStyle = '#005c4b';
      ctx.fill();

      ctx.textAlign = 'left';
      ctx.font = '600 20px -apple-system, sans-serif';
      ctx.fillStyle = '#e9edef';
      ctx.fillText("Order packed! On the way 🚀", -215, 90);

      ctx.textAlign = 'right';
      ctx.font = '500 14px -apple-system, sans-serif';
      ctx.fillStyle = '#53bdeb';
      ctx.fillText("10:45 AM  ✓✓", 260, 120);

      ctx.restore();
    }

    drawGlassSheen(ctx, 630, 1010, sceneT * 0.15);

    ctx.restore(); // end phone screen clip

    const capP = clamp(sceneT / 0.45, 0, 1);
    drawCaption(ctx, "No new app. No middleman.", "You stay in control.", capP);
    applyFilmGrain(ctx, frameIndex);
    return;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SCENE 6: THE PAYOFF (22.00s – 27.00s / Frames 660 – 809)
  // ══════════════════════════════════════════════════════════════════════════
  if (t < 27.00) {
    const sceneT = t - 22.00; // 0.0s to 5.0s
    drawCinematicBackground(ctx, frameIndex, 0.45);

    const phoneX = 540;
    const phoneY = 740;
    const dolly = 1.0 + Math.sin(sceneT * 0.5) * 0.03;

    drawPhoneShell(ctx, phoneX, phoneY, 660, 1040, dolly, 0, sceneT / 5.0);

    ctx.save();
    ctx.translate(phoneX, phoneY);
    ctx.scale(dolly, dolly);

    roundRect(ctx, -315, -505, 630, 1010, 44);
    ctx.clip();

    ctx.fillStyle = '#0b141a';
    ctx.fillRect(-315, -505, 630, 1010);
    drawDynamicIsland(ctx, 0, -495);

    // WhatsApp Chats List Header
    roundRect(ctx, -315, -450, 630, 75, 0);
    ctx.fillStyle = '#202c33';
    ctx.fill();

    ctx.textAlign = 'left';
    ctx.font = '800 26px -apple-system, sans-serif';
    ctx.fillStyle = '#e9edef';
    ctx.fillText("WhatsApp Orders", -280, -405);

    const chatItems = [
      { name: "Amaka Obi", item: "Leather Tote (₦24,000)", time: "Just now", badge: 1, delay: 0.1 },
      { name: "Tunde Balogun", item: "Linen Shirt (₦18,500)", time: "2m ago", badge: 1, delay: 0.8 },
      { name: "Chidinma K.", item: "Amber Candle (₦7,500)", time: "5m ago", badge: 2, delay: 1.5 },
      { name: "Zainab Ahmed", item: "Silk Scarf (₦9,200)", time: "8m ago", badge: 1, delay: 2.2 },
      { name: "Emeka U.", item: "Linen Shirt (₦18,500)", time: "12m ago", badge: 1, delay: 2.9 }
    ];

    chatItems.forEach((c, idx) => {
      const cy = -340 + idx * 105;
      if (sceneT >= c.delay) {
        const cP = clamp((sceneT - c.delay) / 0.35, 0, 1);
        ctx.save();
        ctx.translate(0, cy);
        ctx.scale(easeOutBack(cP), easeOutBack(cP));

        roundRect(ctx, -290, -42, 580, 88, 16);
        ctx.fillStyle = C.surface;
        ctx.fill();
        ctx.strokeStyle = C.border;
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(-245, 0, 24, 0, Math.PI * 2);
        ctx.fillStyle = '#00a884';
        ctx.fill();

        ctx.textAlign = 'center';
        ctx.font = '700 20px -apple-system, sans-serif';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(c.name.charAt(0), -245, 7);

        ctx.textAlign = 'left';
        ctx.font = '700 20px -apple-system, sans-serif';
        ctx.fillStyle = C.text;
        ctx.fillText(c.name, -205, -10);

        ctx.font = '500 16px -apple-system, sans-serif';
        ctx.fillStyle = C.accent;
        ctx.fillText(c.item, -205, 18);

        ctx.textAlign = 'right';
        ctx.font = '500 14px -apple-system, sans-serif';
        ctx.fillStyle = C.textMuted;
        ctx.fillText(c.time, 260, -10);

        roundRect(ctx, 240, 4, 24, 22, 11);
        ctx.fillStyle = C.waGreen;
        ctx.fill();
        ctx.textAlign = 'center';
        ctx.font = '700 13px -apple-system, sans-serif';
        ctx.fillStyle = '#04140D';
        ctx.fillText(c.badge.toString(), 252, 19);

        ctx.restore();
      }
    });

    drawGlassSheen(ctx, 630, 1010, sceneT * 0.2);

    ctx.restore(); // end phone screen clip

    const capP = clamp(sceneT / 0.45, 0, 1);
    drawCaption(ctx, "Turn DM chaos", "into organized sales.", capP);
    applyFilmGrain(ctx, frameIndex);
    return;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // SCENE 7: CTA FINALE (27.00s – 32.00s / Frames 810 – 959)
  // ══════════════════════════════════════════════════════════════════════════
  {
    const sceneT = t - 27.00; // 0.0s to 5.0s
    // Hold completely still for the last 1.5s (frames 915 - 959)
    const animT = Math.min(3.5, sceneT);
    drawCinematicBackground(ctx, frameIndex, 0.55);

    const entranceP = clamp(animT / 0.8, 0, 1);
    const scale = easeOutBack(entranceP);

    ctx.save();
    ctx.translate(540, 720);
    ctx.scale(scale, scale);

    const bloom = ctx.createRadialGradient(0, -60, 20, 0, -60, 320);
    bloom.addColorStop(0, 'rgba(25, 195, 125, 0.45)');
    bloom.addColorStop(0.6, 'rgba(17, 28, 24, 0.3)');
    bloom.addColorStop(1, 'rgba(10, 18, 16, 0)');
    ctx.fillStyle = bloom;
    ctx.beginPath();
    ctx.arc(0, -60, 320, 0, Math.PI * 2);
    ctx.fill();

    if (imagesLoaded) {
      ctx.drawImage(logoImg, -150, -210, 300, 300);
    }

    ctx.font = '900 76px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = C.text;
    ctx.fillText("SwiftLink", 0, 140);

    ctx.font = '700 32px -apple-system, sans-serif';
    ctx.fillStyle = C.textMuted;
    ctx.fillText("Sell on WhatsApp like a pro.", 0, 205);

    // Official Site Button: "Get started"
    roundRect(ctx, -240, 260, 480, 84, 20);
    ctx.fillStyle = C.accent;
    ctx.fill();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = '900 32px -apple-system, sans-serif';
    ctx.fillStyle = C.accentDark;
    ctx.fillText("Get started", 0, 302);

    ctx.font = '800 34px -apple-system, monospace';
    ctx.fillStyle = C.accent;
    ctx.fillText("swiftlinkpro.vercel.app", 0, 400);

    ctx.font = '600 24px -apple-system, sans-serif';
    ctx.fillStyle = C.textMuted;
    ctx.fillText("👉 Link in bio", 0, 450);

    ctx.restore();
    applyFilmGrain(ctx, frameIndex);
  }
};
</script>
</body>
</html>
`;

fs.writeFileSync(path.join(__dirname, 'render_engine.html'), htmlContent);
console.log('Updated promo-video/render_engine.html with enhanced vector luxury art & cinematic sheen!');
