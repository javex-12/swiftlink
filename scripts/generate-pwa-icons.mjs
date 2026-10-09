/**
 * Regenerates the favicon and PWA icon set from the **real** brand mark,
 * `public/logo.png` (500×500, transparent background).
 *
 * This previously rasterised `public/logo.svg` — a placeholder: a flat emerald
 * rounded square with the letters "SL" and no relationship to the actual logo.
 * So the favicon and the installed-app icon were both showing a stand-in.
 *
 * Run with: `node scripts/generate-pwa-icons.mjs`
 *
 * Outputs (all committed, so the app never depends on this script at build time):
 *   public/icons/favicon-32.png       32px, transparent — browser tab
 *   public/icons/icon-192.png        192px, transparent — `purpose: "any"`
 *   public/icons/icon-512.png        512px, transparent — `purpose: "any"`
 *   public/icons/maskable-512.png    512px, brand bg + 70% safe zone for masking
 *   public/icons/apple-touch-icon.png 180px, opaque (iOS applies its own mask)
 */
import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { mkdir } from "node:fs/promises";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = resolve(ROOT, "public/logo.png");
const OUT = resolve(ROOT, "public/icons");

// Brand canvas colour — matches `--app-bg` in styles/tokens.css and the
// `theme_color` in app/manifest.ts.
const BRAND_BG = { r: 10, g: 18, b: 16, alpha: 1 };

/** Rasterise the mark at `size` px on a transparent square. */
function tile(size) {
  return sharp(SOURCE)
    .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

/** Rasterise the mark centred on an opaque brand-coloured square. */
async function masked(size, logoSize) {
  const logo = await tile(logoSize);
  return sharp({ create: { width: size, height: size, channels: 4, background: BRAND_BG } })
    .composite([{ input: logo, top: Math.round((size - logoSize) / 2), left: Math.round((size - logoSize) / 2) }])
    .png()
    .toBuffer();
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const jobs = [
    ["favicon-32.png", await tile(32)],
    ["icon-192.png", await tile(192)],
    ["icon-512.png", await tile(512)],
    ["maskable-512.png", await masked(512, 358)],
    ["apple-touch-icon.png", await masked(180, 150)],
  ];
  for (const [name, buffer] of jobs) {
    await sharp(buffer).toFile(resolve(OUT, name));
    console.log(`wrote public/icons/${name}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
