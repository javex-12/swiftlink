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
| Website templates | ✅ | `lib/theme/templates.ts` — Editorial / Boutique / Bold, each in light + dark; all six variants audited for AA in `templates.test.ts` |
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

---

# Addendum — the login breakage (2026-09-21)

"Login doesn't work" after P0. Root cause, found by reading the two halves against each other:

**The client stored the session in `localStorage`; the middleware read cookies.** `lib/supabase-client.ts` used plain `createClient` (default storage: localStorage), while the P0 middleware validates every request from the `sb-*` **cookies** (`docs/00-AUDIT.md` F-01). So `signInWithPassword` succeeded, the user object even cached — and then `router.push("/pro")` bounced straight back to `/signup`, because the browser sent no cookie for the middleware to read. The signup page saw the localStorage session and pushed `/pro` again: an infinite redirect loop that presents as "login is broken".

**Fix:** `lib/supabase-client.ts` now uses `createBrowserClient` from `@supabase/ssr` — cookie storage, the same cookies the middleware refreshes. One session across client, middleware and server components. The singleton is created lazily through a typed `Proxy`, so all 11 existing import sites keep working unchanged; the explicit `SupabaseClient` type annotation matters because `ReturnType<typeof createBrowserClient>` resolves to the *last* overload and silently erased every call site's inference.

**Second bug found on the same page:** `saveUserStore` upserted `id: uid` with no `owner_id`. `stores.id` is a free UUID (P0), so for a returning user that **inserted a second row with a NULL owner** — invisible to the dashboard, which queries `owner_id = user.id`. Confirmed live: production already had **2 orphan stores**. Now owner-correlated (`.eq("owner_id", uid)` → update, else insert with `owner_id`). The orphans in production need a one-time cleanup (P2 backfill).

**Third:** the page never read the `?next=` param that middleware has been setting since P0 — every login landed on `/pro` regardless of where the merchant was heading. Fixed.

**Also changed in the redesign:** the Google button without a client id no longer silently enters "demo mode" (i.e. fakes a login with no session). Demo mode is reachable explicitly from the "Supabase not configured" notice only.

**Auth-page redesign** (`app/signup/page.tsx`, D5): tokens and UI-kit controls instead of the old light/dark hex forks; real `<label>`s with `aria-invalid` wiring; `next/font` self-hosted faces; marketing stats on the brand panel replaced by three concrete claims, since fake numbers on a login screen undermine the product.

---

## D10 · The merchant journey is a guided checklist, not a dashboard

**Decided:** 2026-09-26 · **Owner:** product ("if you create a website, finish what's next")

New stores were dropped onto two decorative cards with no sense of progress or next action — the workflow felt chaotic because nothing told the merchant what to do after signing up. The dashboard now leads with a **setup checklist**: it shows how far along the store is, which step is next, and one primary action toward it, and it becomes a "share your store" prompt once everything is done.

What "set up" means is defined once, as a pure function — `lib/setup-guide.ts` (`buildSetupGuide`) over `ShopState`, covering five steps: business name · store handle · WhatsApp number · first product · customised design. No new state fields were added; the "design" step is detected by comparing against the `defaultShopState()` values.

This also **fixes F-21**: the old activation heuristic was `bizName.includes("store")`, so a business legitimately named "Storehouse Foods" could never complete onboarding. Both the wizard and the checklist now use `hasRealStoreName` / `hasWhatsAppNumber` from the same module.

Moved onto the token layer + UI kit in the same slice: `LauncherView` (dashboard) and `OnboardingModal` (first-run wizard). The two novelty faces (`font-serif-luxury`, `font-brand-header`) are gone from `LauncherView`.

**Verification:**

```
npm run typecheck   → exit 0, 0 errors
npm run test        → 150 passed (7 files)   (+9: setup-guide.test.ts)
npm run lint        → 0 errors, 0 warnings on all changed files
npm run build       → exit 0, 18 routes
```

Bundle movement (First Load JS): `/` 253 → 267 kB · `/pro` 236 → 250 kB · `/business` 263 → 271 kB. The +14 kB is the dashboard now rendering through the UI kit (Card/Badge/Button/Icon + the checklist) rather than raw Tailwind — deep imports keep Radix out of these routes.

## D11 · Three full website templates replace the twenty theme presets (implemented)

**Decided:** 2026-09-26 · **Owner:** product

`docs/02-BUILDER-ARCHITECTURE.md` §3 targeted ~20 themes across 8 families, and `lib/theme/presets.ts` shipped them in P1. The product direction is simpler: **three complete website templates**, not twenty color presets and not section templates — three distinct sites, each with a correct light and dark version. The 20-preset library has been deleted along with the 24-entry `PRESET_PALETTES` table in `BusinessView.tsx`; whole-site looks are now the three templates. (The current `CustomerStorefront` still themes through its injected `!important` block, per D6 — the storefront port to `--t-*` is P4.)

