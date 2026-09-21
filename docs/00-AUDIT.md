# SwiftLink — Current State Audit (Recon 01)

**Date:** 2026-09-21
**Scope:** entire repository at commit `39bbfa1` ("upgrade logistics 2"), 97 tracked project files, ~16.1k lines of app code.
**How this was produced:** full file-tree read, targeted reads of every file >300 lines, `grep` inventory of Supabase tables/storage buckets, fresh `npm install`, `tsc --noEmit`, `next build`, `next lint`. Raw command evidence is in §7.

This document is deliberately blunt. It exists so we can stop guessing about what "cleanup" means and agree on a ranked work order.

---

## 1. What SwiftLink is today

A WhatsApp-first storefront product for small merchants:

- Merchant signs up (Google / email), gets a **store** whose entire configuration is one JSONB blob.
- Merchant edits "the store" in one screen (`/business`) that mixes products, branding, colors, templates and an inbox.
- Customer opens `/store/<handle>?shop=<uuid>`, sees a client-rendered storefront, adds to a cart, and "checks out" by sending a prefilled WhatsApp message to the merchant.
- A dispatch module (`/dispatch`, `/dispatch/driver/<code>`) streams driver GPS to a customer map.
- A 7-table "social" layer (reviews, comments, follows, messages, notifications, media, profiles) hangs off the storefront.

So the product is really **two products fused**: a storefront builder and a separate social/dispatch suite. The builder half — the thing this project is supposed to be — is the weakest part.

## 2. Architecture as-is

```
app/ (Next.js 15 App Router, React 19)
 ├── page.tsx ─► HomeClient ─┬─► LandingPage        (no session)
 │                           ├─► LauncherView       (session / dashboard)
 │                           ├─► CustomerStorefront (?shop=)
 │                           └─► TrackingView       (?track=)
 ├── pro/{,admin,analytics}  ─► AdminView / AnalyticsView
 ├── business/               ─► BusinessView (the "editor")
 ├── account/, cart/, signup/, reset-password/
 ├── store/[slug]/           ─► resolve handle → redirect ?shop=<uuid> → CustomerStorefront
 ├── [storeSlug]/[shopId]/   ─► CustomerStorefrontPage (server metadata only; UI is client)
 └── dispatch/, dispatch/driver/[code]/

context/SwiftLinkContext.tsx (1,647 lines)  ← single god context: auth, stores, products,
                                              cart, dispatch, GPS, analytics, notifications,
                                              theme, i18n-ish, toasts, scripted product tour

components/  (34 files, no folders by domain except landing/ and sections/)
  CustomerStorefront.tsx (1,364)  — the entire public storefront, inline monolith
  BusinessView.tsx       (1,339)  — the entire merchant editor, inline monolith
  AdminView.tsx          (1,624)  — admin console
  VisualEditor.tsx         (805)  — DEAD (see F-09)
  sections/*                      — DEAD (see F-09)
```

There is no server data layer. Every read/write goes from a client component directly to `supabase-js` with the anon key. No server actions, no route handlers, no service layer, no data-access module.

## 3. Data model reality

Tables actually queried by the app (grep of `.from(...)`):

| Table | Reads | Writes | Notes |
|---|---|---|---|
| `stores` | 11 | yes | `state_json` JSONB = **the whole product**: products, colors, templates, sections, SEO, testimonials |
| `store_reviews` | 10 | yes | also abused as the social feed "posts" table |
| `store_review_comments` | 8 | yes | |
| `social_profiles` | 12 | yes | also stores app theme preference (!) |
| `dispatch_tracking` | 9 | yes | |
| `delivery_receipts` | 2 | yes | |
| `store_events` | 3 | yes | analytics |
| `user_feedback` | 4 | yes | |
| `system_admins` | 3 | no | |
| `social_media`, `social_notifications`, `social_messages` | 9 | yes | |
| `store_notifications` | 0 | 0 | **declared in SQL, never used — dead schema** |

Consequences:

