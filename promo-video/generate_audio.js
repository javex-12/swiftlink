const fs = require('fs');
const path = require('path');

// Audio Synthesis Engine for SwiftLink Promo Video
// Sample Rate: 48,000 Hz, 32.0 Seconds, 2 Channels (Stereo), 16-bit PCM

const SAMPLE_RATE = 48000;
const DURATION = 32.0;
const TOTAL_SAMPLES = Math.floor(SAMPLE_RATE * DURATION);

const left = new Float32Array(TOTAL_SAMPLES);
const right = new Float32Array(TOTAL_SAMPLES);

function addTone(startSec, durationSec, freq, gain, pan = 0, type = 'sine') {
  const startSample = Math.floor(startSec * SAMPLE_RATE);
  const numSamples = Math.floor(durationSec * SAMPLE_RATE);
  for (let i = 0; i < numSamples; i++) {
    const idx = startSample + i;
    if (idx >= TOTAL_SAMPLES) break;
    const t = i / SAMPLE_RATE;
    const progress = i / numSamples;
    const env = Math.sin(Math.PI * progress); // smooth bell envelope
    let val = 0;
    if (type === 'sine') {
      val = Math.sin(2 * Math.PI * freq * t);
    } else if (type === 'triangle') {
      val = 2 * Math.abs(2 * (t * freq - Math.floor(t * freq + 0.5))) - 1;
    }
    const sampleVal = val * env * gain;
    left[idx] += sampleVal * (1 - pan * 0.5);
    right[idx] += sampleVal * (1 + pan * 0.5);
  }
}

function addPluck(startSec, freq, gain, decay = 0.3, pan = 0) {
  const startSample = Math.floor(startSec * SAMPLE_RATE);
  const numSamples = Math.floor(decay * 2.5 * SAMPLE_RATE);
  let phase = 0;
  for (let i = 0; i < numSamples; i++) {
    const idx = startSample + i;
    if (idx >= TOTAL_SAMPLES) break;
    const t = i / SAMPLE_RATE;
    const env = Math.exp(-t / decay);
    // Harmonic pluck: fundamental + 2nd + 3rd harmonic
    const val = (Math.sin(2 * Math.PI * freq * t) * 0.6 +
                 Math.sin(4 * Math.PI * freq * t) * 0.25 +
                 Math.sin(6 * Math.PI * freq * t) * 0.15);
    const sampleVal = val * env * gain;
    left[idx] += sampleVal * (1 - pan * 0.4);
    right[idx] += sampleVal * (1 + pan * 0.4);
  }
}

function addKick(startSec, gain = 0.8) {
  const startSample = Math.floor(startSec * SAMPLE_RATE);
  const numSamples = Math.floor(0.28 * SAMPLE_RATE);
  for (let i = 0; i < numSamples; i++) {
    const idx = startSample + i;
    if (idx >= TOTAL_SAMPLES) break;
    const t = i / SAMPLE_RATE;
    const env = Math.exp(-t / 0.07);
    // Pitch drops from 140 Hz to 45 Hz rapidly
    const freq = 45 + 95 * Math.exp(-t / 0.035);
    const val = Math.sin(2 * Math.PI * freq * t);
    const click = (i < 200 ? (Math.random() * 2 - 1) * 0.3 * (1 - i / 200) : 0);
    const sampleVal = (val + click) * env * gain;
    left[idx] += sampleVal;
    right[idx] += sampleVal;
  }
}

function addRimshot(startSec, gain = 0.4, pan = 0.1) {
  const startSample = Math.floor(startSec * SAMPLE_RATE);
  const numSamples = Math.floor(0.08 * SAMPLE_RATE);
  for (let i = 0; i < numSamples; i++) {
    const idx = startSample + i;
    if (idx >= TOTAL_SAMPLES) break;
    const t = i / SAMPLE_RATE;
    const env = Math.exp(-t / 0.018);
    const tone = Math.sin(2 * Math.PI * 880 * t) * 0.5 + Math.sin(2 * Math.PI * 1760 * t) * 0.3;
    const noise = (Math.random() * 2 - 1) * 0.5;
    const sampleVal = (tone + noise) * env * gain;
    left[idx] += sampleVal * (1 - pan);
    right[idx] += sampleVal * (1 + pan);
  }
}