**Implemented:** `lib/theme/templates.ts` defines the three templates (Editorial, Boutique, Bold), each with a full light and dark `TenantTheme` and a page composition. `components/WebsiteTemplatePicker.tsx` puts them on the dashboard with a light/dark toggle and writes `websiteTemplateId` + the composition ids onto the store (`ShopState.websiteTemplateId`). The storefront now applies the chosen template's `--t-*` tokens on a `data-theme-scope="storefront"` element, and its class block was rewritten to consume those tokens (falling back to the old inline vars), so light/dark is a real, contrast-checked theme swap.

**Also in this slice:** `derive.ts` no longer imported zod at runtime. It took `FONT_PAIRS` from `theme-schema` (which imports zod), so rendering a storefront through it pulled a schema validator into every store visit. The font constants moved to the zod-free `lib/theme/font-pairs.ts`, and `templates.ts` is zod-free by design (validated in `templates.test.ts` instead of on import). Measured: the naive version cost **+29 kB First Load JS** on the storefront; the split brought it to **+5 kB**.

**Deleted in this slice:** `lib/theme/presets.ts` (20 presets across 8 families) and the 24-entry `PRESET_PALETTES` hex table in `BusinessView.tsx` are gone. The editor's Appearance tab now leads with `WebsiteTemplatePicker` (the three templates + a light/dark toggle); the old per-section accordions remain as advanced overrides, and their "Randomize" dice now generates a palette from an HSL colour harmony instead of drawing from the deleted hex table. `theme.test.ts` and `app/dev/ui/page.tsx` were repointed at `websiteTemplates` (six variants instead of twenty presets).

**Verification:**

```
npm run typecheck   → exit 0, 0 errors
npm run test        → 150 passed (8 files)   (+23: templates.test.ts); the old
                      preset audit in theme.test.ts shrank to a derivation sample
npm run lint        → 0 new errors/warnings on changed files
npm run build       → exit 0, 18 routes · /business 277 kB, storefront 249 kB
```

Bundle (First Load JS): `/` 271 kB · storefront `/store/[slug]` 249 kB · `/[storeSlug]/[shopId]` 245 kB — i.e. +4–5 kB over the pre-templates baseline, not the +29 kB the zod leak cost.

## D12 · One calm column: the auth and marketing screens rebuilt on tokens (implemented)

**Decided:** 2026-09-27 · **Owner:** product

`/signup` (the login screen) and the landing page are the first two screens a visitor sees, and both were the least consistent surfaces in the product. The auth page spent half the viewport on a split marketing panel — pushing the primary action below the fold on phones — and carried a phone mockup with invented stats. The landing page was literal `slate-*`/`emerald-*` utilities over hard-coded `#020617` surfaces, opened with a 1.2s fake preloader, and stacked a "cybernetic holographic HUD", a double marquee and an auto-playing phone demo before saying what the product does.

**Auth.** Rebuilt as one centred column: a compact header (logo + theme toggle), a single card, and a segmented **Sign in / Create account** switch instead of a heading plus a text link. Mobile-first throughout (`min-h-[100dvh]`, no fixed widths, no scale tricks).

**Two bugs fixed in the auth screen.** (1) The Google button used an invisible `GoogleLogin` iframe scaled `1.5×`, which pushed the hit area past the form column — the cause of sideways scroll and dead taps on phones; it is now clipped and non-scaling. (2) `CountrySelector` was `h-full … py-4` on legacy `slate`/`emerald`, so it dictated the row height and made the phone field taller than the rest of the form; it is now token-based at the same `h-11` as `Input`, with a width-clamped menu.

**Landing.** Rebuilt entirely on `--app-*` tokens (dark mode is a token swap, not a second palette). Deleted the fake preloader (`docs/00-AUDIT.md` F-22), the cyber HUD, the double marquee and the animated phone demo. What remains is one column: a hero with an honest storefront preview (no invented metrics), three features, three steps to go live, three plans, a closing CTA and a footer. Copy matches what the product does.

**Verification:**

```
npm run typecheck   → exit 0, 0 errors
npm run test        → 150 passed (8 files)
npm run lint        → 0 warnings/errors on the changed files
npm run build       → exit 0, 18 routes
```

Bundle (First Load JS): `/` 268 kB (page 10.9 kB, down from 14.3 kB) · `/signup` 230 kB (page 13.2 kB).

## D13 · The three websites are visible before you apply one (implemented)

**Decided:** 2026-09-30 · **Owner:** product

D11 built Editorial, Boutique and Bold as complete storefronts, but the picker, the landing page and the sign-in screen still showed a colour block or a generic product grid. A merchant could not see the website they were about to choose.

`components/storefront/template-frames.tsx` draws a miniature of each template from the same `--t-*` tokens as the live shop. The dashboard picker, the landing hero and a new Websites section, and a desktop-only rail on `/signup` all render that miniature. The sign-in form stays a single column below `lg`, so the preview never pushes the primary action below the fold on a phone. Light and dark on those previews are the template's own themes, not a second painted palette.