- **There is no `products` table.** Products are nested inside `stores.state_json`. You cannot query across merchants, cannot paginate a catalog, cannot index or aggregate inventory, and every product save rewrites the entire store blob (last-write-wins → two open tabs silently destroy each other's work).
- **There is no `orders` table.** An "order" is a WhatsApp message. There is no order record, no status, no fulfilment history, no revenue number anywhere. The Analytics screen can only report `store_events` counts. A commerce platform with no orders table cannot do payouts, receipts, refunds, or merchant reporting.
- **Schema is scattered across 14 SQL files in `docs/`** (`SUPABASE_SETUP.sql`, `SOCIAL_*.sql` ×11, `store_reviews.sql`, `ADMIN_SETUP.sql`) with no migration tool, no ordering, and contradictory policies. Nobody can spin up a fresh environment from this repo reliably.
- Merchant metadata (`biz_name`, `store_username`, `phone`, `plan`) is duplicated between real columns and `state_json`, and the code has to remember which one wins (`fetchStores` does this by hand — `context/SwiftLinkContext.tsx:150-160`).

## 4. Findings, ranked

### P0 — Security

**F-01 · There is no server-side auth.** `middleware.ts` is a no-op that returns `NextResponse.next()` unconditionally. `@supabase/ssr` is a declared dependency that is **never imported anywhere** (grep: only `package.json`, `package-lock.json`, and a changelog claim). Route protection is a client-side array check in the provider (`PROTECTED_PATHS` → `SwiftLinkContext.tsx:127`, redirect at 385-400). Anyone can request `/pro/admin` and the HTML renders; `/pro/admin/page.tsx` has no gate at all. `docs/CHANGELOG_APRIL.md:7` claims "Middleware Security using `@supabase/ssr`" — that claim is false.

**F-02 · `dispatch_tracking` is world-writable.** `docs/SUPABASE_SETUP.sql`: `CREATE POLICY "Owner/Driver can update tracking" ... USING (true)`. Any anonymous client with the public anon key can move any delivery's GPS coordinates or mark any delivery `delivered`. The insert policy `WITH CHECK (auth.uid() = store_id)` compares a user UUID to a store UUID — it can never be true.

> **Resolved in P0** — the dispatch module was removed from the product entirely and `dispatch_tracking` / `delivery_receipts` are dropped by `supabase/migrations/20260921090000_drop_dispatch_tracking.sql` (see `docs/03-DECISIONS.md` D3).

**F-03 · Reviews are world-writable.** `supabase_migration.sql`: `CREATE POLICY "Auth insert reviews" ON public.store_reviews FOR INSERT WITH CHECK (true)` — no auth, no ownership, no rating bounds. Combined with public SELECT, anyone can inject arbitrary content into any merchant's storefront feed.

**F-04 · The whole store blob is public.** `stores` has `FOR SELECT USING (true)`, and `state_json` contains merchant phone numbers, contact emails, delivery areas, fees and the full cost structure. There is no public view/projection separating "shopfront" from "private config".

**F-05 · PIN hashing exists but the PIN is stored in the JSON blob.** `lib/utils.ts:hashPin` (SHA-256) is well implemented, but because `stores.state_json` is publicly readable, any delivery PIN living there is exposed as a raw value and reachable by customers. The good primitive is undermined by F-04.

**F-06 · Admin elevation is client-side.** `checkAdminStatus` queries `system_admins` from the browser and then upgrades the local `state.plan` to `business` (`SwiftLinkContext.tsx:198-217`). Plan gating (`isProUser`, `isPremium`) is therefore cosmetic — it lives in client state that any user can edit in devtools.

### P0 — Correctness / dead product surface

**F-07 · The visual editor is a phantom.** `VisualEditor.tsx` (805 lines) and the whole `components/sections/` engine (`SectionRenderer.tsx`, `HeroSection.tsx`) are **never imported by any file**. `editorMode` is exposed by the context (`SwiftLinkContext.tsx:122,195,1631`) and consumed by nobody. The merchant-visible "sections" feature — reorder, duplicate, delete, change template, per-section styles — writes to `state.sections` and is rendered by nothing. What the public storefront actually renders is the legacy `heroTemplateId / catalogTemplateId / aboutTemplateId / footerTemplateId` fields (`CustomerStorefront.tsx:1027-1048`).

Net effect: a merchant can spend 20 minutes rearranging sections in the advanced editor and **publish zero visible change**. This is the single most damaging user-facing bug in the product, and it is why customization "feels generic".

**F-08 · `/banned` does not exist.** `fetchStores` calls `router.replace('/banned')` (`SwiftLinkContext.tsx:165`) and there is no `app/banned/page.tsx`. Banned merchants get a 404.

**F-09 · Handle-less stores share a slug, and the fallback is unreachable.** `getShopPath` (`lib/utils.ts`) falls back to `/store/visit?shop=…` when a store has no slug — but that branch can never run, because `getPublicStoreSlug` always returns something (`slugifyStoreName("")` yields the literal `"store"`). So the real defect is worse than a dead branch: **every store without a handle is published at `/store/store`**, and the second such store collides with the first. Fixed in P0 by requiring a real handle for slug paths and routing handle-less stores through `/?shop=<id>`.

**F-10 · PWA is half-removed.** `next.config.ts` sets `withPWAInit({ disable: true })` while `public/sw.js` and `public/workbox-f1770938.js` remain committed and served at `/sw.js`. A stale service worker can pin users to old chunks after a deploy — a classic "why is the site broken, it works on my machine" generator, and a plausible cause of the repo's `auth fix` / `fix bad token` commits.

**F-11 · Type and lint gates are disabled.** `next.config.ts` sets `typescript.ignoreBuildErrors: true` and `eslint.ignoreDuringBuilds: true`. The build therefore proves nothing about correctness. (Measured: the tree *does* currently typecheck clean — see §7 — so the gates can be turned back on, but not until the dead-code removals land.)

### P1 — Architecture and data

**F-12 · God context.** `SwiftLinkContext.tsx` is 1,647 lines and ~200 lines of exported API surface covering auth, multi-store, products, cart, dispatch, GPS streaming, scripted onboarding tour (including a fake animated hand cursor and a typewriter effect), analytics logging, notifications, toasts, theme, feedback and editor mode. Every storefront page, including anonymous customer traffic, mounts it. Changes here are high-risk by construction.

**F-13 · Two parallel customization systems, one of them dead.** `ShopState` carries both the legacy `*TemplateId` fields and a `sections: PageSection[]` array (`lib/schema.ts:139-155`). `defaultShopState()` seeds `sections` with a hero and a catalog (see §F-21). Nothing reconciles them. Any real design work must first pick one model.

**F-14 · 10 hero templates and 10 catalog templates exist only as `if` chains.** `HeroTemplate` is a 440-line chain of `if (templateId === 'hero-N')` blocks with hand-written inline styles (`CustomerStorefront.tsx:46-483`). `CatalogTemplate` implements 5 distinct layouts out of the 10 IDs the editor offers. Template metadata is duplicated a third time as hand-drawn SVG thumbnails in `BusinessView.tsx:373-382`. Adding a template means editing four places; adding a *variant* means copy-pasting 60 lines of inline style.

**F-15 · No draft/publish, no revision, no undo.** `saveFullState` writes the live blob. `VisualEditor`'s local `history` array is unreachable dead code. The `beforeUnload` guard (`BusinessView.tsx:222-231`) is the only protection against losing an edit.

**F-16 · Zero tests, zero CI.** 0 test files, no test runner in `package.json`, no `.github/workflows`. For a codebase where a save rewrites the live storefront, this is the highest-leverage gap after the security items.

### P1 — Performance and SEO

Measured from the production build (§7):

- `/` 258 kB First Load JS · `/business` 266 kB · `/pro` 235 kB · storefront `/store/[slug]` 243 kB · `/[storeSlug]/[shopId]` 238 kB.
- **The customer storefront ships ~240 kB of JS** to a phone on a Nigerian mobile network, to render a product grid that could be static HTML.
- **The storefront is client-rendered.** `CustomerStorefront` fetches its own data from the browser and paints after hydration. `app/[storeSlug]/[shopId]/page.tsx` only produces `generateMetadata`. Google sees an empty shell. For a product whose entire value proposition is "your business gets a website", this is a product-level defect, not a perf nit.
- **three.js + @react-three/fiber + drei** ship to every visitor of `/` and any storefront using a 3D hero template (`CustomerStorefront.tsx:34-38`). That's the single largest dependency in the tree, used for decorative hero backgrounds.
- **`next/font` is not used.** Fonts are loaded via a blocking `fonts.googleapis.com` stylesheet (`app/layout.tsx`), and **Font Awesome 6.4 is loaded from cdnjs.global** for icons while the codebase uses Lucide everywhere. Two icon systems, one external render-blocking dependency.
- `<img>` is used for every image (lint reports it repeatedly); no `next/image`, no sizing, no lazy loading, no CDN transforms.
- Build takes **3.4 minutes** for 97 files.

### P1 — Design system and UX

**F-17 · Tenant theming is a global CSS hijack.** The storefront injects a `<style>` tag that overrides Tailwind utility classes **with `!important`**:

```css
.bg-emerald-500 { background-color: var(--btn-color) !important; }
.bg-white       { background-color: var(--surface-color) !important; }
.text-gray-900  { color: var(--text-color) !important; }
```
(`CustomerStorefront.tsx:963-973`)

Every component that happens to use `.bg-white` or `.text-gray-900` inside the storefront — including the product page, cart, search, reviews — is silently repainted. The same pattern is repeated globally in `app/globals.css` for dark mode (`.dark .bg-black { background-color: #0c0e12 !important }`). This is why "design" changes keep breaking unrelated screens: there is no token layer, so theming is done by brute force on class names. **This is the root cause of the design mess.**

> **Mostly resolved in P1** — the console's `!important` block in `app/globals.css` is gone; dark mode is a token swap. The storefront's injected block is **still live** and deliberate: it is the only theming mechanism published stores have, and its replacement is the P4 storefront rebuild on `data-theme-scope="storefront"` + `--t-*`. Removing it before its replacement exists would untheme every live shop. See `docs/03-DECISIONS.md` D6.

**F-18 · No design tokens at all.** `tailwind.config.ts` is empty (`theme: { extend: {} }`). Colors, radii, shadows, spacing, fonts and easings are hard-coded as hex literals and Tailwind utility strings in ~16k lines of components. 24 hard-coded palettes in `BusinessView.tsx:19-45` are the only "system", and some of them (Cyberpunk, Matrix Green) can't pass contrast.

> **Resolved in P1** — `lib/theme/` now holds a 3-layer token architecture (primitives → semantic → component) with a contrast engine (`color.ts`, OKLCH + WCAG gates) and a validated preset library replacing the 24 hard-coded palettes (`presets.ts`, 20 presets across 8 families). Parity between `tokens.ts` and `styles/tokens.css` is enforced by a test, and every shipped preset is audited for AA by `theme.test.ts` — so an unreadable preset can no longer be added, let alone shipped.

**F-19 · Contradictory visual language.** The merchant console mixes: Instrument Serif italics + Cinzel display caps + Plus Jakarta Sans + Inter + monospace; emerald `#10b981` in light mode but a different green `#00c885` in dark mode; amber as a third accent; 2.5rem pill radii next to sharp 4px buttons; `font-black uppercase tracking-widest` for nearly all text (which destroys hierarchy — when everything is loud, nothing is). Storefront templates add a further 10 unrelated languages (brutalist, glassmorphism, cyber-grid, cosmic particles…).

> **Console resolved in P1, storefront in P4.** The console is now one family (`next/font`, self-hosted), one accent (emerald 700 for anything carrying text), and one type scale with a single display weight per view. The two novelty faces (`.font-serif-luxury`, `.font-brand-header`) survive on `BusinessView` and `LauncherView` only, and are deleted with those screens. Storefront font *pairings* are already part of the tenant theme contract; the storefront port is P4.
>
> **Additional bug found while doing this:** `app/globals.css` set `font-family: var(--font-inter), system-ui` and `--font-inter` was defined **nowhere**, so the whole declaration was invalid at computed-value time and body copy silently fell back to the system font — while a render-blocking `fonts.googleapis.com` stylesheet loaded four families that never reached the page. Fixed, with a test that requires an inline `var()` fallback on every font variable so it cannot recur.

**F-20 · Icons and avatars are ad-hoc.** Icons: Lucide (unpinned-looking `^1.7.0`) + Font Awesome CDN + raw emoji, chosen per-file with no size/stroke convention. Avatars: user identity is a **hard-coded emoji** — `<span>👨‍🚀</span>` for the merchant's own avatar (`LauncherView.tsx:66`) — and social identities hash a name into one of ten emoji (`SocialPage.tsx:46-52`), while the storefront picks avatar images by `charCodeAt(0) % AVATARS.length`. For a paid business tool, emoji avatars read as a toy.

> **Mostly resolved in P1** — `components/ui/icon.tsx` is now the only way to render an icon (Lucide only, one size scale, one stroke), and identity goes through a four-tier `<Avatar>` ladder (`lib/avatar.ts` + `components/ui/avatar.tsx`): uploaded image → provider image → deterministic generated SVG → branded initials. Generated avatars are local, seeded, dependency-free and unit-tested for determinism, and tenants can pin them to the brand hue. The `👨‍🚀` in `LauncherView` is gone. `SocialPage`'s ten hashed emoji migrate with that module in P3/P4.

**F-21 · Placeholder content ships to production.** `defaultShopState()` seeds `aboutUs: "Store launched on SwiftLink."` and "Welcome to our Store" sections (`lib/types.ts:18-40`). The onboarding heuristic that decides whether a merchant "needs onboarding" is a substring test for the word *store* in the business name (`OnboardingModal.tsx:27`) — a merchant legitimately named "Storehouse Foods" can never complete onboarding.

**F-22 · Styling/UX smells in the shell.** `window.customPrompt` / `window.customConfirm` are monkey-patched onto `window` to build dialogs (`AppChrome.tsx:26-49`) — an untyped global replacing a component. A full-screen fake "loading" overlay gates every non-landing route (`AppChrome.tsx:65-75`). A scripted tour with a simulated hand cursor and fake typing (`SwiftLinkContext.tsx:779-1017`) runs over the merchant's real data.

### P2 — Operations

- No error tracking, no logging strategy, no uptime or perf monitoring.
- `docs/` holds 14 unrunnable-by-order SQL files plus a changelog that describes features that don't exist (see F-01).
- README describes "Store Editor: Drag-and-drop management" — there is no drag-and-drop library in the tree.
- Env handling: `isSupabaseConfigured()` treats a `dummy-project.supabase.co` URL as unconfigured and silently degrades to demo mode, so misconfiguration looks like "empty store" instead of an error.
- No linter config beyond `next/core-web-vitals` defaults, no formatter, no commit hooks, no conventional-commit enforcement.

## 5. What is genuinely worth keeping

Being honest about the good parts matters as much as the bad:

1. **The WhatsApp checkout loop is the product's real moat.** Prefilled cart → merchant's phone needs no payments infrastructure, no KYC, no trust from the buyer. Keep it as a first-class checkout *option*, not a limitation.
2. **Dispatch tracking is differentiated.** Driver GPS portal + customer map + PIN handoff + SHA-256 pin hashing (`lib/utils.ts:hashPin`) is a real logistics feature that most storefront builders don't have.
3. **Multi-store switching** per account is already modelled (`owner_id` + free UUID `id`) and is a monetizable Pro feature.
4. **The `hero-1 / hero-2 / hero-3` visual direction is genuinely good.** The brutalist blackout hero and the split editorial hero are better than what most template factories produce. The problem is the delivery mechanism (if-chains + inline styles), not the taste.
5. **Rendering is already decoupled enough to keep**: the storefront is one component tree driven by one state object, so a rewrite of the host (RSC + tokens) is a refactor, not a greenfield.
6. Typecheck and build both pass on a clean install (§7), so we are not starting from a broken tree.
7. `normalizeShopState()` (`lib/types.ts:84-114`) already shows the right instinct: defend against malformed blob data at the boundary.

## 6. The three structural problems, in one line each

1. **The store is a JSON blob, not a data model** → no products, no orders, no queries, no versioning, no safe concurrent edits. (F-07, F-13, F-14, F-15, §3)
2. **Theming is a CSS class hijack, not a token layer** → every visual change is global, fragile and unreviewable, and merchant customization can only ever be "one accent color". (F-17, F-18, F-19)
3. **Trust is client-side** → no SSR auth, world-writable tracking and reviews, admin gated in the browser, plan tier in local state. (F-01…F-06)

Everything in the roadmap must reduce one of these three, or it is decoration.

## 7. Verification log

```
npm install --no-audit --no-fund --prefer-offline   → added 713 packages in 5m
npx tsc --noEmit                                    → exit 0, 0 errors
npm run build                                       → exit 0, compiled in 3.4min, 17/17 static pages
npx next lint                                       → warnings only (no-img-element, exhaustive-deps, jsx-a11y/alt-text)
grep inventory                                      → 16 tables referenced, 2 storage buckets, 0 test files, 0 CI workflows
```

Bundle sizes (First Load JS, from the build): `/` 258 kB · `/business` 266 kB · `/pro` 235 kB · `/pro/admin` 246 kB · `/store/[slug]` 243 kB · `/[storeSlug]/[shopId]` 238 kB · shared 102 kB.
