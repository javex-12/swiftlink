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
const storefront = read("components/CustomerStorefront.tsx");

/*
 * The sticky Save header.
 *
 * `sticky top-0` was on the editor header the whole time and never stuck, so a
 * merchant who scrolled to the bottom of a long catalogue had to scroll back up
 * to save. The cause was an ancestor, not the header: `overflow-hidden` makes a
 * box a scroll container, and a sticky element inside a container that never
 * scrolls scrolls away with the page. `overflow-x-clip` contains the same
 * horizontal overflow without creating that container.
 */
describe("The editor's Save header stays on screen while the page scrolls", () => {
  it("pins the editor header to the top", () => {
    expect(editor).toContain('className="sticky top-0 z-30 border-b border-[#1E2D27] bg-[#0A1210]/95');
  });

  it("has no scroll-container ancestor in the console layout", () => {
    expect(layout).toContain("min-h-screen overflow-x-clip");
    expect(layout).not.toMatch(/min-h-screen overflow-hidden/);
    expect(layout).not.toMatch(/\boverflow-y-auto/);
  });
});

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

describe("Plan inheritance — a new store cannot demote the account", () => {    it("inserts the account's plan, not a hard-coded free tier", () => {
    expect(context).toMatch(/plan: accountPlan,\s+account_status: 'active',/);
    // The *entitled* plan first, so an administrator's Business override is not
    // lost to a free row when they add a store.
    expect(context).toContain(
      "const currentPlan = accountPlanRef.current ?? accountPlanFor(stores.length ? stores : [state])",
    );
  });

  it("refuses to create or switch stores beyond the plan, in the context itself", () => {
    // Not only in a screen: the live database had a free account with 3 stores.
    expect(context).toContain("if (!canCreateStore(currentPlan, stores.length))");
    expect(context).toContain("if (!canSwitchStore(currentPlan))");
  });

  it("resolves entitlements per account and repairs disagreeing rows", () => {
    expect(context).toContain("reconcileAccountPlan(data as any[])");
    /*
     * Rows are aligned with each other (`dbPlan`), never with the admin
     * override: the entitlement follows the person, so writing it into
     * `stores.plan` would leave a paid tier behind after a demotion.
     */
    expect(context).toMatch(/\.update\(\{ plan: dbPlan \}\)/);
    expect(context).not.toMatch(/\.update\(\{ plan: accountPlan \}\)/);
  });

  it("asks the server for the entitlement instead of trusting one row", () => {
    expect(context).toContain('supabase.rpc("get_account_entitlement")');
    expect(context).toContain("entitledPlanFor(data as any[], { isAdmin: entitlement.isAdmin })");
    // The old client-side upgrade is what `fetchStores` overwrote.
    expect(context).not.toContain("setState(prev => ({ ...prev, plan: 'business' }))");
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

  it("mounts the real storefront, so the preview cannot drift from the live site", () => {
    // The preview used to render the bare template with dead callbacks, which is
    // why opening a product in it did nothing and "back" dropped the merchant at
    // the top of the page. It now renders `CustomerStorefront` itself.
    expect(preview).toContain("<CustomerStorefront");
    expect(preview).toContain("preview");
    expect(preview).toContain("overrideState={activeState}");
    // The preview must white-label a Business store too, or it shows the merchant
    // branding their own live site no longer carries.
    expect(preview).toContain('whiteLabel={vendorState.plan === "business"}');
    expect(preview).not.toContain("onProduct={() => {}}");
  });

  it("keeps a preview out of the browser's history", () => {
    // Otherwise the merchant's back button leaves the console instead of the
    // product page they opened.
    expect(storefront).toContain('if (preview || typeof window === "undefined") return;');
    expect(storefront).toContain("if (!preview) window.history.pushState({ screen: next }, \"\");");
  });

  it("leaves the shopper's real bag and analytics untouched while previewing", () => {
    expect(storefront).toContain("const cart = preview ? previewCart : liveCart;");
    expect(storefront).toContain('if (!preview && effectiveState?.id) { logEvent("view"');
    expect(storefront).toContain("This is a preview — checkout is disabled until you publish.");
  });
});

describe("Tailwind — the xs breakpoint is defined", () => {
  it("compiles xs: variants instead of dropping them", () => {
    expect(tailwind).toMatch(/xs: "480px"/);
  });
});

/*
 * A merchant on Pro with three brands reported that adding a second store took
 * the first one offline, and that once a store was paused there was no way to
 * choose which one came back. Both came from the same place: "run this store"
 * was the only lever, and it paused everything else — even on a plan that pays
 * for more than one. These pin the replacement.
 */
describe("Several stores — the merchant decides which are live", () => {
  it("pauses nothing when the plan can hold every store it owns", () => {
    // `chooseStore` used to test `isUnlimited`, which is false for every plan
    // now that the limits are finite — so even Business paused the others.
    expect(context).toContain("if (effectiveStoreLimitFor(currentPlan) >= stores.length)");
    expect(context).not.toContain("if (isUnlimited(effectiveStoreLimitFor(currentPlan)))");
  });

  it("closes and reopens one store at a time, capped by the plan", () => {
    expect(context).toContain("const setStoreLive = useCallback");
    expect(context).toContain("if (liveCount >= effectiveStoreLimitFor(currentPlan))");
    expect(context).toContain("addToast(storeLimitMessage(currentPlan, liveCount), \"error\")");
    // Never a delete, and the update goes to the store's own row.
    expect(context).toContain('const nextStores = stores.map((store) => (store.id === id ? updated : store));');
    expect(context).toContain("await persistRepairedRows([{ id, store: updated }])");
    expect(context).toContain("setStoreLive,");
  });

  it("offers Pause / Go live per store in Settings, not one 'run this store'", () => {
    expect(settings).toContain('{live ? "Pause" : "Go live"}');
    expect(settings).toContain("void setStoreLive(store.id as string, !live)");
    expect(settings).toContain("Your stores");
    expect(settings).not.toContain("Run this store");
    // The list is worth showing as soon as there is more than one store; it used
    // to appear only once the account was already over its limit.
    expect(settings).toContain("{stores.length > 1 && (");
  });

  it("follows the account's own plan limit rather than a hard-coded one", () => {
    expect(settings).toContain("formatLimit(storeLimit)");
    expect(settings).toContain("effectiveStoreLimitFor(plan)");
  });
});

/*
 * A merchant edited a product, walked away without pressing Save, and reported
 * that the description "did not show" on the storefront. It was there — as an
 * unsaved draft. The editor now keeps the work and publishes it on the way out,
 * instead of throwing up a "Leave site?" dialog on every tab and losing
 * everything when the app was swiped away.
 */
describe("Unsaved edits — kept and saved on the way out", () => {
  it("no longer blocks navigation with a browser dialog", () => {
    expect(editor).not.toContain('e.returnValue = ""');
    // The listener that remains only saves; it never cancels the navigation.
    expect(editor).not.toContain("e.preventDefault();\n        e.returnValue");
    expect(editor).toContain('window.addEventListener("pagehide", onPageHide)');
    expect(editor).toContain('window.addEventListener("beforeunload", onPageHide)');
  });

  it("writes the draft synchronously, so a hard quit still keeps the work", () => {
    expect(editor).toContain("writeEditorDraft(storeKey, pending)");
    expect(editor).toContain("void saveDraft(pending)");
  });

  it("publishes the pending changes when the merchant leaves", () => {
    expect(editor).toContain("void saveOnExitRef.current?.()");
    expect(editor).toContain("saveOnExitRef.current = handleSave");
  });

  it("only drafts when the app is merely backgrounded", () => {
    // Switching tabs mid-edit is not leaving; a half-typed price should not go
    // live, but it must not be lost either.
    expect(editor).toContain('if (document.visibilityState === "hidden") flushDraftOnExit()');
  });
});

/*
 * The price-request form shipped three of our own questions plus the buyer's
 * name and WhatsApp number. A tailor and a plumber need different answers, so
 * the merchant writes the questions and the platform asks nothing.
 */
describe("Price requests — the merchant writes every question", () => {
  it("starts a quote product with no questions of ours", () => {
    expect(editor).toContain("existing?.requestQuestions ?? [...NO_REQUEST_QUESTIONS]");
    expect(editor).not.toContain("DEFAULT_QUOTE_QUESTIONS");
  });

  it("asks the buyer nothing that is not the merchant's own question", () => {
    expect(storefront).toContain("quoteQuestions.map((question) => (");
    expect(storefront).not.toContain("quoteForm");
    expect(storefront).not.toContain("Your name");
    expect(storefront).toContain("resolveRequestQuestions(selectedProduct?.requestQuestions)");
  });

  it("says so plainly when the merchant wrote no questions", () => {
    expect(storefront).toContain("quoteQuestions.length === 0 && (");
    expect(editor).toContain("No questions yet.");
  });
});

describe("Store switcher menu — anchored to its button, never clipped", () => {
  it("renders the panel in a portal instead of inside the trigger's box", () => {
    // `absolute left-0 right-0` inside the trigger meant the sidebar clipped it
    // and on a phone it hung off one side of the screen.
    expect(switcher).toContain("createPortal(menu, document.body)");
    expect(switcher).toContain("triggerRef.current?.getBoundingClientRect()");
    expect(switcher).toContain("window.innerWidth - VIEWPORT_GUTTER - width");
  });

  it("names a paused store in the list", () => {
    expect(switcher).toContain("store.isLive === false");
    expect(switcher).toContain("Paused");
  });
});
