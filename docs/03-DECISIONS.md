# SwiftLink — Decisions Log

Running record of decisions that shape the rebuild, so we don't re-litigate them. Newest at the bottom.

---

## D1 · Rebuild strategy — strangler refactor in place

**Decided:** 2026-09-21 · **Owner:** Buffy (delegated by product)

Keep this app and repo. Replace the foundation piece by piece (auth → tokens → data layer → editor → storefront) while the app stays deployable, and delete each piece of code the moment a phase obsoletes it.

**Why not a clean rewrite:** the audit shows two genuinely valuable assets (the WhatsApp order loop, and the dispatch/PIN logic that we are now cutting) and, crucially, that the components are *already* driven by a single state object — so replacing the host is a refactor, not a greenfield port. A rewrite would also mean rebuilding auth, storage and data migration before any user-visible improvement, and would leave the app undeployable for weeks. The thing that made this codebase a mess was never "the wrong framework" — it was no tokens, no data model, no tests and no gates. A rewrite that doesn't fix those is just a second mess with better syntax.

**Guardrail:** any file we touch lands on the new foundation. No new code may import `SwiftLinkContext`, `CustomerStorefront`, or `stores.state_json` once the replacement for its area exists.

## D2 · v1 customization scope — everything (axes A–J)

**Decided:** 2026-09-21 · **Owner:** product

Full scope: themes, global styles, section builder, multi-page & navigation, catalog with variants/collections, commerce behaviour, brand assets, custom domains & per-page SEO, advanced code, and generative/AI store creation. Delivered in the phased order in `02-BUILDER-ARCHITECTURE.md` §7 — scope is fixed, sequence is fixed, dates are not.

## D3 · Dispatch tracking — remove

**Decided:** 2026-09-21 · **Owner:** product ("remove the tracking stuff")

Delete the dispatch/logistics module, not just freeze it:

- routes: `app/dispatch/**`, `app/dispatch/driver/[code]`
- components: `DispatchView.tsx`, `TrackingView.tsx`
- context surface: `handleDispatchSubmit`, `removeDelivery`, `initTracking`, `confirmDelivery`, `copyTrackLink`, `copyTrackingPortalLink`, `trackingDisplay`, `currentLocation`, `startLocationTracking`, GPS watcher, `Delivery` type, `deliveries` state
- deps: `leaflet`, `react-leaflet`, `@types/leaflet`
- schema: `dispatch_tracking`, `delivery_receipts`
- entry points: `?track=` handling in `HomeClient`, the tracking link in `LauncherView`'s dropdown, the "LOGISTICS" card + `inTransit` stat, the "Total Deliveries" stat in `AccountPage`, tracking references in `AdminView`/`AnalyticsView`

**Interpretation to confirm:** this covers logistics/dispatch tracking only. **Customer product reviews on the storefront stay** (they sell product and are rebuilt on verified orders in P2). If "tracking" was meant to include reviews, say so and I'll cut those too.

## D4 · Payments — orders table now, WhatsApp-only checkout

**Decided:** 2026-09-21 · **Owner:** product

