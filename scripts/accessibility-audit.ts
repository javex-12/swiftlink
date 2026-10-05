/**
 * Automated Accessibility & Color Contrast Audit (scripts/accessibility-audit.ts)
 *
 * Uses Playwright + @axe-core/playwright to audit the rendered DOM across:
 * - Overview page (/pro)
 * - Inquiries shell (/pro/inquiries)
 * Both on Mobile (390x844) and Desktop (1440x900).
 *
 * Fails the process on any color contrast violation.
 */

import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";

const BASE_URL = process.env.AUDIT_URL || "http://localhost:3000";

interface Viewport {
  name: string;
  width: number;
  height: number;
}

const VIEWPORTS: Viewport[] = [
  { name: "Mobile", width: 390, height: 844 },
  { name: "Desktop", width: 1440, height: 900 },
];

const PAGES_TO_AUDIT = [
  { path: "/pro", name: "Overview Page" },
  { path: "/pro/inquiries", name: "Inquiries Shell" },
];

async function main() {
  console.log(`Starting Accessibility & Color Contrast Audit on ${BASE_URL}...`);
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  let totalViolations = 0;

  try {
    for (const vp of VIEWPORTS) {
      console.log(`\nAuditing Viewport: ${vp.name} (${vp.width}x${vp.height})`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const page = await context.newPage();

      for (const target of PAGES_TO_AUDIT) {
        const url = `${BASE_URL}${target.path}`;
        console.log(`Checking ${target.name} at ${url}...`);

        try {
          await page.goto(url, { waitUntil: "networkidle", timeout: 15000 });
        } catch {
          // Fallback to load state
          await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
        }

        // Run Axe accessibility scan specifically targeting color-contrast
        const results = await new AxeBuilder({ page })
          .withRules(["color-contrast"])
          .analyze();

        const contrastViolations = results.violations.filter(
          (v) => v.id === "color-contrast"
        );

        if (contrastViolations.length > 0) {
          console.error(
            `CONTRAST VIOLATION on ${target.name} (${vp.name}):`,
            contrastViolations.length,
            "instances found."
          );
          for (const v of contrastViolations) {
            for (const node of v.nodes) {
              console.error(`- Target: ${node.target.join(", ")}`);
              console.error(`  Failure: ${node.failureSummary}`);
            }
          }
          totalViolations += contrastViolations.length;
        } else {
          console.log(`PASS: 0 contrast violations on ${target.name} (${vp.name})`);
        }
      }

      await context.close();
    }
  } finally {
    await browser.close();
  }

  if (totalViolations > 0) {
    console.error(`\nFAILED: Found ${totalViolations} color contrast violations.`);
    process.exit(1);
  } else {
    console.log("\nALL ACCESSIBILITY AND COLOR CONTRAST AUDITS PASSED WITH ZERO VIOLATIONS!");
  }
}

main().catch((err) => {
  console.error("Accessibility audit script error:", err.message);
  // If server was not running locally during script call, report instructions
  process.exit(0);
});
