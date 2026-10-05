/**
 * Capture screenshots across demanded viewports:
 * - Home Overview: 360x800, 390x844, 768x1024, 1440x900
 * - Inquiries Shell: 390x844, 1440x900
 * - Onboarding Modal: 390x844, 1440x900
 * - Template Preview Modal: 390x844, 1440x900
 */

import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE_URL = process.env.SCREENSHOT_URL || "http://localhost:3000";
const OUTPUT_DIR = path.join(process.cwd(), "public/screenshots");

async function main() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    // 1. Home / Overview across the 4 demanded viewports
    const homeViewports = [
      { name: "home_360x800", width: 360, height: 800 },
      { name: "home_390x844", width: 390, height: 844 },
      { name: "home_768x1024", width: 768, height: 1024 },
      { name: "home_1440x900", width: 1440, height: 900 },
    ];

    for (const vp of homeViewports) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      await page.goto(`${BASE_URL}/pro`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(OUTPUT_DIR, `${vp.name}.png`), fullPage: true });
      console.log(`Saved: ${vp.name}.png`);
      await page.close();
    }

    // 2. Inquiries Shell
    const inqPageMobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await inqPageMobile.goto(`${BASE_URL}/pro/inquiries`, { waitUntil: "domcontentloaded" });
    await inqPageMobile.waitForTimeout(1000);
    await inqPageMobile.screenshot({ path: path.join(OUTPUT_DIR, "inquiries_390x844.png"), fullPage: true });
    await inqPageMobile.close();

    const inqPageDesk = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await inqPageDesk.goto(`${BASE_URL}/pro/inquiries`, { waitUntil: "domcontentloaded" });
    await inqPageDesk.waitForTimeout(1000);
    await inqPageDesk.screenshot({ path: path.join(OUTPUT_DIR, "inquiries_1440x900.png"), fullPage: true });
    await inqPageDesk.close();
    console.log("Saved inquiries screenshots.");

    // 3. Template Preview Modal (via /business design tab)
    const previewPage = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await previewPage.goto(`${BASE_URL}/business`, { waitUntil: "domcontentloaded" });
    await previewPage.waitForTimeout(1000);

    // Switch to Design tab
    const designTab = previewPage.getByRole("tab", { name: /Design/i }).or(previewPage.getByText(/Design/i)).first();
    if (await designTab.isVisible()) {
      await designTab.click();
      await previewPage.waitForTimeout(600);
    }

    // Find and click Preview button
    const previewBtn = previewPage.getByRole("button", { name: /Preview/i }).first();
    if (await previewBtn.isVisible()) {
      await previewBtn.click();
      await previewPage.waitForTimeout(1200);
      await previewPage.screenshot({ path: path.join(OUTPUT_DIR, "template_preview_desktop.png") });

      // Change viewport to mobile for mobile preview capture
      await previewPage.setViewportSize({ width: 390, height: 844 });
      await previewPage.waitForTimeout(600);
      await previewPage.screenshot({ path: path.join(OUTPUT_DIR, "template_preview_mobile.png") });
      console.log("Saved template preview screenshots.");
    }
    await previewPage.close();

    // 4. Onboarding Modal
    const onboardPage = await browser.newPage({ viewport: { width: 390, height: 844 } });
    // Clear storage so onboarding modal triggers
    await onboardPage.goto(`${BASE_URL}/pro`, { waitUntil: "domcontentloaded" });
    await onboardPage.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await onboardPage.reload({ waitUntil: "domcontentloaded" });
    await onboardPage.waitForTimeout(1000);
    await onboardPage.screenshot({ path: path.join(OUTPUT_DIR, "onboarding_modal_mobile.png") });

    await onboardPage.setViewportSize({ width: 1440, height: 900 });
    await onboardPage.waitForTimeout(600);
    await onboardPage.screenshot({ path: path.join(OUTPUT_DIR, "onboarding_modal_desktop.png") });
    await onboardPage.close();
    console.log("Saved onboarding modal screenshots.");

  } finally {
    await browser.close();
  }

  console.log("All screenshots captured in public/screenshots/");
}

main().catch((err) => {
  console.error("Screenshot capture error:", err);
  process.exit(1);
});
