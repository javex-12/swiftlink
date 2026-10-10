import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Contract tests for the console controls a merchant kept reporting as missing.
 *
 * Each assertion below pins a bug that was live, and each was verified by hand
 * in the code it names:
 *
 *   - "Stop store / Go live" existed only inside the store editor, so nobody
 *     who already had a store could find it. It is now on the console home and
 *     in Settings too — reachable by every user, on any plan.
 *   - The store switcher was gated on the *store row's* plan, so an account
 *     whose rows disagreed (a store created as `plan: 'free'`) could not reach
 *     its other stores at all.
 *   - `createNewStore` hard-coded `plan: 'free'`, which demoted a paying
 *     Business account to the free tier's 6 products the moment they added a
 *     store — the exact "I'm on Business but it says 6 products" report.
 *
 * These are source assertions rather than renders because the suite is
 * deliberately node-only (vitest.config.mts) — the storefront/console have no
 * DOM test environment, and adding one is a dependency decision, not a fix.
 */
function read(relative: string): string {
  return fs.readFileSync(path.join(process.cwd(), relative), "utf8");
}

const overview = read("components/dashboard/OverviewView.tsx");
const settings = read("app/account/page.tsx");
const editor = read("components/editor/StoreEditorV2.tsx");
const switcher = read("components/StoreSwitcher.tsx");
const context = read("context/SwiftLinkContext.tsx");
const sidebar = read("components/ProSidebar.tsx");
const layout = read("components/ProLayout.tsx");
const tailwind = read("tailwind.config.ts");
const preview = read("components/storefront/TemplatePreviewModal.tsx");

describe("Stop store / Go live — a control every user can reach", () => {
  it("is on the console home, wired to the persisted isLive field", () => {
    expect(overview).toContain('updateState("isLive", next)');
    expect(overview).toMatch(/\{state\.isLive \? "Stop store" : "Go live"\}/);
  });

  it("is in Settings, so it is not reachable only from inside the editor", () => {
    expect(settings).toContain('updateState("isLive", next)');
    expect(settings).toMatch(/\{state\.isLive \? "Stop store" : "Go live"\}/);
  });

  it("is still in the editor header, and no longer clipped on a phone", () => {
    expect(editor).toMatch(/\{localState\.isLive \? "Stop store" : "Go live"\}/);
    // The header row wraps, so the badge and the button drop below the store
    // name on a narrow phone instead of being squeezed out of the row.
    expect(editor).toContain("flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1.5");
  });
});

describe("Store switcher — shown whenever the account really has more stores", () => {
  it("is mounted in the shell, gated on multi-store OR an existing second store", () => {
    for (const file of [sidebar, layout]) {
      expect(file).toContain("stores.length > 1 || effectiveStoreLimitFor(state.plan) > 1");
    }
    expect(sidebar).toContain("<StoreSwitcher />");
    expect(layout).toContain("<StoreSwitcher />");
  });

  it("creates a store through the real dialog, not a monkey-patched global", () => {
    // Match the call, not the words: the doc comment above the component still
    // names the old global to explain why it went away.
    expect(switcher).not.toContain('(window as any).customPrompt');
    expect(switcher).not.toMatch(/window\.customPrompt\(/);
    expect(switcher).toContain("PromptDialog");
  });

  it("names the store limit instead of failing silently at the cap", () => {
    expect(switcher).toContain("effectiveStoreLimitFor(state.plan)");
    expect(switcher).toContain("formatLimit(storeLimit)");
    // The rule itself lives in lib/plans; the switcher only explains it.
    expect(switcher).toContain("storeActionBlockedMessage(state.plan, allStores.length)");
    expect(switcher).toContain("canCreateStore(state.plan, allStores.length)");
    expect(switcher).toContain("canSwitchStore(state.plan)");
  });
});

describe("Plan inheritance — a new store cannot demote the account", () => {
  it("inserts the account's plan, not a hard-coded free tier", () => {
    expect(context).toMatch(/plan: accountPlan,\s+account_status: 'active',/);
    expect(context).toContain("const currentPlan = accountPlanFor(stores.length ? stores : [state])");
  });

  it("refuses to create or switch stores beyond the plan, in the context itself", () => {
    // Not only in a screen: the live database had a free account with 3 stores.
    expect(context).toContain("if (!canCreateStore(currentPlan, stores.length))");
    expect(context).toContain("if (!canSwitchStore(currentPlan))");
  });

  it("resolves entitlements per account and repairs disagreeing rows", () => {
    expect(context).toContain("reconcileAccountPlan(data as any[])");
    expect(context).toMatch(/\.update\(\{ plan: accountPlan \}\)/);
  });
});

describe("Template preview — dark mode, exact render, phone-is-just-a-page", () => {
  it("has a light/dark toggle", () => {
    expect(preview).toContain("appearanceToggle(appearance, setAppearance)");
    expect(preview).toMatch(/\{ value: "dark", label: "Dark", Icon: Moon \}/);
  });

  it("sets the same theme field the real storefront reads", () => {
    // CustomerStorefront derives its appearance from `storefrontTheme.background`,
    // so the preview must not use a private flag or it can disagree with reality.
    expect(preview).toContain("background: appearance");
    expect(read("components/CustomerStorefront.tsx")).toContain("storefrontTheme?.background");
  });

  it("renders full-bleed on a real phone instead of a frame inside a phone", () => {
    expect(preview).toContain('window.matchMedia("(max-width: 639px)")');
    expect(preview).toContain("isNarrowViewport ? (");
    expect(preview).toContain("{!isNarrowViewport && deviceToggle(device, setDevice)}");
  });
});

describe("Tailwind — the xs breakpoint is defined", () => {
  it("compiles xs: variants instead of dropping them", () => {
    expect(tailwind).toMatch(/xs: "480px"/);
  });
});