function addShaker(startSec, gain = 0.15, pan = -0.2) {
  const startSample = Math.floor(startSec * SAMPLE_RATE);
  const numSamples = Math.floor(0.06 * SAMPLE_RATE);
  for (let i = 0; i < numSamples; i++) {
    const idx = startSample + i;
    if (idx >= TOTAL_SAMPLES) break;
    const t = i / SAMPLE_RATE;
    const env = Math.sin(Math.PI * (i / numSamples)) * Math.exp(-t / 0.03);
    const noise = (Math.random() * 2 - 1);
    const sampleVal = noise * env * gain;
    left[idx] += sampleVal * (1 - pan);
    right[idx] += sampleVal * (1 + pan);
  }
}

function addSubDrop(startSec, gain = 0.9) {
  const startSample = Math.floor(startSec * SAMPLE_RATE);
  const numSamples = Math.floor(1.5 * SAMPLE_RATE);
  for (let i = 0; i < numSamples; i++) {
    const idx = startSample + i;
    if (idx >= TOTAL_SAMPLES) break;
    const t = i / SAMPLE_RATE;
    const env = Math.exp(-t / 0.45);
    const freq = 38 + 65 * Math.exp(-t / 0.3);
    const val = Math.sin(2 * Math.PI * freq * t);
    const sampleVal = val * env * gain;
    left[idx] += sampleVal;
    right[idx] += sampleVal;
  }
}

function addWhoosh(startSec, duration = 0.5, gain = 0.4, panDir = 1) {
  const startSample = Math.floor(startSec * SAMPLE_RATE);
  const numSamples = Math.floor(duration * SAMPLE_RATE);
  for (let i = 0; i < numSamples; i++) {
    const idx = startSample + i;
    if (idx >= TOTAL_SAMPLES) break;
    const progress = i / numSamples;
    const env = Math.sin(Math.PI * progress) ** 2;
    const noise = (Math.random() * 2 - 1);
    // Filtered swoosh frequency sweeping
    const centerFreq = 400 + 1200 * progress;
    const tone = Math.sin(2 * Math.PI * centerFreq * (i / SAMPLE_RATE));
    const sampleVal = (noise * 0.7 + tone * 0.3) * env * gain;
    const pan = (progress * 2 - 1) * panDir * 0.5;
    left[idx] += sampleVal * (1 - pan);
    right[idx] += sampleVal * (1 + pan);
  }
}

function addNotificationPing(startSec, gain = 0.4, pan = 0) {
  // Classic dual-tone sweet message ping (high harmonic chime)
  addTone(startSec, 0.12, 1046.5, gain * 0.7, pan); // C6
  addTone(startSec + 0.04, 0.22, 1318.5, gain * 0.9, pan); // E6
}

function addUIRapidClick(startSec, gain = 0.2) {
  const startSample = Math.floor(startSec * SAMPLE_RATE);
  const numSamples = Math.floor(0.015 * SAMPLE_RATE);
  for (let i = 0; i < numSamples; i++) {
    const idx = startSample + i;
    if (idx >= TOTAL_SAMPLES) break;
    const env = 1 - (i / numSamples);
    const click = Math.sin(2 * Math.PI * 2400 * (i / SAMPLE_RATE)) * env * gain;
    left[idx] += click;
    right[idx] += click;
  }
}

// ─── 1. HOOK: 0.0s – 2.5s ─────────────────────────────────────────────────────
// Low tension sub drone + rising swell + flurry of notification pings
for (let i = 0; i < Math.floor(2.45 * SAMPLE_RATE); i++) {
  const t = i / SAMPLE_RATE;
  const droneEnv = Math.min(1, t / 0.5);
  const swell = (t / 2.45) ** 2;
  const subDrone = Math.sin(2 * Math.PI * 55 * t) * 0.35 * droneEnv;
  const highTension = Math.sin(2 * Math.PI * (220 + 330 * swell) * t) * 0.15 * swell;
  const noiseRiser = (Math.random() * 2 - 1) * 0.08 * swell;
  left[i] += subDrone + highTension + noiseRiser;
  right[i] += subDrone + highTension + noiseRiser;
}

// Incoming DM notification pings
const pingTimes = [0.15, 0.45, 0.75, 1.05, 1.35, 1.65, 1.95, 2.15, 2.30];
pingTimes.forEach((t, idx) => {
  const pan = (idx % 2 === 0 ? -0.4 : 0.4);
  addNotificationPing(t, 0.35 + (idx * 0.03), pan);
});
// Bass thud during hook impact at 1.8s
addKick(1.8, 0.6);

