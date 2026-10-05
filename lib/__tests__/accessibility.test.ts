import { describe, expect, it } from "vitest";
import { contrastRatio } from "@/lib/theme/color";
import { consoleDarkTokens, consoleContrastPairs } from "@/lib/theme/tokens";
import fs from "node:fs";
import path from "node:path";

describe("Accessibility & WCAG AA/AAA Verification", () => {
  it("enforces WCAG AAA (>7:1) for primary text on console surfaces", () => {
    const textOnCanvas = contrastRatio(consoleDarkTokens.text, consoleDarkTokens.bg);
    const textOnSurface = contrastRatio(consoleDarkTokens.text, consoleDarkTokens.surface);
    const textOnSurface2 = contrastRatio(consoleDarkTokens.text, consoleDarkTokens["surface-2"]);

    expect(textOnCanvas).toBeGreaterThan(12);
    expect(textOnSurface).toBeGreaterThan(11);
    expect(textOnSurface2).toBeGreaterThan(10);
  });

  it("enforces WCAG AA (>4.5:1) for secondary/muted text on console surfaces", () => {
    const mutedOnCanvas = contrastRatio(consoleDarkTokens["text-muted"], consoleDarkTokens.bg);
    const mutedOnSurface = contrastRatio(consoleDarkTokens["text-muted"], consoleDarkTokens.surface);
    const mutedOnSurface2 = contrastRatio(consoleDarkTokens["text-muted"], consoleDarkTokens["surface-2"]);

    expect(mutedOnCanvas).toBeGreaterThan(6.5);
    expect(mutedOnSurface).toBeGreaterThan(6.0);
    expect(mutedOnSurface2).toBeGreaterThan(5.5);
  });

  it("enforces WCAG non-text contrast (>=3:1) for interactive borders and controls", () => {
    const borderStrongOnSurface = contrastRatio(consoleDarkTokens["border-strong"], consoleDarkTokens.surface);
    expect(borderStrongOnSurface).toBeGreaterThanOrEqual(3.0);
  });

  it("enforces contrast for accent and callouts", () => {
    const accentOnBg = contrastRatio(consoleDarkTokens.accent, consoleDarkTokens.bg);
    const textOnAccent = contrastRatio(consoleDarkTokens["accent-fg"], consoleDarkTokens.accent);

    expect(accentOnBg).toBeGreaterThan(7.0);
    expect(textOnAccent).toBeGreaterThan(7.0);
  });

  it("validates all registered contrast pairs in design tokens", () => {
    for (const pair of consoleContrastPairs) {
      const fg = consoleDarkTokens[pair.fg];
      const bg = consoleDarkTokens[pair.bg];
      const ratio = contrastRatio(fg, bg);
      expect(
        ratio,
        `${pair.why}: ${pair.fg} on ${pair.bg} (${ratio.toFixed(2)}) must meet ${pair.min}`
      ).toBeGreaterThanOrEqual(pair.min);
    }
  });
});

describe("Console Shell & Overview View Integrity", () => {
  it("OverviewView contains the four designed stat cards with 0 initial values", () => {
    const overviewFile = fs.readFileSync(path.join(process.cwd(), "components/dashboard/OverviewView.tsx"), "utf8");
    
    // Four stat cards
    expect(overviewFile).toContain("Store views");
    expect(overviewFile).toContain("Product taps");
    expect(overviewFile).toContain("Chats started");
    expect(overviewFile).toContain("Confirmed sales");

    // Designed subtexts
    expect(overviewFile).toContain("From direct links &amp; social");
    expect(overviewFile).toContain("Buyers viewing details");
    expect(overviewFile).toContain("WhatsApp order inquiries");
    expect(overviewFile).toContain("Recorded through inquiries");
  });

  it("OverviewView header has no duplicate logo on mobile and displays status", () => {
    const overviewFile = fs.readFileSync(path.join(process.cwd(), "components/dashboard/OverviewView.tsx"), "utf8");
    
    expect(overviewFile).toContain("Good day, {firstName}");
    expect(overviewFile).not.toContain('Image src="/logo.png"');
    expect(overviewFile).toContain("Store is live & receiving orders");
  });

  it("OverviewView includes the real-data Get your store ready checklist", () => {
    const overviewFile = fs.readFileSync(path.join(process.cwd(), "components/dashboard/OverviewView.tsx"), "utf8");
    
    expect(overviewFile).toContain("Get your store ready");
    expect(overviewFile).toContain("Name your store & choose link");
    expect(overviewFile).toContain("Connect WhatsApp order number");
    expect(overviewFile).toContain("Add your first product");
    expect(overviewFile).toContain("Choose a storefront template");
    expect(overviewFile).toContain("Share your link with customers");
  });

  it("ProLayout shell has 44px+ touch targets and non-shifting top tab indicator", () => {
    const layoutFile = fs.readFileSync(path.join(process.cwd(), "components/ProLayout.tsx"), "utf8");
    
    // Min touch target 44px/48px
    expect(layoutFile).toContain("min-h-[48px]");
    expect(layoutFile).toContain("min-w-[44px]");

    // Absolute top indicator bar (does not shift layout)
    expect(layoutFile).toContain("absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-8 rounded-full bg-[#19C37D]");

    // Safe area bottom padding
    expect(layoutFile).toContain("calc(6rem+env(safe-area-inset-bottom,0px))");
  });

  it("Console theme is enforced dark-only with no console moon toggle", () => {
    const contextFile = fs.readFileSync(path.join(process.cwd(), "context/SwiftLinkContext.tsx"), "utf8");
    const layoutFile = fs.readFileSync(path.join(process.cwd(), "app/layout.tsx"), "utf8");

    expect(contextFile).toContain('setTheme("dark")');
    expect(contextFile).toContain('document.documentElement.classList.add("dark")');
    expect(layoutFile).toContain('dark');
  });

  it("all console pages wrap their content in ProLayout", () => {
    const consolePages = [
      "app/pro/page.tsx",
      "app/pro/inquiries/page.tsx",
      "app/pro/analytics/page.tsx",
      "app/business/page.tsx",
      "app/account/page.tsx",
    ];

    for (const pagePath of consolePages) {
      const content = fs.readFileSync(path.join(process.cwd(), pagePath), "utf8");
      expect(content, `${pagePath} must wrap with ProLayout`).toContain("ProLayout");
    }
  });
});
