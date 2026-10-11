# 07 · How everything works

This is the orientation document. It explains how a request flows through the
app, where a store's data lives, how a storefront gets published and found by
search engines, and how a release reaches production. It deliberately links to
the deeper documents rather than repeating them.

| Need the detail on… | Read |
|---|---|
| What exists and what is broken (audit) | `docs/00-AUDIT.md` |
| Tokens, color engine, component rules | `docs/01-DESIGN-SYSTEM.md` |
| The customization engine and roadmap | `docs/02-BUILDER-ARCHITECTURE.md` |
| Locked decisions and phase state | `docs/03-DECISIONS.md` |
| Migrations, RLS, environments | `docs/04-SUPABASE-WORKFLOW.md` |
| Release procedure (blue-green, rollback) | `docs/06-DEPLOYMENT.md` |

---

## 1. The product in one paragraph

A merchant signs up, builds a store in the browser, and publishes it on a public
link. The store page is a mobile-first storefront where a shopper browses the
catalog, fills a cart, and sends the order to the merchant's WhatsApp. SwiftLink
Pro hosts the store; it does not hold the money in the default flow.

Three surfaces share one codebase:

| Surface | Routes | Audience |
|---|---|---|
| Marketing / landing | `/`, `/terms`, `/privacy` | prospective merchants |
| Merchant console | `/pro`, `/business`, `/account`, `/pro/admin` | signed-in owners |
| Tenant storefront | `/<handle>` (canonical), `/<handle>/<shopId>`, `/stores` (directory) | shoppers, crawlers |

---

## 2. Stack

- **Next.js 15 App Router + React 19 + TypeScript.** Server Components do the
  database reads and metadata; client components do the interactive UI.
- **Supabase** — Postgres, auth, storage, realtime. Row Level Security is the
  multi-tenancy boundary (see `docs/04-SUPABASE-WORKFLOW.md`).
- **Tailwind + design tokens** — `styles/tokens.css` is the source of truth;
  `app-*` tokens are console-only, `t-*` are tenant-storefront-only, and never mix.
- **`lib/theme/`** — derives a full, contrast-checked theme from one brand color.
- **Vitest** — unit tests in `lib/__tests__/`, run with `npm test`.
- **Playwright + axe** — used by the accessibility checks.

---

## 3. Where store data lives

A store is one row in `stores`:

| Column | Meaning |
|---|---|
| `id` | UUID; the identity every route resolves to |
| `store_username` | the public handle; `/<handle>` is the canonical storefront URL |
| `biz_name` | denormalized store name |
| `account_status` | `banned` removes the storefront from public reach |
| `state_json` | the whole storefront document — products, theme, template, SEO fields, `isLive` |
| `updated_at` | drives the sitemap's `lastModified` |

`state_json` is typed as `ShopState` (`lib/schema.ts`) and normalized on the way
in (`normalizeShopState`). A store counts as **public** when it has a handle, is
not banned, and `isLive !== false`. Every discovery surface — sitemap, directory,
canonical route — applies exactly that rule.

---

## 4. Request lifecycle

### 4.1 Canonical storefront `/<handle>`

1. `middleware.ts` sees a single unreserved first segment and validates the
   handle against `stores`. An unknown handle is rewritten to a path that
   matches no route, so the response is a real **404** instead of a streamed
   soft-404.
2. `app/[storeSlug]/page.tsx` reads the row on the server (`getPublicStoreByHandle`).
3. It emits `generateMetadata` (title, description, keywords, canonical, OG/Twitter)
   and a `Store`/`ItemList` JSON-LD graph (`lib/seo.ts`).
4. It renders `CustomerStorefrontPage` with the server row as `initialState`, so
   the storefront's real content — name, tagline, hero, product grid — is in the
   **server HTML**. The client then fetches the row again and subscribes to
   realtime so the page stays live.

> The `initialState` seed is the single most important SEO change in this
> repository. Before it, a store page's HTML was a loading spinner: the title
> told a crawler one thing and the body showed nothing.

### 4.2 Merchant-only routes

`middleware.ts` protects `/pro`, `/business`, `/account` (and `/pro/admin`
additionally requires a row in `system_admins`). These routes send
`X-Robots-Tag: noindex, nofollow` from `next.config.ts` and are disallowed in
`app/robots.ts`.

---

## 5. Storefront rendering model

`CustomerStorefront` is one component used three ways:

- **Live shopper view** — `shopId` set, seeded with `initialState`.
- **Preview in the console** — `overrideState` + `preview`, isolated cart, no
  analytics, no history entries.