// ─── 2. THE TURN: 2.5s – 5.0s ──────────────────────────────────────────────────
// 2.50s - 2.80s: TOTAL DEAD SILENCE (ensured by leaving samples untouched)
// 2.80s: Sub drop + cinematic whoosh + lock click on logo reveal
addSubDrop(2.80, 0.95);
addWhoosh(2.78, 0.55, 0.5, 1);
addTone(3.20, 0.15, 1760, 0.4, 0.2); // subtle metallic chime
addTone(3.25, 0.25, 2093, 0.45, -0.2);

// ─── 3. AFROBEAT GROOVE: 3.8s – 27.0s (116 BPM) ──────────────────────────────
const BPM = 116;
const BEAT_SEC = 60 / BPM; // ~0.5172s
const BAR_SEC = BEAT_SEC * 4; // ~2.069s

// Bass melody notes (frequencies in Hz: D2=73.4, F2=87.3, G2=98.0, A2=110.0, C3=130.8)
const bassFrequencies = [73.4, 73.4, 87.3, 98.0, 73.4, 110.0, 98.0, 87.3];
const melodyPitches = [440, 523.25, 587.33, 659.25, 783.99]; // A4, C5, D5, E5, G5 (warm marimba/pluck)

let barIndex = 0;
for (let t = 3.8; t < 27.0; t += BEAT_SEC) {
  const beatInBar = Math.floor(((t - 3.8) % BAR_SEC) / BEAT_SEC);
  const is16thOffset = false;

  // Afrobeat Kick pattern: Beat 1, Beat 3.5 (syncopated)
  if (beatInBar === 0) {
    addKick(t, 0.75);
  } else if (beatInBar === 2) {
    addKick(t + BEAT_SEC * 0.5, 0.7); // Syncopated kick on the "and" of 3
  }

  // Snare/Rimshot on beat 2 and 4
  if (beatInBar === 1 || beatInBar === 3) {
    addRimshot(t, 0.45, (beatInBar === 1 ? -0.1 : 0.1));
  }
  // Subtle ghost rimshot
  if (beatInBar === 2) {
    addRimshot(t + BEAT_SEC * 0.75, 0.2, 0.2);
  }

  // 16th-note shakers
  for (let s = 0; s < 4; s++) {
    const shakerTime = t + s * (BEAT_SEC / 4);
    if (shakerTime < 27.0) {
      addShaker(shakerTime, (s % 2 === 0 ? 0.12 : 0.08), (s % 2 === 0 ? -0.2 : 0.2));
    }
  }

  // Warm Sub Bass Synth Note
  const bassPitch = bassFrequencies[barIndex % bassFrequencies.length];
  addTone(t, BEAT_SEC * 0.85, bassPitch, 0.4, 0, 'triangle');

  // Mellow afrobeat kalimba/pluck chords (sparse, tasteful)
  if (beatInBar === 0 || beatInBar === 2) {
    const mPitch = melodyPitches[(barIndex * 2 + beatInBar) % melodyPitches.length];
    addPluck(t + BEAT_SEC * 0.25, mPitch, 0.22, 0.35, (beatInBar === 0 ? -0.3 : 0.3));
    addPluck(t + BEAT_SEC * 0.25, mPitch * 1.5, 0.12, 0.25, (beatInBar === 0 ? 0.3 : -0.3));
  }

  barIndex++;
}

// ─── 4. SYNCED SOUND DESIGN OVERLAYS ──────────────────────────────────────────
// 5.0s – 11.0s: BUILD scene UI clicks as products are added
[5.2, 5.8, 6.4, 7.2, 7.9, 8.6, 9.4, 10.1].forEach(t => {
  addUIRapidClick(t, 0.25);
});
addWhoosh(5.0, 0.4, 0.3, -1);
addWhoosh(8.0, 0.4, 0.25, 1);

// 11.0s – 17.0s: CUSTOMER scene: link click, product tap, WhatsApp order button
addWhoosh(11.0, 0.45, 0.35, 1);
addUIRapidClick(12.5, 0.3); // Tap product
addUIRapidClick(14.0, 0.35); // Tap Order on WhatsApp
addNotificationPing(15.2, 0.45, 0.2); // Message lands in WhatsApp!

