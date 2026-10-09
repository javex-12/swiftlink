# SwiftLink — Recon 04, Research & Improvement Plan

**Date:** 2026-10-07
**Scope:** whole repo at `main` (`631e507`), focused on the owner's reported defect list.
**Method:** file reads + `grep` inventory of every area named, plus fresh `typecheck` / `test` / `build`.
**Read with:** `docs/00-AUDIT.md` (structural audit), `docs/02-BUILDER-ARCHITECTURE.md` (roadmap), `docs/03-DECISIONS.md` (D1–D12).

This document is the evidence trail for the work list in §4. Every finding below was verified in
this tree — file and line are given so it can be re-checked. Where I could not verify something
without pixels or a live database, §7 says so instead of guessing.

---

## 1. What the tree actually is right now

Since `docs/00-AUDIT.md` was written, a lot of the *foundation* has landed — but the **last mile
often wasn't wired**. That single pattern explains most of the owner's list:

| Layer | State |
|---|---|
| Token system (`lib/theme/*`, `styles/tokens.css`) | **done**, tested |
| UI kit (`components/ui/*`, 13 primitives) | **done** |
| Server auth (`middleware.ts`, `lib/supabase/server.ts`) | **done** |
| Design presets → 3 website templates | **half** — preview is tokenised, live storefront is not (§3.3) |
| Inquiries / customers / analytics schema | **schema + helpers + tests only** — zero UI wiring (§3.2) |
| Dispatch | **removed** ✅ (migration `20260921090000`) — the `/dispatch` routes are gone, so "dispatch is out of SwiftLink" is already true in code |
| Build gates | **on** (`next.config.ts` no longer ignores TS/ESLint) |

So this is not a "start over" situation. It is **finishing wiring that was half-built**, then
fixing the handful of things nobody started.

---

## 2. Findings, by severity

### P0 — things that are outright broken for the owner today

**R-01 · `admin@swiftlink.pro` is not, and cannot be, an admin.** *Partially corrected against the
live database on 2026-10-07 — see the note at the end of this finding.*

`components/ProSidebar.tsx` builds `navItems` from Overview / Inquiries / Store editor / Analytics /
Settings / Help — **there is no Admin link**. `/pro/admin` exists and is gated, but nothing in the
console links to it, so the only way in is typing the URL by hand. That is the real cause of
"I signed up as admin and never saw the admin page".

Compounding it, `middleware.ts` (and `requireAdmin()` in `lib/supabase/server.ts`) **silently
`redirect("/pro")`** for a non-admin, so there is no "you are not an admin" message — it just
looks like the page doesn't exist.

There is also **no auto-promotion**: `docs/ADMIN_SETUP.sql` defines `auto_register_system_admins()`
as an explicit no-op, so a new signup is never promoted, and the first admin could not be created
through the Admin Panel (which itself requires an existing admin).

> **Correction (live DB, 2026-10-07).** `system_admins` already contains **exactly two** rows —
> `admin@swiftlink.pro` and `victorand804@gmail.com` — so that account *is* an admin and the
> bootstrap already happened at some point. The chicken-and-egg concern is therefore historical,
> not live. The **only** live defect is the missing nav entry, which makes the fix far smaller than
> §4 Phase 0.1 assumed: no promotion migration is needed. The `system_admins` RLS is also already
> tightened to `is_admin(auth.uid())`, so ordinary signed-in users can no longer enumerate admins
> (the audit's F-23 `SELECT USING (auth.role() = 'authenticated')` policy is gone).

**R-02 · The free product limit disagrees with itself: 5 vs 6.**
`components/BusinessView.tsx:899` and `:932` enforce `5`. `context/SwiftLinkContext.tsx:916`
enforces `6` and the message says "6 products". Depending on which path a merchant hits, they get
a different limit. The owner's intent is **6**.

**R-03 · "Pause store / Go live" does not exist, and `isLive` is cosmetic even where it's read.**
`isLive` is in the state (`lib/schema.ts:96`, `lib/types.ts:71`) and is *read* in only two places:
`CartDrawer`/`CartView` block the WhatsApp button, and `SwiftLinkContext.tsx:1148` refuses to build
the order message. But:

- there is **no UI to toggle it** anywhere (`grep` for `setLive|goLive|pauseStore` → nothing), and
- `components/CustomerStorefront.tsx` **never reads `isLive` at all** (`grep isLive` in that file
  and in `CustomerStorefrontPage.tsx` → zero matches).

So a "paused" store still renders and looks fully open; the customer only discovers it's closed
*after* filling a cart and tapping order. The owner's request (a Stop/Live control that makes the
storefront unavailable) is unimplemented in both halves.

**R-04 · Three icons are invisible because the icon font was deleted.**
`CustomerStorefront`'s Font Awesome CDN `<link>` was removed in the P1 cleanup, but three call
sites still reference Font Awesome classes:

- `components/AppChrome.tsx:117` — `<i className="fas fa-hand-pointer">` (the tour cursor)
- `components/CartDrawer.tsx:105` — `<i className="fas fa-times">` (drawer close button — **this is
  a visible, clickable control with no glyph**)
- `components/CartDrawer.tsx:144` — `<i className="fab fa-whatsapp">` (the checkout button icon)

`next.config.ts` and `app/layout.tsx` load no Font Awesome. These render as empty boxes/nothing.
This is the owner's "some icons are not visible" — and it lands on the two most important
customer-facing controls.

### P1 — the reported issues that are "built but not wired"

**R-04b · The Phase-1 migration had never been applied, and would not have run.** *(found by applying
it, 2026-10-07)* `supabase/migrations/20261001170000_...sql` — the file that creates `inquiries`,
`customers`, `store_daily_stats`, `product_daily_stats` — was absent from
`supabase_migrations.schema_migrations` (only the two 2026-09-21 migrations were recorded), which is
why none of those tables existed. It also contained two defects that only surface on a real
environment:

1. `CREATE VIEW public.public_stores` projected `stores.created_at`, but the live `stores` table has
   no such column (`id, biz_name, store_username, phone, state_json, updated_at, owner_id, sections,
   plan, account_status`), so the whole migration aborted with
   `column "created_at" does not exist (SQLSTATE 42703)`.
2. `REVOKE SELECT ON public.stores FROM anon` would have **taken every live storefront offline**.
   Anonymous customers read `stores` directly with the anon key (there is no server data layer),
   and no code reads `public_stores` — so the revoke and the read-path migration had to land
   together, not separately.

Both are fixed and the migration is now applied. See §4 Phase 1.

**R-05 · Analytics is hard-coded zeros.**
`components/AnalyticsView.tsx:18-22`:  *(confirmed 2026-10-07: the daily-stat tables now exist, but
nothing in the codebase writes to them — a grep for an insert finds none. A rollup writer was added
in Phase 1, below.)*
```ts
const totalViews = 0;
const productViews = 0;
const totalOrders = 0;
const totalCheckouts = 0;
const conversionRate = 0;
```
The tiles then render `"0"` with a green `▲ Live` badge and a `"Ready"` label — i.e. **fake-positive
chrome on empty data**. Meanwhile the tables it would read already exist
(`store_daily_stats`, `product_daily_stats` — created in
`supabase/migrations/20261001170000_...sql:366,377`), and **nothing anywhere writes to them**
(no `.from("store_daily_stats")` insert exists). So "real wire" is two jobs: a writer and a reader.