- **Editor canvas** — `isEditable` with section callbacks.

Each store renders a **website template** (`components/storefront/template-sites.tsx`),
picked by `websiteTemplateId`, with a light/dark intent from
`storefrontTheme.background`. Theme CSS variables (`--theme-color`, `--sf-*`) are
derived from the template so the shopper chrome is themed, not hardcoded white.

Scroll and sticky headers were a known trap: `overflow-x: hidden` on `body` and
wrapper boxes made them scroll containers, which silently disabled
`position: sticky` headers. The fix is `overflow-x: clip` on the non-scrolling
ancestors and no `overflow-y-auto` on the home container. If a sticky header
"does not stick" again, look for a new `overflow-*` ancestor first.

---

## 6. Discovery and SEO

Everything SEO-related is deliberately centralized:

| Concern | Where |
|---|---|
| Site title/description/keywords, OG/Twitter defaults | `app/layout.tsx` |
| `SoftwareApplication`, `WebSite` + `Organization` (sitelinks search box) | `app/layout.tsx`, `lib/seo.ts` |
| Per-store metadata | `app/[storeSlug]/page.tsx` |
| Per-store `Store` + `ItemList` + `BreadcrumbList` | `lib/seo.ts` `buildStoreJsonLd` |
| Store directory metadata + `CollectionPage` | `app/stores/page.tsx` |
| Sitemap (home, `/stores`, `/terms`, every public store) | `app/sitemap.ts` |
| Crawl rules | `app/robots.ts`, `next.config.ts` |
| AI/assistant brief | `app/llms.txt/route.ts` |
| Site URL constant | `SEO_SITE` in `lib/seo.ts` |

**Finding a store by name.** A shopper who knows a store's name searches the
public directory at `/stores`, and `/stores?q=<name>` is a real server-rendered,
crawlable URL. The site's `SearchAction` points at it, which is what makes the
directory the answer to "how do I find a store someone told me about?".

**Rules that keep discovery honest.**

- Hidden / downgrade-hidden products (`visible === false`) never appear in
  metadata, JSON-LD, or the directory.
- Base64 image uploads are dropped from structured data and OG tags — a crawler
  cannot read them, so they must never be the advertised image.
- Banned and unpublished stores are excluded from the sitemap, the directory and
  the canonical route.
- `/stores?q=…` is `noindex, follow`; the bare `/stores` is indexable.

---

## 7. Plans and enforcement

`lib/plans.ts` is the source of truth for plan tiers and their caps;
`lib/plan-enforcement.ts` computes repairs when a store holds more than its plan
entitles (pause the extra stores, hide the overflow products). Enforcement is
**never destructive**: nothing is deleted, only hidden or paused
(`lib/__tests__/plan-enforcement.test.ts`).

---

## 8. Environment and commands

```bash
npm install
cp .env.example .env.local   # fill in Supabase credentials
npm run dev
```

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | public key; RLS is the gate |
| `SUPABASE_SERVICE_ROLE_KEY` | server-only, never `NEXT_PUBLIC_` |

```bash
npm run check   # typecheck + lint + test — run before pushing
npm run build   # production build (type + lint gates are ON)
npm run db:push # apply migrations (see docs/04-SUPABASE-WORKFLOW.md)
```

Without Supabase credentials the app runs in local **demo mode** (no session, no
persistence) and the store pages have no rows to serve.

---

## 9. Deployment

Releases follow `docs/06-DEPLOYMENT.md`: deploy the candidate to the idle
environment, verify it with `npm run smoke` against that URL, then move traffic.
Rollback is a traffic switch back to the still-warm previous environment, not a
redeploy. The database is the part that is *not* blue-green — always ship
backward-compatible migrations first and remove the old path in a later release.

Before promoting a candidate, confirm on the candidate URL:

1. `/` returns 200 and renders the landing page.
2. `/stores` lists stores, and `/stores?q=<known store>` filters them.
3. A known `/<handle>` returns 200 with the store name and products **in the
   HTML source** (view-source, not the rendered DOM).
4. `/sitemap.xml` lists that handle; `/robots.txt` allows `/stores` and
   disallows the console routes.
5. `/llms.txt` returns the product brief.

---

## 10. Delete nothing, hide everything

The recurring rule across plans, templates and downgrades: when something must
stop being visible, set a flag. `visible: false` on a product, `isLive: false` on
a store, a retired template id falling back to the default. The store row is the
merchant's data; the app's job is to stop showing it, not to destroy it.