// 17.0s – 22.0s: STAYS IN WHATSAPP: Vendor reply pings & chat interactions
addNotificationPing(17.5, 0.4, -0.2); // Incoming customer message
[18.3, 18.5, 18.7, 18.9].forEach(t => addUIRapidClick(t, 0.15)); // Vendor typing
addTone(19.2, 0.1, 1400, 0.3, 0.2); // WhatsApp sent "pop"
addNotificationPing(20.4, 0.38, 0.2); // Customer reply: "Lekki! Sent delivery details"
addTone(21.2, 0.1, 1400, 0.3, -0.2); // Vendor confirmation sent

// 22.0s – 27.0s: PAYOFF scene: Multiple incoming order notifications
[22.2, 22.8, 23.4, 24.1, 24.7, 25.3, 25.9, 26.5].forEach((t, i) => {
  addNotificationPing(t, 0.38 + i * 0.02, (i % 2 === 0 ? -0.3 : 0.3));
});
addWhoosh(22.0, 0.5, 0.3, -1);

// ─── 5. CTA FINALE: 27.0s – 32.0s ─────────────────────────────────────────────
// Downbeat crash + sub resonance + smooth fade out to 32.0s
addSubDrop(27.0, 0.8);
addWhoosh(26.9, 0.6, 0.4, 1);
addTone(27.0, 2.5, 523.25, 0.35, 0); // Warm C5 harmonic sustain
addTone(27.0, 2.5, 659.25, 0.25, 0.2); // E5
addTone(27.0, 2.5, 783.99, 0.25, -0.2); // G5

// Final fade out starting at 30.5s to 32.0s
const fadeStart = Math.floor(30.5 * SAMPLE_RATE);
for (let i = fadeStart; i < TOTAL_SAMPLES; i++) {
  const fade = 1 - (i - fadeStart) / (TOTAL_SAMPLES - fadeStart);
  left[i] *= fade;
  right[i] *= fade;
}

// ─── 6. EXPORT 16-BIT STEREO WAV FILE ─────────────────────────────────────────
console.log('Synthesizing audio samples...');

// Convert float samples to 16-bit PCM buffer with soft limiter
const pcmBuffer = Buffer.alloc(TOTAL_SAMPLES * 4); // 2 bytes * 2 channels
let peak = 0;
for (let i = 0; i < TOTAL_SAMPLES; i++) {
  peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
}
console.log(`Peak amplitude before normalization: ${peak.toFixed(3)}`);
const normFactor = peak > 0 ? (0.88 / peak) : 1; // leave 1.2 dB headroom

for (let i = 0; i < TOTAL_SAMPLES; i++) {
  let l = left[i] * normFactor;
  let r = right[i] * normFactor;
  // Soft saturation limiter
  l = Math.tanh(l);
  r = Math.tanh(r);
  
  const lSample = Math.max(-32768, Math.min(32767, Math.floor(l * 32767)));
  const rSample = Math.max(-32768, Math.min(32767, Math.floor(r * 32767)));
  
  pcmBuffer.writeInt16LE(lSample, i * 4);
  pcmBuffer.writeInt16LE(rSample, i * 4 + 2);
}

// WAV Header (44 bytes)
const wavHeader = Buffer.alloc(44);
wavHeader.write('RIFF', 0);
wavHeader.writeUInt32LE(36 + pcmBuffer.length, 4);
wavHeader.write('WAVE', 8);
wavHeader.write('fmt ', 12);
wavHeader.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
wavHeader.writeUInt16LE(1, 20); // AudioFormat (1 for PCM)
wavHeader.writeUInt16LE(2, 22); // NumChannels (2)
wavHeader.writeUInt32LE(SAMPLE_RATE, 24); // SampleRate
wavHeader.writeUInt32LE(SAMPLE_RATE * 4, 28); // ByteRate (SampleRate * NumChannels * BitsPerSample/8)
wavHeader.writeUInt16LE(4, 32); // BlockAlign (NumChannels * BitsPerSample/8)
wavHeader.writeUInt16LE(16, 34); // BitsPerSample (16)
wavHeader.write('data', 36);
wavHeader.writeUInt32LE(pcmBuffer.length, 40);

const finalWav = Buffer.concat([wavHeader, pcmBuffer]);
const outputPath = path.join(__dirname, 'soundtrack_raw.wav');
fs.writeFileSync(outputPath, finalWav);
console.log(`Generated ${outputPath} (${(finalWav.length / (1024 * 1024)).toFixed(2)} MB)`);