**R-06 · Inquiries is a permanent empty state.**
`app/pro/inquiries/page.tsx` is a static "No inquiries recorded yet" card — the three filter tabs
(`all` / `sales` / `customers`) switch local state and render the same empty panel. The supporting
work is fully built and tested but unreachable:

- `lib/inquiries.ts` — `computeDedupeKey`, `validateInquiryStatusTransition`, `resolveInquirySource`
- `lib/handle.ts`, `lib/phone.ts`
- `lib/__tests__/inquiries.test.ts` (15 assertions, passing)
- `inquiries`, `customers` tables + RLS + customer-sync triggers in the same migration

…and the storefront **never inserts an inquiry row** when a buyer taps "Order on WhatsApp", so even
a correct UI would show nothing.

**R-07 · Multi-store exists but only for `pro`/`business`, with no management.**
`createNewStore` is gated at `BusinessView.tsx:191-193` (`!isPremium && stores.length >= 1` → blocked)
— so tiering is already right. What's missing is everything around it:

- `components/StoreSwitcher.tsx` is mounted **only inside `BusinessView`** (`BusinessView.tsx:16,721`)
  — it does not exist in the Pro shell, Inquiries, Analytics or Settings.
- Creation goes through `window.customPrompt` (`StoreSwitcher.tsx:12`) — a monkey-patched global,
  the exact anti-pattern flagged in `docs/00-AUDIT.md` F-22.
- **No delete store, no delete account.** `app/account/page.tsx` offers only "Log Out" and
  "Reset Local Workspace". (`transferStore` *does* exist — `SwiftLinkContext.tsx:270`, wired at
  `BusinessView.tsx:1198` — but it's buried inside the editor's **Inbox** tab, where a merchant
  would never look for "transfer my store".)

**R-08 · The shared storefront link has no SEO at all — and can't, as currently shaped.**
The link merchants share is produced by `getShopPath()` (`lib/utils.ts:82-93`):
`/store/<handle>?shop=<uuid>`. That route, `app/store/[slug]/page.tsx`, starts with `"use client"`
and exports **no `generateMetadata` and no `metadata`** (verified by grep → "NO METADATA EXPORT").
The only route with OG metadata is `app/[storeSlug]/[shopId]/page.tsx`, which is **not the URL anyone
shares**. So when a store link is pasted into WhatsApp/IG/Twitter, the crawler gets a client shell:
no title, no description, no image. This is precisely the owner's report, and it's structural, not a
tag that's missing.

**R-09 · The live storefront runs two theming systems at once.**
This is the root of "the design is not unified / the template is not in one color as the nav bar and
footer". `CustomerStorefront.tsx` renders:

- **Modern path** (line 1039): `<TemplateSite/>`, driven by `--t-*` CSS vars from
  `themeToCssVars(websiteTemplateById(...))` (lines 946-949). Tokenised, correct.
- **Legacy path** (lines 1062, 1078): the 10 `HeroTemplate` / `CatalogTemplate` if-chains, written in
  literal `bg-white` / `text-gray-900` / `emerald-500` classes.
- **Glue** (lines 981-992): a `<style>` block that patches those literal class names with
  `!important`, including
  `header.storefront-header, div.storefront-header { background-color: var(--t-bg) !important }`
  and the same for `footer` (lines 991-992).

Two consequences that match the complaint exactly:
1. Nav/footer are force-painted to `--t-bg` **while sibling legacy sections are not** — so nav/footer
   and body can genuinely disagree about "one color".
2. `--t-*` only exists when `websiteTemplateId` resolves to a template. For a store on the legacy
   path, every fallback in that `<style>` block is a *different* variable (`--btn-color`,
   `--surface-color`, `--theme-color`), which is a second, competing palette.

**R-10 · The "Bold" template's dark brand is a neon clash.**
`lib/theme/templates.ts` — `bold.darkBrandColor: "#a3e635"` (lime-400) over `background: "dark"`.
Even where it passes the contrast gate (`enforceContrast: true`), lime-on-navy reads as a
"template-gallery" demo, not a brand. `bold` also composes `catalog-10` + `hero-1`, so a merchant who
picks Bold gets a *third* visual language on top of the legacy hero/catalog chains — the "AI slop"
the owner is reacting to. Note the templates themselves are structurally fine; this is a **taste and
composition** problem, not an architecture problem.

### P2 — requested features that have no implementation at all

**R-11 · No autosave / no "remember my info".**
`lib/draft-store.ts` is real but is **preview-only** (`sessionStorage` + `postMessage` for the
editor iframe). There is no persisted draft of merchant work and no memory of values the merchant
already typed — so every session re-asks for handle, phone, business name. There is also no
autosave: `StoreEditorV2` tracks `isDirty` and warns on `beforeunload` (lines ~100-127), which is
the *only* protection against losing an edit.

**R-12 · PWA is a static manifest and nothing else.**
`public/manifest.json` is 22 lines: one icon entry claiming `"sizes": "192x192 512x512"` (invalid —
`sizes` is a space-separated list of *one* size per entry), `theme_color: "#10b981"` (the *old*
console green, not the current token), and `start_url: "/pro"`. There is **no service worker**
(the old `next-pwa` integration was removed, `public/sw.js` is gone), no offline behaviour, no
`apple-touch-icon`, no install/`display-mode` handling beyond `PWAInstallPrompt`. So it is not
installable-as-an-app in any meaningful sense.

**R-13 · No pagination/loading strategy for large catalogs.**
The storefront renders `filteredProducts` in one pass and loads every product image eagerly with
plain `<img>`. There is no pagination, no windowing, and no skeleton — the owner's "add a preloader
if the products are many" is a symptom of a single unbounded render.

### P3 — smaller, adjacent

**R-14 · `app/pro/admin` dead-ends silently** (covered in R-01): better as an explicit
"not authorised" state than a redirect that looks like a missing page.

**R-15 · `app/sitemap.ts` advertises two URLs** (site root + `/terms`). It does not enumerate
storefronts, so published stores are not discoverable by search engines at all.

**R-16 · `docs/` still holds 13 loose `*.sql` files** (`SUPABASE_SETUP.sql`, `SOCIAL_*.sql` ×10,
`store_reviews.sql`) alongside the real `supabase/migrations/` set. `docs/00-AUDIT.md` §3 flagged
this; migrations now exist, so these are a live footgun for anyone setting up a fresh environment.

---

## 3. Research: the three decisions that need outside evidence

### 3.1 OG images for a storefront whose identity is in a query string