WhatsApp remains the only checkout channel for v1, but **every order writes a row** to a real `orders` table (`channel = 'whatsapp'`) so merchants get order history, fulfilment state and revenue reporting immediately. Online payment (Paystack/Flutterwave — see `02-BUILDER-ARCHITECTURE.md` §6, chosen because Gravity's catalog has no Nigerian provider and its own reasoning rules out Stripe for USSD/bank transfer/local payouts) lands later behind the same `orders` model, so nothing has to be re-modelled when it does.

## D5 · Console look — friendly Shopify-style

**Decided:** 2026-09-21 · **Owner:** product

Generous whitespace, large tap targets, plain-language labels, illustrated empty states, a visible setup checklist, mobile-first — most merchants will run this from a phone. Density is earned through structure (cards, sections, tables), never by shrinking type. Data surfaces (orders, products, analytics) stay compact with tabular numbers where scanning matters.

---

# P0 progress

P0 = stop the bleeding. Status as of 2026-09-21:

| Item | Status | Evidence |
|---|---|---|
| Real SSR auth in middleware (`@supabase/ssr` now actually used) | ✅ | `middleware.ts` — session refresh + `/pro`, `/business`, `/dispatch`, `/account` gated |
| Server-side admin gate | ✅ | `middleware.ts` admin branch + `requireAdmin()` in `app/pro/admin/page.tsx` |
| Server auth helpers for all future privileged work | ✅ | `lib/supabase/server.ts` (`getServerUser`, `requireUser`, `isServerAdmin`, `requireAdmin`) |
| Dead code deleted | ✅ | removed `VisualEditor.tsx`, `components/sections/*`, `EditorContextMenu.tsx`, `editorMode` in context (F-07) |
| Stale service worker deleted | ✅ | removed `public/sw.js`, `public/workbox-*.js`, `@ducanh2912/next-pwa` (F-10) |
| Missing routes added | ✅ | `app/banned/page.tsx` (F-08), `app/not-found.tsx`, `app/error.tsx` |
| Handle-less store collision | ✅ | `getShopPath` requires a real handle; `/?shop=<id>` otherwise (F-09, corrected in audit) |
| Unused Font Awesome CDN removed | ✅ | `app/layout.tsx` (F-20); Google Fonts stay until next/font lands in P1 |
| Build gates re-enabled | ✅ | `next.config.ts` — `ignoreBuildErrors`/`ignoreDuringBuilds` now `false`; 10 hidden lint errors fixed (F-11) |
| Test suite exists | ✅ | Vitest + 36 unit tests over URL/shop-state/pin logic (F-16) |
| CI gate | ✅ | `.github/workflows/ci.yml` — typecheck · lint · test |
| Scripts | ✅ | `typecheck`, `test`, `test:watch`, `check` |
| RLS policy fixes (F-02…F-05) | ⏳ | needs the Supabase project + `supabase/migrations` (P2), tracked below |
| Remove dispatch module (D3) | ✅ | deleted `app/dispatch/**`, `DispatchView`, `TrackingView`, `lib/dispatch.ts`, `Delivery`/`deliveries` state, GPS watcher, Leaflet deps, the context surface (9 members), admin telemetry, tour step and marketing claims; first SQL migration added at `supabase/migrations/20260921090000_drop_dispatch_tracking.sql` |
| 14 loose SQL files → migrations | ⏳ | P2 |

**Verification run after P0 edits + dispatch removal:**

```
npm run typecheck   → exit 0, 0 errors
npm run test        → 36 passed (2 files)
npm run lint        → 0 errors (75 warnings: <img>, exhaustive-deps — scheduled for P1/P4)
npm run build       → exit 0, compiled in 37s, 17 routes
```

Bundle movement (First Load JS): `/` 258 → 250 kB · `/business` 266 → 263 kB · storefront 243 → 239 kB · `/pro/analytics` 236 → 232 kB. Build compile time fell from 3.4 min (baseline) to 37 s. Route count 19 → 17 (dispatch portal + driver beacon removed).

**Deferred on purpose:** the four unsafe RLS policies (audit F-02…F-05) need a Supabase project to verify against, and F-02's table is now dropped by the migration above — the rest land with `supabase/migrations` in P2 rather than as unverifiable SQL edits.

---

## D6 · Tailwind stays on v3 through P1; v4 is revisited at P4

**Decided:** 2026-09-21 · **Owner:** Buffy (delegated)

`docs/02-BUILDER-ARCHITECTURE.md` §6 recommended moving to Tailwind v4 during P1 because v4's CSS-native `@theme` fits runtime per-tenant theming better than a JS config. Having now built the token layer, that upgrade buys less than expected and costs more:

- v3 already supports exactly what we need — tokens as CSS variables, mapped to utilities in `tailwind.config.ts`. That is what `tailwind.config.ts` now does, and a tenant theme is a *re-declaration of variables on a scope element*, which works identically in both versions.
- v4's real wins (`@theme`, automatic content detection, faster builds) are most valuable when a codebase's class names are stable. Ours is not: ~16k lines of components are still being migrated, and the storefront still themes itself through an injected `!important` block. Changing the engine mid-migration would churn every file twice.

**Revisit at P4** when the storefront is rebuilt on `--t-*` tokens. Decision recorded so it doesn't get re-litigated, and so a future reader doesn't assume v3 was an oversight.

## D7 · Avatars are generated in-repo, with no avatar dependency

**Decided:** 2026-09-21 · **Owner:** Buffy (delegated)

`docs/01-DESIGN-SYSTEM.md` §8 allowed either `@dicebear/core` (one bundled style) or a `boring-avatars`-style component. We wrote ~80 pure lines instead (`lib/avatar.ts`), because:

- **DiceBear's HTTP API is disqualified outright** — it means a third-party request from a customer's storefront, on data we cannot control.
- **A dependency is not needed for one style.** The value of DiceBear is its 63 styles; we want one, and we want it tinted by the tenant theme (`baseHue` / `hueSpread`), which is a modification anyway.
- **Determinism is load-bearing.** Same seed must render identically on the server and the client, or avatars flicker on hydration. Hand-rolled FNV-1a + OKLCH makes that provable in a unit test; a library makes it a assumption.

Cost: ~2 kB, zero new packages, and colors produced through `lib/theme/color` so the module contains no hex literals.

## D8 · Design-system lint rules apply to new code only

**Decided:** 2026-09-21 · **Owner:** Buffy (delegated)

`docs/01-DESIGN-SYSTEM.md` §12.2 asks for rules banning hex literals, `!important`, `<img>` and arbitrary Tailwind values. Turned on repo-wide, they report thousands of violations in components that haven't been migrated yet — and a rule that always fails gets disabled, which is how the original `ignoreDuringBuilds: true` happened.

So `.eslintrc.js` scopes them to `components/ui/**` and `lib/theme/**`, both shipped in this slice. The overrides grow as files move onto the foundation; they are never weakened. Same discipline as the existing repo-wide `@next/next/no-img-element` warning, which stays a warning until the `next/image` pipeline lands in P4.

## D9 · Native `<select>` in the console, not Radix Select

**Decided:** 2026-09-21 · **Owner:** Buffy (delegated)

`docs/01-DESIGN-SYSTEM.md` §12.1 lists shadcn/ui primitives, which use Radix Select. We installed Radix for Dialog, DropdownMenu, Tabs, Tooltip, Switch, Checkbox and Label but deliberately wrapped the platform `<select>` instead.

Reason: D5 puts most merchants on a phone, and on mobile Radix Select replaces the OS picker with a custom list. The OS picker is faster, larger, and what the user already knows — trading that for visual consistency is the wrong trade in a phone-first tool. Styling the closed control and the chevron is enough.

---

# P1 progress

P1 = tokens + UI kit — "looks like a product". Status as of 2026-09-21:

| Item | Status | Evidence |
|---|---|---|
| Color engine (OKLCH + WCAG gates) | ✅ | `lib/theme/color.ts`; 20 tests in `lib/__tests__/color.test.ts` |
| 3-layer tokens, single source of truth | ✅ | `lib/theme/tokens.ts` ↔ `styles/tokens.css`, parity enforced by `lib/__tests__/tokens.test.ts` |
| Tenant theme contract (zod) | ✅ | `lib/theme/theme-schema.ts` — never throws, repairs bad input, bridges the legacy blob |
| Theme derivation + contrast report | ✅ | `lib/theme/derive.ts` — `buildTheme`, `themeToCssVars`, `adjustments` for the "we adjusted your color" note |
| Theme preset library | ✅ | `lib/theme/presets.ts` — 20 presets across 8 families, every one audited for AA in `theme.test.ts` |
| Semantic Tailwind layer | ✅ | `tailwind.config.ts` — `app-*` and `t-*` namespaces, all values resolve to tokens |
| `!important` class hijack removed (console) | ✅ | `app/globals.css` rewritten; dark mode is now a token swap. Storefront block remains until P4 (see below) |
| UI kit | ✅ | `components/ui/*` — Button, Card, Badge, Field/Input/Textarea/Select, Switch, Checkbox, Tabs, Tooltip, DropdownMenu, Dialog + ConfirmDialog + PromptDialog, EmptyState, Skeleton, Spinner, Icon, Avatar |
| Avatar ladder | ✅ | `lib/avatar.ts` + `components/ui/avatar.tsx`; the `👨‍🚀` in LauncherView is gone |
| Evil globals removed | ✅ | `window.customPrompt`/`customConfirm` replaced by `ConfirmDialog`/`PromptDialog` (new call sites; old ones migrate with their screens) |
| Self-hosted fonts | ✅ | `next/font` in `app/layout.tsx`; Google Fonts CDN + preconnects removed |
| Design-system lint guardrails | ✅ | `.eslintrc.js` scoped to `components/ui/**`, `lib/theme/**` |
| Kit showcase page | ✅ | `app/dev/ui/page.tsx` (404s in production) — the Storybook-equivalent from §12.4 |
| Storefront moved onto `--t-*` | ⏳ | P4 — the injected `!important` block in `CustomerStorefront.tsx` is still the live theming mechanism, and removing it without the rebuilt storefront would untheme every live shop |
| `SocialPage` emoji avatars | ⏳ | P3/P4 — uses the same ladder, but the social module is rebuilt later |
| `font-serif-luxury` / `font-brand-header` | ⏳ | Still on two console screens; deleted when those screens move to the kit |
| Playwright visual regression | ⏳ | Not started; `/dev/ui` exists so it can be captured |

**Verification after P1 edits:**

```
npm run typecheck   → exit 0, 0 errors
npm run test        → 141 passed (6 files)
npm run lint        → 0 errors (73 warnings, all pre-existing <img>/exhaustive-deps)
npm run build       → exit 0, 18 routes
```

**Measured regression caught and fixed:** importing the `@/components/ui` barrel from `LauncherView` pulled every Radix primitive into `/` and `/pro` (+42 kB First Load JS each). Deep-importing `@/components/ui/avatar` restored them. Final First Load JS: `/` 253 kB (was 250) · `/pro` 236 (was 235) · `/business` 263 (unchanged) · storefront 240 (was 239). The +3 kB on `/` is the token layer. `/dev/ui` is 188 kB, isolated to that route.

**Real bug found while doing this:** `app/globals.css` declared `font-family: var(--font-inter), system-ui` and `--font-inter` was defined **nowhere**, so the declaration was invalid at computed-value time and the whole console silently rendered in the system font — while a render-blocking `fonts.googleapis.com` stylesheet loaded four families that never reached the page. Fixed by registering the `next/font` variables the stack actually references, and `tokens.test.ts` now asserts every font variable has an inline `var()` fallback so it cannot recur.

**Also found:** the old primary button was a `#10b981 → #059669` gradient with white text — 2.54:1 and 3.77:1, failing AA across its entire surface. The console accent is now emerald 700 (`--app-accent`, 5.48:1 with white), with emerald 500 kept as a decorative primitive.

**Deferred on purpose:** the storefront's injected `<style>` class-hijack block. It is the live theming mechanism for every published store, and the token-based replacement is the P4 storefront rebuild — removing it first would untheme production. The scope element (`data-theme-scope="storefront"`) and the full `--t-*` set are already in `styles/tokens.css`, so P4 is a port, not a redesign.