Next.js supports two mechanisms ([metadata files](https://nextjs.org/docs/app/api-reference/file-conventions/opengraph-image),
[`ImageResponse`](https://nextjs.org/docs/app/api-reference/functions/image-response)):

1. **`opengraph-image.tsx`** — a file convention, colocated with the route, generates at build or
   request time from `params`.
2. **A route handler** — `app/api/og/route.tsx` returning `new ImageResponse(...)`.

The deciding constraint here is documented behaviour: **`opengraph-image` cannot read search
params.** Since the shared URL is `/store/<handle>?shop=<uuid>`, a file convention could not see the
`shop` id — it would have to resolve by handle only.

So the shape of the fix is forced, and it's a good forcing function:

- Make the **canonical storefront URL path-based**: `/<handle>/<shopId>` (the route
  `app/[storeSlug]/[shopId]/page.tsx` **already exists** and already has `generateMetadata`), or a
  `/<handle>/opengraph-image.tsx` resolving by handle.
- Keep `/store/<handle>?shop=` as a **permanent redirect** so links already shared in WhatsApp
  keep working (this is the same call `docs/02-BUILDER-ARCHITECTURE.md` §5 already made).
- Use a **route handler for the composed image** (`/api/og?store=...`) if we want a designed card
  (logo + name + first product + price) rather than only a photo.

Cost note: `ImageResponse` runs a font + layout engine per request, so it must be cached
(`revalidate`) or generated once per store at publish time.

### 3.2 PWA on Next 15

Next.js now documents PWAs first-class ([guide, Jul 2026](https://nextjs.org/docs/app/guides/progressive-web-apps)):
a `app/manifest.ts` (typed `MetadataRoute.Manifest`) replaces a hand-written `public/manifest.json`,
and installability requires a real icon set plus a registered service worker with
`updateViaCache: 'none'`.

For the service worker itself, the ecosystem consensus is that **`next-pwa` is superseded by
[Serwist](https://serwist.pages.dev/) (`@serwist/next`)**, which does the same work on a maintained
Workbox core. Note the known caveat: Serwist's Next integration is webpack-oriented, so if this
project moves to Turbopack builds, the SW build step needs its own handling.

Recommendation for SwiftLink specifically: the storefront should have a **minimal, offline-friendly
SW** (precache the app shell of the console, network-first for store data), because a stale
service worker pinning old chunks is exactly the failure `docs/00-AUDIT.md` F-10 warned about.
Anything more ambitious (push notifications, offline cart) is a separate decision.

### 3.3 Unifying the storefront on one token scope

The token layer (`lib/theme/derive.ts` → `themeToCssVars`, `data-theme-scope="storefront"`) is
already the right mechanism — `TemplateSite` proves it works. The problem is the *coexistence* of
the legacy `!important` bridge. The fix is a deletion task, not a design task:

1. Route every store through `TemplateSite` + `--t-*` (no `heroTemplateId`/`catalogTemplateId`
   if-chains at render time).
2. Delete the `!important` `<style>` block (`CustomerStorefront.tsx:981-992`).
3. Rewrite nav/footer/hero/catalog/product/cart as `--t-*` consumers.

That is the same "non-negotiable #1" already written into `docs/02-BUILDER-ARCHITECTURE.md` §8:
*no hex literal or `!important` outside `lib/theme`*.

---

## 4. The plan

Grouped so each phase is independently shippable and verifiable. Sizes: **S** ≈ under an hour,
**M** ≈ an afternoon, **L** ≈ a day+.

### Phase 0 — Truth & access (do first; small, unblocks you)
| # | Work | Files | Size |
|---|---|---|---|
| 0.1 | **Bootstrap the first admin, then make the console reachable.** Add an idempotent migration that promotes the owner's email (or document the exact one-line SQL), add an **Admin** item to `ProSidebar` rendered only for admins, and replace the silent `redirect("/pro")` with an explicit "not authorised" screen. | new migration, `ProSidebar.tsx`, `middleware.ts`, `lib/supabase/server.ts`, `app/pro/admin/page.tsx` | S |
| 0.2 | **One product limit: 6.** Centralise it as a single exported constant used by `BusinessView` *and* the context, so it can't drift again. | `lib/schema.ts` or new `lib/plans.ts`, `BusinessView.tsx`, `SwiftLinkContext.tsx` | S |
| 0.3 | **Delete the last Font Awesome call sites** and replace with the existing Lucide/`Icon` kit (`fas fa-times` → `X`, `fab fa-whatsapp` → `MessageCircle`/brand mark, cursor → CSS shape). | `AppChrome.tsx`, `CartDrawer.tsx` | S |
| 0.4 | **Kill the fake-positive analytics chrome** (the green `▲ Live` on a hard-coded `0`) until Phase 1 wires real data — honest empty states beat confident zeros. | `AnalyticsView.tsx` | S |
| 0.5 | Delete the 13 legacy `docs/*.sql` files now that `supabase/migrations/` is the source of truth (keep only genuinely separate setup docs). | `docs/` | S |

**Exit criterion:** owner signs in, sees the Admin entry, reaches `/pro/admin`; free plan caps at 6;
no invisible controls anywhere in the cart; `npm run check` green.

### Phase 1 — Wire the data that already exists (stats + inquiries)
| # | Work | Files | Size |
|---|---|---|---|
| 1.1 | **Write the inquiry on WhatsApp tap** — insert into `inquiries` using `computeDedupeKey` / `resolveInquirySource`, and roll up `store_daily_stats` / `product_daily_stats` (a DB trigger or an RPC keeps this transactional instead of trusting the client). | storefront checkout path, new migration/RPC | M |
| 1.2 | **Real AnalyticsView** — read the daily-stats tables instead of literals; add a date range; show a genuine empty state when there is no data yet. No invented numbers, no invented trends. | `AnalyticsView.tsx`, a stats hook | M |
| 1.3 | **Real Inquiries page** — list, filter (all / confirmed sales / customers) and status transitions (`new → chatting → sold / lost`) with the existing `validateInquiryStatusTransition` invariant (sold requires amount + timestamp). | `app/pro/inquiries/page.tsx`, new `components/inquiries/*` | L |
| 1.4 | **Customers list** off the `customers` table (the sync triggers already maintain `chats_count` / `sold_count`). | same | M |

**Exit criterion:** a WhatsApp tap produces an inquiry row; Analytics and Inquiries show that same
data; a store with no traffic shows an honest zero state, not a fake trend.

### Phase 2 — One storefront, one colour (the design complaint)
| # | Work | Files | Size |
|---|---|---|---|
| 2.1 | ✅ **Retire the legacy render path** (2026-10-08) — every store renders `TemplateSite` + `--t-*`; the `heroTemplateId`/`catalogTemplateId` if-chain is deleted from the live path, and a missing/retired template id now falls back to `DEFAULT_WEBSITE_TEMPLATE_ID` instead of the legacy layout. | `CustomerStorefront.tsx` | L |
| 2.2 | ✅ **Delete the `!important` bridge** (2026-10-08) — the `<style>` block is gone; nav, footer, product, cart, search and the website templates consume `sf-*` token classes (`--t-*` with legacy inline vars as fallback), so "template colour = nav colour = footer colour" is true by construction. | `app/globals.css`, `CustomerStorefront.tsx`, `components/storefront/template-sites.tsx` | L |
| 2.3 | **Re-tune the three templates** to a professional bar: replace `bold.darkBrandColor` lime with a real brand hue, fix each template's light/dark pair, and pick hero/catalog/footer compositions that belong to *one* language rather than three. | `lib/theme/templates.ts`, `template-sites.tsx` | M |
| 2.4 | **Extend `theme.test.ts`** with a regression assertion that each template's light *and* dark brand colour is used consistently across the composition (so a clash can't be reintroduced). | `lib/__tests__/theme.test.ts` | S |

**Exit criterion:** one storefront implementation; `grep "!important" components/CustomerStorefront.tsx`
returns nothing; a store using Bold looks like one brand in light and in dark.

**Status (2026-10-08):** 2.1 and 2.2 are done and pinned by
`lib/__tests__/storefront-theme-classes.test.ts` — the grep in the exit criterion now returns nothing,
and the test fails if a bridged palette class or an undefined `sf-*` class reappears. **2.3 and 2.4 are
still open**: the templates have not been re-tuned (that is a taste call that needs the owner's eyes on
a rendered page), and they still contain raw palette *tints* (`bg-emerald-500/10`, `text-emerald-400`)
beside the token-driven accents. Those variants were never repainted by the bridge, so they were
preserved deliberately — changing them now would be an unverifiable restyle. Note also the one
behaviour change this carries: the 14 stores with no template id previously kept their custom
`accentColor`; they now take the default template's palette like every other store.

### Phase 3 — Store lifecycle (the money features)
| # | Work | Files | Size |
|---|---|---|---|
| 3.1 | **Stop account / Go live** — a real `isLive` toggle in the console, **and** a proper closed-storefront state in `CustomerStorefront` (a branded "temporarily closed" page rather than a working shop that fails at checkout). | `CustomerStorefront.tsx`, console settings | M |
| 3.2 | **Multi-store for `pro`/`business`** — move `StoreSwitcher` into the Pro shell (not just the editor), replace `window.customPrompt` with a real dialog, and add a "Stores" management screen. | `ProSidebar.tsx`/`ProLayout.tsx`, `StoreSwitcher.tsx` | M |
| 3.3 | **Delete store** (typed-confirmation, owner-only, RLS-enforced) and **Delete account** (cascades stores, revokes session). Both destructive → require explicit confirm + cannot be client-authorised. | console + new RPC/migration | M |
| 3.4 | **Transfer store** — surface the existing `transferStore` where it belongs (a Stores/Settings action), not inside the editor's Inbox tab. | `BusinessView.tsx` → settings area | S |

**Exit criterion:** an owner can pause and resume their shop, own 5 stores on Pro, delete one, and
delete their account — all with server-side authorisation.

### Phase 4 — SEO & PWA (the "share a link, see nothing" complaint)
| # | Work | Files | Size |
|---|---|---|---|
| 4.1 | **Canonical path-based storefront URL** (`/<handle>/<shopId>` or `/<handle>`), with `/store/<handle>?shop=` 301ing to it so already-shared links keep working. | `lib/utils.ts:getShopPath`, `app/store/[slug]/page.tsx`, `middleware.ts` | M |
| 4.2 | **Real metadata on the canonical route** — title, description, `openGraph`, `twitter`, canonical, plus `Product`/`Organization` JSON-LD from the store's actual products. | canonical route | M |
| 4.3 | **Generated OG image** via a route handler (`/api/og?store=…`) producing a branded card (logo + name + hero/first product + price), cached; per-store override still wins. | new `app/api/og/route.tsx` | M |
| 4.4 | **`sitemap.ts` enumerates published, live stores** (and excludes paused ones). | `app/sitemap.ts` | S |
| 4.5 | **PWA proper**: migrate to `app/manifest.ts` (typed), generate a real icon set (192/512 + maskable + apple-touch + 32px favicon) from the real `logo.png`, and register a minimal **hand-rolled** `public/sw.js` (network-first navigation, cache-first hashed assets, `updateViaCache: 'none'`) with an `/offline` fallback. Serwist was declined — see the 2026-10-08 progress note. | `app/manifest.ts`, `scripts/generate-pwa-icons.mjs`, `public/icons/*`, `public/sw.js`, `components/ServiceWorkerRegister.tsx`, `app/offline/page.tsx`, `app/layout.tsx` | M |

**Exit criterion:** pasting a store link into WhatsApp shows the store's name, description and a
generated image; Lighthouse SEO ≥ 95; the app installs to a home screen and opens standalone.

### Phase 5 — Scale & polish
| # | Work | Files | Size |
|---|---|---|---|
| 5.1 | **Catalog loading strategy** — paginate or window the grid (e.g. 24 at a time + "load more"), switch product images to `next/image` with sizing/lazy-load, and add skeletons so a large catalog shows a preloader instead of a blank wait. | `CustomerStorefront.tsx`, `next.config.ts` | M |
| 5.2 | **Autosave + remember** — persist a draft of merchant work and prefill known values (handle, phone, name) so nothing is retyped. Reuse `lib/draft-store.ts`'s shape but persist server-side per store. | editor, `lib/draft-store.ts` | M |
| — | ✅ **5.2 shipped** (2026-10-08) — local draft in `localStorage` plus an owner-only `store_drafts` row; auto-restore banner; values prefilled from `lib/remembered-input.ts`. See §8. | `lib/draft-store.ts`, `lib/store-drafts.ts`, `lib/remembered-input.ts`, `StoreEditorV2`, migration `20261008140000` | — |
| 5.3 | Remove the remaining monkey-patched `window.customPrompt`/`customConfirm` call sites in favour of the UI-kit dialog. | `AppChrome.tsx` + call sites | S |

---

## 5. What I recommend doing in what order, and why

**Phase 0 first, and it's deliberately cheap.** You are blocked from seeing your own product's
admin surface, the free limit contradicts itself, and three controls in the customer cart are
invisible. None of that needs design work, and fixing the admin bootstrap is what unblocks you to
do everything else.

**Phase 1 second** because it converts existing, already-tested code into your first real
differentiator — you have a full inquiry/customer schema with dedupe logic and tests sitting unused,
and "real stats" was your first complaint. It is the highest ratio of perceived value to new code
in the whole plan.

**Phase 2 next** because the design complaint is the loudest and it's a *deletion* (two renderers →
one, plus removing `!important`), not a redesign from scratch. Deleting the legacy path also fixes
the "template isn't the same colour as the nav/footer" symptom at its root.

**Phase 4's SEO work should not be attempted before its URL decision** (`§3.1`) — generating an OG
image for a URL whose identity is in a query string is fighting the framework.

---

## 6. Open decisions I need from you

1. **Admin bootstrap.** Who should be the first admin? Options: (a) a migration that promotes one
   specific email you name, (b) a one-time `/api/admin/bootstrap` guarded by a secret env var, or
   (c) a documented `INSERT INTO system_admins` you run once. (a) is simplest and most auditable.
2. **Canonical storefront URL shape.** `/<handle>` (cleanest to share, needs handle uniqueness
   enforced) or `/<handle>/<shopId>` (already implemented, survives a handle rename)? This gates
   Phase 4.
3. **Free plan limit = 6, and what Pro/Business means.** Confirm hard caps: free 6 products,
   pro unlimited, **business** = unlimited + multi-store? Does Pro get multi-store too, or is that
   Business-only? (Current code treats `pro` and `business` identically for both.)
4. **Templates.** Stay at 3, or grow to a family set? And do you want me to pick the new Bold dark
   brand colour, or do you have a palette in mind?
5. **PWA ambition.** Minimal offline console shell (my recommendation), or full push notifications?
   Push needs VAPID keys and a subscriptions table.

## 7. Things I could not verify, and will not claim

- **The Edit Product popup's responsiveness.** `components/editor/StoreEditorV2.tsx` (the live editor,
  since `storeEditorV2` defaults on) already has a `h-[100dvh]` mobile sheet with a
  `sticky bottom-0` footer containing Save/Cancel (lines ~2283-2305), so the code *looks* correct.
  I cannot see rendered pixels, so I have **not** confirmed your report — I need either a
  screenshot/device or you telling me the viewport width. The plausible culprits if it does break:
  the footer is `sticky` inside a `overflow-hidden` flex parent (a known iOS Safari quirk), or the
  on-screen keyboard on a real phone. **Reproduce report needed.**
- **Anything requiring the live database.** The RLS state described in `docs/00-AUDIT.md` F-23 was
  read from the DB on 2026-09-21; I did not re-query it, so I can't confirm the current policy set.
- **Apple/Meta crawler behaviour.** I verified that the shared route emits no metadata; I did not
  fetch a live deployment to see what a real crawler receives.

## 8. Progress log

### 2026-10-07 — Phase 0 complete; Phase 1 started

**Phase 0 — done and verified** (typecheck exit 0 · 211 tests across 17 files · `next build` exit 0, 19 routes, gates on):

- **0.1 Admin access.** Added an Admin entry to `ProSidebar` and the mobile tab bar, rendered only
  for a server-verified `isAdmin`. Replaced the silent `redirect("/pro")` in `middleware.ts` and
  `requireAdmin()` with `/pro?denied=admin`, and `OverviewView` now renders an explicit
  "Admin access required" notice. **No promotion migration was needed** — the live DB already has
  both admins, which the plan originally got wrong (see the R-01 correction).
- **0.2 One product limit.** New `lib/plans.ts` is the single source of truth: free **6**, pro and
  business unlimited, multi-store **business-only**. `BusinessView` (both guards + the lock hint)
  and `SwiftLinkContext.addProduct` now import it, removing the 5-vs-6 contradiction. Guarded by
  `lib/__tests__/plans.test.ts` so it cannot drift again.
- **0.3 Invisible icons.** The three surviving Font Awesome call sites are replaced with Lucide —
  including the cart's close button and WhatsApp order icon, which were rendering as nothing.
- **0.4 Honest analytics chrome.** The tiles no longer pair a hard-coded `0` with a green trend
  arrow and the word "Live"; a metric with no data now says "No data yet".
- **0.5 Deferred, deliberately.** The legacy `docs/*.sql` files are described by
  `docs/04-SUPABASE-WORKFLOW.md` as intentional "historical reference only", so deleting them would
  contradict an existing decision for no functional gain. Nothing imports them; leaving them is the
  lower-risk call and this item can be revisited cheaply.

**Phase 1 — foundation landed:**

- **1.1 Migration fixed and applied.** The three defects in R-04b are repaired (the impossible
  `created_at` projection, the foot-gun `REVOKE`, and the missing analytics writer). `supabase db
  push` is green and `inquiries`, `customers`, `store_daily_stats`, `product_daily_stats` and the
  `public_stores` view all now exist. Anonymous read on `stores` was re-verified intact, so the live
  storefront was never at risk.
- **1.1b Missing writer added.** `rollup_inquiry_into_daily_stats()` (trigger on `inquiries` insert)
  populates both daily-stat tables. Verified end-to-end inside a rolled-back transaction: one
  inquiry produced one store-day row, one product-day row, one synced customer, and the correct
  `source` attribution — with **zero test rows left behind**.
- **1.2 Write path wired.** `lib/inquiry-write.ts` records order intent through the DB's
  `create_or_update_inquiry` RPC (transactional advisory lock, so concurrent taps cannot
  double-count). `sendWhatsAppOrder` opens the WhatsApp chat synchronously first and records the
  intent afterwards, deliberately not awaited, so tracking can never cost a merchant a sale.
  Verified the RPC is `anon`-executable, which is what makes the anonymous storefront able to write.
  `lib/inquiries.ts` types are reconciled with the real schema (`*_minor` + `currency`, not
  `*_naira`).

- **1.3 Analytics is real.** `AnalyticsView` now reads `inquiries`, `store_daily_stats` and
  `product_daily_stats` for the last 30 days: inquiry count, product taps, confirmed sales with
  revenue, conversion rate, a zero-filled 12-day inquiry chart, a channel breakdown from the
  `source` column, and a per-product table. Store **views** are deliberately not shown — the column
  exists but nothing writes it, and inventing it is the bug this removed. Deltas/trends are omitted
  for the same reason: there is no previous period to compare against.
- **1.4 Inquiries & customers built.** The page reads both tables, filters
  (all / confirmed sales / customers), shows per-product sale amounts, and moves an inquiry through
  `new → chatting → sold / lost`. Recording a sale asks for the real amount and writes
  `final_amount_minor` + `sold_at`; moving off `sold` clears them. Verified against the live schema in
  rolled-back transactions: a sale sets `sold_count` on the customer and a reversal decrements it
  back, and the database rejects a `sold` without an amount (`23514
  chk_inquiries_sold_requires_amount_and_date`) — which is exactly the rule the UI now mirrors.

**Runtime smoke test (2026-10-07).** Served the production build and requested every merchant route:
`/pro`, `/pro/analytics`, `/pro/inquiries`, `/pro/admin` and `/business` all return **200 with no
server-error markers**, and `/pro/*` correctly carries `X-Robots-Tag: noindex, nofollow`.

> **Observation, confirmed pre-existing and not a regression.** None of the console routes ship
> their body markup in the initial HTML — `/business` (untouched) and `/account` (untouched) behave
> identically to the new screens, so the whole console paints client-side after hydration. That is
> an architectural property of the current shell (and is why the `X-Robots-Tag` above matters). It
> means "returned 200" proves the route loads and does not 500, **not** that the UI is correct after
> hydration. Verifying that needs a real browser; Playwright is declared but its browsers are not
> installed on this machine, so it was not run.

**Phase 1 is complete.** Still open, next in line: Phase 2 (retire the legacy storefront render path
and delete the `!important` bridge) and the two unverified items in §7 — the Edit Product popup and
the `?src=` tagging UI that would let merchants attribute a shared link to a channel.

### 2026-10-08 — owner decisions implemented (items 1–6)

Freeze after this round: `tsc --noEmit` exit 0 · **266 tests across 17 files** · `next build` exit 0 ·
runtime smoke served with `next start -p 3111` and a real Supabase URL/anon key inline.

**Owner decisions (recorded before coding).** Admin = the recommended two-account model
(`michaeldosunmu22@gmail.com`, `victorand804@gmail.com`). Canonical storefront = `/<handle>`. Tiers =
free **6** products, pro unlimited, business unlimited **+ multi-store**, plus a **per-user cap** so
one account cannot consume the whole space. Downgrade / failed payment **never deletes anything**:
over-limit products are *hidden* (the vendor picks which six stay visible), extra stores are
*unpublished*, a **7-day grace period** with emails precedes any downgrade, and **lapsed-plan stores
are excluded from the inactivity cleanup job**. Templates grow to a family set and the fabricated
testimonials are removed. PWA = my recommendation (see 4.5 below).

**Item 1 — admin bootstrap & `search_path` hardening.** New migration
`20261007120000_admin_bootstrap_secure.sql` idempotently promotes `michaeldosunmu22@gmail.com` by
matching `auth.users.email` (the live account existed but was not an admin), and pins
`search_path = public` on the six previously-unpinned `SECURITY DEFINER` functions
(`is_admin`, `auto_register_system_admins`, `create_or_update_inquiry`,
`sync_customer_on_inquiry_insert`, `sync_customer_on_inquiry_status_change`,
`rollup_inquiry_into_daily_stats`). Applied with `db push`; verified against the live DB —
`system_admins` now holds 3 rows including the promoted account, and all 10 definer functions report
`[search_path=public]`.

**Item 2 — one plan model, and a downgrade that deletes nothing.** `lib/plans.ts` is now the single
source of truth: `FREE_PRODUCT_LIMIT=6`, `MAX_PRODUCTS_PER_STORE=1000`,
`MAX_STORES_PER_USER=10`, `GRACE_PERIOD_DAYS=7`, plus the never-delete helpers
(`effectiveProductLimitFor`, `effectiveStoreLimitFor`, `isProductVisible`, `isStorePublished`,
`applyProductVisibility`, `clampProductVisibility`, `graceDeadline`, `isInGrace`, `isLapsed`,
`isCleanupEligible`). Wired through `BusinessView`, `SwiftLinkContext.addProduct` and
`StoreEditorV2` (new Eye/EyeOff visibility toggle, hidden-product banner, "N visible · M items"
header). `ProductEditModal` preserves `visible` on edit, and `CustomerStorefront` excludes hidden
products from the grid and categories. `OverviewView` shows the grace banner. Contract pinned by
`lib/__tests__/plans.test.ts` (**18 tests**).

**Item 3 — plan lifecycle in the DB.** Migration `20261007130000_plan_lifecycle_and_cleanup.sql` adds
`stores.plan_grace_until` / `stores.plan_lapsed_at`, a partial index
`idx_stores_cleanup_candidates ON stores(updated_at) WHERE plan_lapsed_at IS NULL` (`now()` is STABLE
and cannot appear in a predicate), and the `cleanup_eligible_stores` view
(`security_invoker=true`) which excludes grace and lapsed stores. Verified in a rolled-back
transaction: with one store lapsed the view returned 15 of 16; privileges are
`anon=false, authenticated=false, service_role=true`. `SwiftLinkContext.fetchStores` now selects and
mirrors the two columns.

**Item 4 — canonical `/<handle>` + SEO (Phase 4.1/4.2/4.4).** `getShopPath` returns `/${handle}` and
`parseShopFromPathname` accepts a bare first segment; the reserved-segment set grew
(`account, banned, cart, privacy, reset-password, dev, offline`). New `lib/store-lookup.ts`
(`getPublicStoreByHandle` — null for unknown/handle-less/banned, `getStoreHandleById`,
`getLiveStoresForSitemap`). New canonical route `app/[storeSlug]/page.tsx` with real
`generateMetadata` (skips base64 data URLs); `app/store/[slug]/page.tsx` is now a
`permanentRedirect` but the **active** 308 lives in `middleware.ts`, alongside the unknown-handle
rewrite to a real 404 — both are required because the streaming root-layout `Suspense` flushes a
server-component `notFound()` as HTTP 200. `app/sitemap.ts` is async and enumerates live stores at
`/<handle>`. UI copy updated to bare-handle URLs across `OverviewView`, `StoreEditorV2`,
`OnboardingModal`, `CartView` and `app/account`.

**Item 5 — template family + removal of invented content.** `lib/theme/templates.ts` now ships **10**
distinct templates (`editorial, boutique, bold, studio, market, noir, bloom, forge, coast, oasis`),
each with its own brand colour, `fontPair`, radius/density/motion, image ratio, nav shape and hero +
catalog composition. The complained-about neon-lime Bold dark colour was replaced with `#22d3ee`.
`template-sites.tsx` no longer fabricates three reviews plus a "4.9/5.0 (verified ratings)" figure —
`TestimonialsSection` renders `state.testimonials` only, with an honest empty state — and the FAQ
answers lost their invented shipping/payment promises. `TemplateSite` now routes by nav shape rather
than hard-coded ids. Contract pinned by `lib/__tests__/templates.test.ts` (**65 tests**).

**Item 6 — PWA proper (Phase 4.5).** Replaced the invalid static `public/manifest.json` with a typed
`app/manifest.ts` served at `/manifest.webmanifest`: real `name`/`short_name`, `start_url: "/"`
(the old `/pro` bounced a cold install launch to `/signup`), `theme_color`/`background_color`
`#0a1210` matching `--app-bg`, `display: standalone`, shortcuts and Chrome install screenshots.
Icons are now generated by `scripts/generate-pwa-icons.mjs` — real 192/512 PNGs (transparent), a 512
maskable on the brand surface, a 180 apple-touch and a 32px favicon — committed under
`public/icons/`. (They were first rasterised from `public/logo.svg`, a placeholder; see the
"later" entry below.) The worker is a **hand-rolled `public/sw.js`** rather than Serwist: the runner
had ~6.9 GB free disk, the build is `output: "standalone"`, and a second webpack pass in the build
pipeline was not worth the risk for ~150 lines of policy. It is network-first for navigations
(public pages cached, authenticated console routes never), cache-first for content-hashed assets,
skips `/api/*` and RSC traffic, and versions its caches. `components/ServiceWorkerRegister.tsx`
registers it production-only with `updateViaCache: "none"`, and `app/offline/page.tsx` is the
precached fallback. `/offline` was added to the reserved first segments so it can never collide with
a store handle, and the middleware matcher now skips `manifest.webmanifest`.

**Note — one stale test repaired.** `lib/__tests__/utils.test.ts` still asserted the pre-item-4
`getShopPath` shape (`/store/ada?shop=abc`); it now pins the canonical `/ada`, which is what
surfaced the failure.

**Still open / deferred.** Phase 2 (retire the legacy storefront render path and delete the
`!important` bridge at `CustomerStorefront.tsx:981-992`) is unchanged and still needs an explicit
go-ahead. The Edit Product popup responsiveness report remains unreproduced (needs a screenshot or
viewport width), and the `?src=` channel tagging still has no share-link generator to feed it.

### 2026-10-08 (later) — owner-reported defects, CI, blue-green, share links, catalog

Freeze after this round: `tsc --noEmit` exit 0 · **280 tests across 18 files** · `next build` exit 0 ·
runtime checks on a local server.

**Landing page was unreachable (`/` never showed it).** `HomeClient` branched on session state: a
signed-in owner got the dashboard and was then bounced to `/pro` by an effect, so the marketing page
had no URL at all and `?v=landing` was the only way back — which also made the PWA's `start_url: "/"`
drop a cold launch into the console. `/` is now the landing page for everyone, and the navbar swaps
"Log in / Get started" for "Open dashboard" when a session exists.

**Favicon and app icons were the wrong logo.** They were rasterised from `public/logo.svg` — a
placeholder emerald square reading "SL". `scripts/generate-pwa-icons.mjs` now sources the real
`public/logo.png`, adds a 32px favicon, and the placeholder SVG is deleted so it cannot be picked up
again. `app/layout.tsx` and the service-worker precache list were updated with it.

**Sign-in screen copy removed.** The `DesignRail` aside advertised "Three websites — Editorial,
Boutique and Bold" on the sign-in screen long after the template set grew to ten, and pushed the
form sideways on wide screens. Removed; the screen is the single centred column `docs/03-DECISIONS.md`
D12 already specified.

**CI was broken and ungated.** `.github/workflows/ci.yml` ran `npm ci`, but the repository has no
`package-lock.json` — `bun.lock` is the lockfile — so the job could not install at all. It now uses
`oven-sh/setup-bun` with `bun install --frozen-lockfile`, and adds a `bun run build` step: the only
gate that catches build-only failures such as a `useSearchParams` page without a Suspense boundary.

**Terms of Service rewritten.** The old text promised a "SwiftLink Escrow" that does not exist and
claimed phone numbers were verified by SMS, which is not implemented. It now describes the real
product — the actual plan limits from `lib/plans.ts`, and the never-delete/7-day-grace downgrade —
and drops both fabrications. The Privacy page's effective date, invented "order dispatch status",
and over-broad "export your data at any time" claim were corrected too.

**Blue-green deployment (`docs/06-DEPLOYMENT.md`).** New runbook covering both the managed atomic
deploy path and literal two-environment blue/green: traffic-switch procedure, rollback, and the
expand/contract migration discipline that a shared database demands. Backed by two new artifacts —
`GET /api/health` (app liveness + database reachability, excluded from middleware) and
`npm run smoke` (`scripts/smoke.mjs`), which asserts the routes that have actually broken here.

**Share-link generator.** The storefront has always *read* `?src=` and the Analytics channel panel
is built from the column it writes, but nothing ever *produced* a tagged link, so every inquiry
resolved to "direct" via the referrer fallback. New `lib/share-links.ts` builds the tagged URLs
(delegating to `getShopPath` so the console cannot disagree with the route), with 14 tests pinning
the tags against `resolveInquirySource`, plus a "Share by channel" control in `OverviewView`.

**Catalog performance.** Every template rendered the whole filtered catalog and mounted every
product image at once. New `components/storefront/catalog-window.tsx` (`useCatalogWindow` +
`LoadMoreButton`) windows all three storefront layouts to 24 cards a page, resetting on
category/search change; product images in both the current and legacy storefront paths are now
`loading="lazy" decoding="async"`.

**Error reporting.** Client failures were `console.error` only — invisible in production. New
`lib/error-report.ts` (bounded, never-throws, no cookies) posts to `app/api/errors`, which emits one
structured log line; `components/ErrorMonitor.tsx` captures `window.onerror` and
`unhandledrejection`, and `app/error.tsx` now reports through the same path. The sink is a single
function, so a hosted provider can replace it without touching call sites.

**Autosave + remember (R-11).** There were two halves to this. *Autosave:* `StoreEditorV2` kept the
only copy of unsaved work in React state, so a reload lost it and `beforeunload` was the sole
defence. Edits are now written — after 1.8 s of idle — to `localStorage` **and** to a new owner-only
`public.store_drafts` row, and an auto-restore banner brings the work back on the next visit with a
"Discard draft" escape hatch. Drafts deliberately live in their own table rather than a
`stores.draft_json` column: `stores` carries a world-readable SELECT policy, so a draft column would
have published unpublished work — including products hidden by plan limits — to anyone holding the
anon key. Nothing autosaves *to live*: `stores.state_json` is still only written by an explicit Save,
and the draft is dropped by `persistState` **only after that write is confirmed**, so a failed save
never costs the merchant their work. *Remember:* `lib/remembered-input.ts` prefills handle, business
name, phone and country from the merchant's own device, and only into fields the store leaves blank —
a remembered value can never overwrite something the store already knows.

**Phase 2 — one storefront, one colour (design complaint).** The customer path had two renderers
(`TemplateSite` for the two stores that had picked a template, the legacy section composition for the
other fourteen) and themed them with a `<style>` block that repainted Tailwind palette classes with
`!important` — so the markup lied about its colours and only the merchant's brand colour was ever
wrong in a way nobody could grep for. Now every store renders `TemplateSite` (a missing or retired
`websiteTemplateId` falls back to the default template rather than silently dropping to the legacy
layout), the legacy home branch is deleted, and the bridge is replaced by explicit `sf-*` classes in
`app/globals.css` scoped to `[data-theme-scope="storefront"]`, driven by `--t-*` with the legacy
inline vars as fallback. The classes are deliberately unlayered so they beat Tailwind utilities
without `!important` — the same guarantee the bridge gave, asserted by a test rather than by memory.

**Still open.** Phase 2's remaining taste work: 2.3 (re-tune the templates; `bold.darkBrandColor` is
still lime) and 2.4 (extend `theme.test.ts`), both of which need a rendered page to judge. Error
tracking still has no hosted provider: the Gravity Index catalog contains none, so a provider remains
an owner decision rather than something to install unilaterally (~6.9 GB free disk).

## 9. Verification log for this recon

```
npx tsc --noEmit        → exit 0
npm run test            → 150 passed / 8 files
npm run build           → exit 0
grep inventory          → 16 tables, 3 migrations, 0 .github workflows
dead-code check         → dispatch routes absent; public/sw.js absent; presets.ts deleted
```

### 2026-10-08 (items 1–6)

```
npx tsc --noEmit        → exit 0
npm run test            → 266 passed / 17 files
npm run build           → exit 0 (21 static pages; /manifest.webmanifest and /offline emitted)
node --check public/sw.js → exit 0
```

Runtime smoke, `next start -p 3111` with `NEXT_PUBLIC_SUPABASE_URL` and the project anon key inline:

```
/manifest.webmanifest              → 200 application/manifest+json
   parsed: name ✓, start_url "/" ✓, theme/bg #0a1210 ✓, display standalone ✓,
   icons 192+512+maskable ✓, screenshots narrow+wide ✓, shortcuts /pro /pro/analytics ✓
/cyder (HTML head)                 → <link rel="manifest" href="/manifest.webmanifest">,
   <link rel="icon" …/icons/icon-192.png>, <link rel="apple-touch-icon" …/apple-touch-icon.png>
/sw.js                             → 200 application/javascript
/offline                           → 200 text/html
/icons/icon-192.png                → 200 image/png
/icons/maskable-512.png            → 200 image/png
/icons/apple-touch-icon.png        → 200 image/png
/cyder                             → 200 (storefront still renders)
/definitely-not-a-store            → 404 (real, not a soft 200)
/store/cyder                       → 308 → /cyder
/pro                               → 307 → /signup?next=%2Fpro
```

Live-DB checks (via `supabase db query --linked`, one line per statement): `system_admins` has 3 rows
including the promoted account; all 10 `SECURITY DEFINER` functions report `[search_path=public]`;
`cleanup_eligible_stores` returned 15 of 16 stores with one lapsed (rolled back).

Not run: any browser-level check. Playwright browsers are not installed on this machine, so the
service worker's runtime caching, the install prompt and post-hydration console UI remain
unverified in a real browser and are **not** claimed as passing.

### 2026-10-08 (later round)

```
npx tsc --noEmit          → exit 0
npm run test              → 280 passed / 18 files  (incl. 14 new share-link tests)
npm run build             → exit 0
node --check public/sw.js → exit 0
.github/workflows/ci.yml  → parsed as YAML; jobs: verify
   steps: checkout · setup-bun · install (--frozen-lockfile) · typecheck · lint · test · build
bun.lock vs package.json  → all 40 declared deps present in the lockfile (so --frozen-lockfile
   will not fail on a missing package)
```

Runtime, on a local dev server (`npm run dev`, `.env.local` loaded):

```
GET  /                        → 200 (landing page; no redirect to /pro)
GET  /api/health              → 200 {"status":"ok", db.configured=true, db.reachable=true}
POST /api/errors   (valid)    → 204, and one structured `"tag":"client-error"` line in the log
POST /api/errors   (bad json) → 400
POST /api/errors   (array)    → 400
POST /api/errors   (20 kB)    → 413
GET  /cyder?src=instagram     → 200 (tagged link resolves)
GET  /cyder                   → 200
npm run smoke -- http://localhost:3000 (SMOKE_STORE_HANDLE=cyder)
                              → 11 passed, 0 failed
```

Icons: regenerated from `public/logo.png` and re-read — 32/192/512 transparent, maskable-512 and
apple-touch-180 on the brand surface, all with alpha; `public/logo.svg` deleted and removed from the
service-worker precache.

**Not verified.** The storefront and console are client-rendered, so the SSR HTML contains none of
their markup: `curl` can prove a route returns 200 without a 500, but it cannot see the catalog
window, the lazy-loading attributes, the "Share by channel" control, the landing-page CTA swap, or
the removal of the sign-in rail. No browser is available here, so those are verified only by
typecheck and the production build. Phase 2's `!important` bridge was still in place at this point
(superseded by the Phase 2 entry below).

### 2026-10-08 (autosave + remember)

```
npx tsc --noEmit          → exit 0
npm run lint              → exit 0 (warnings only, all pre-existing)
npm run test              → 313 passed / 21 files  (incl. 15 draft-store, 11 store-drafts,
                             7 remembered-input tests)
printf 'y\n' | npx supabase db push
                          → applied 20261008140000_store_drafts.sql
npm run build             → exit 0
```

Migration + RLS, checked against the live database (`supabase db query --linked`):

```
pg_class.relrowsecurity for store_drafts        → true
pg_policies for store_drafts                    → 5 (owner read/insert/update/delete,
                                                    admin select), predicates as written
```

Leak test — the whole reason drafts are a separate table. A canary draft row was inserted with the
service role, then the REST API was hit with the project **anon** key:

```
GET    /rest/v1/store_drafts?select=store_id,draft_json   → 200, body []   (row exists; RLS hides it)
DELETE /rest/v1/store_drafts?store_id=eq.<canary>          → 204, row still present afterwards
supabase db query "select count(*) from store_drafts"      → 0    (canary removed)
```

An earlier PostgREST version would have returned 200-with-rows here; the empty body is the assertion
that matters, and it was confirmed *while the row existed*.

**Not verified.** Same browser limitation as above. The autosave loop, the restore banner, the
"Draft saved · N min ago" label and the onboarding prefill are exercised only through their pure
helpers (unit-tested) plus typecheck and the production build; no browser was available to click
through them. The `store_drafts` write path is also unexercised by a real signed-in session for the
same reason — it is covered by RLS verification, not by end-to-end interaction.

### 2026-10-08 (Phase 2 — one storefront, one colour)

Owner decision: proceed without a browser, i.e. build-verified only. Before starting I queried the
live `stores` rows, because it decides how much this changes:

```
select count(*) total, count(*) filter (where coalesce(state_json->>'websiteTemplateId','') = '') missing,
       array_agg(distinct coalesce(state_json->>'websiteTemplateId','<null>')) ids from stores
→ total 16 · missing_template 14 · ids [<null>, boutique, editorial]
```

So 14 of 16 live storefronts were rendering the legacy section-composed layout — this is a real,
visible change for almost every store, not a dead-code cleanup. It was recorded here before the edit
for exactly that reason.

```
npx tsc --noEmit                          → exit 0
npm run test                              → 320 passed / 22 files
                                             (incl. 7 new storefront-theme-classes tests)
npm run lint                              → exit 0 (warnings only, all pre-existing)
grep -c "!important" CustomerStorefront  → 0  (Phase 2 exit criterion)
perl/class audit                          → 62 bridged tokens migrated in the overlay screens,
                                             7 in the website templates; 13 un-bridged palette
                                             variants deliberately left untouched
npm run build                             → exit 0
npm run smoke (dev, :3000, cyder)         → 11 passed, 0 failed
```

The migration was done as a *behaviour-preserving rename*: each bridged class was replaced by an
`sf-*` class that sets the **same property from the same variable**, so the rendered result is the
same CSS while the dependency on `!important` disappears. Variants the bridge never matched
(`bg-emerald-500/10`, `border-emerald-500/20`, `text-emerald-400`, `hover:bg-emerald-400`,
`focus:border-emerald-500`, `dark:bg-white`, …) were left byte-identical on purpose — they are raw
tints today, and "fixing" them would be an unverifiable restyle layered on a refactor.

The one thing tests cannot see: how it *looks*. The classes are provably defined, scoped and
`!important`-free, and the routes return 200, but no browser was available to confirm that a Bold
storefront still reads as one brand in light and in dark. 2.3/2.4 remain open for that reason.

**One repair found by re-running the gate.** A final `curl /api/health` came back **503** and then
**200** a second later (`db.reachable: true`, `latencyMs: 1303`). That is a real flake, not noise: the
probe allowed a single 3 s round trip to a shared auth endpoint that spikes past 3 s, so the one gate
both `npm run smoke` and the blue-green promotion depend on could reject a healthy environment
(fail-closed, but a false negative). Fixed in `app/api/health/route.ts` — 4 s per attempt, retried
once, and the behaviour is documented in `docs/06-DEPLOYMENT.md` §5. Re-verified with 8 consecutive
calls: 8×200 after the change, where the same loop previously produced a 503.
