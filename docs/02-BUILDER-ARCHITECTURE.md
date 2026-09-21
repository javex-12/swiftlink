# SwiftLink — Storefront Builder Architecture, Stack & Roadmap (Recon 03)

**Question this document answers:** *how do we let a merchant build a genuinely custom website — not one of a handful of generic templates — and what do we build it on?*

**Read with:** `docs/00-AUDIT.md` (what's broken) and `docs/01-DESIGN-SYSTEM.md` (the visual layer).

---

## 1. What "custom website" actually means — the axes of customization

"Custondomization" is not one feature; it's ten independent axes. The current product exposes axis A and half of axis B, which is exactly why every store looks the same. Define the axes first, then build the engine that serves them.

| # | Axis | What the merchant controls | Current state |
|---|---|---|---|
| A | **Theme** | one of N curated design systems (palette, type, radius, spacing, motion, component styling) | half — an accent color and 4 layout IDs |
| B | **Global styles** | brand color (with derived ramp + contrast), font pairing, radius, density, dark/light | no |
| C | **Page structure** | add / remove / reorder / duplicate sections, pick a variant of each, edit its settings, add blocks inside it | visually present, functionally dead (F-07) |
| D | **Pages & navigation** | multiple pages (home, product, catalog, about, contact, FAQ, policy), menu builder, footer columns | no — one hard-coded page |
| E | **Content & catalog** | products, images, variants, categories, badges, stock rules, featured collections | blob-embedded, no variants |
| F | **Commerce behaviour** | order method (WhatsApp / form / online payment), delivery zones & fees, min order, out-of-stock policy, message template | partially |
| G | **Brand assets** | logo, favicon, OG/share image, brand fonts (Business tier) | logo only |
| H | **Domain & SEO** | handle, subdomain, custom domain, per-page SEO, structured data, sitemap | handle + partial SEO |
| I | **Advanced** | custom CSS, head/body snippets, embeds (Business tier, sandboxed) | schema exists, nothing renders |
| J | **Generative** | "describe your business" → full store; import from URL; auto-copy; auto-pick theme; theme marketplace | no |

**Target:** A–F excellent for everyone, G–H solid for Pro, I–J as the Business tier's differentiator. That is a product that can credibly be called a website builder.

## 2. The engine model (Shopify Online Store 2.0, adapted to React)

Shopify solved this problem precisely and its model is the industry reference: **JSON templates + sections everywhere + blocks inside sections + a settings schema that the theme editor renders automatically** ([Shopify OS 2.0](https://shopify.dev/docs/storefronts/themes/os20), [theme architecture](https://shopify.dev/docs/storefronts/themes/architecture)). We adopt the model, not the implementation:

```
Theme (design system + defaults)
 └── Templates (one per page TYPE: home, product, catalog, about, contact, cart, 404)
      └── Sections (ordered instances; each has a schema-declared settings shape)
           └── Blocks (ordered children inside a section; e.g. testimonial items,
                       footer columns, feature rows, FAQ entries, nav links)

Store content (products, media, menus, policies)  ── separated from layout ──►
      referenced by sections as *dynamic sources*, never copied into the layout
```

Two ideas do all the heavy lifting:

1. **A section's settings are declared as data, not as UI.** One `SectionSpec` produces (a) the renderer's props contract, (b) the auto-generated settings panel, (c) server-side validation, and (d) the thumbnail in the "Add section" catalog. Write a section once; the editor, the API and the storefront all follow. Adding template #31 costs one file.
2. **Layout is data; content is rows.** Layout lives in versioned JSON, content lives in real tables — so a merchant can redesign without touching products, and we can query/aggregate/report across merchants.

### 2.1 Contracts (TypeScript, validated with zod)

```ts
// lib/sections/types.ts
export type SettingSpec =
  | { id: string; type: "text" | "textarea" | "richtext" | "url" | "icon";
      label: string; default?: string; info?: string; maxLength?: number }
  | { id: string; type: "image"; label: string; default?: MediaRef; info?: string }
  | { id: string; type: "color"; label: string; default?: string; role?: "accent" | "surface" | "text" }
  | { id: string; type: "select" | "radio"; label: string; options: { value: string; label: string }[]; default?: string }
  | { id: string; type: "range"; label: string; min: number; max: number; step?: number; unit?: string; default?: number }
  | { id: string; type: "checkbox"; label: string; default?: boolean }
  | { id: string; type: "products" | "collections" | "menu" | "page"; label: string;
      min?: number; max?: number; default?: string[]; info?: string };

export type BlockSpec = {
  type: string;                 // "testimonial" | "faq_item" | "footer_column"
  name: string;
  settings: SettingSpec[];
  limit?: number;
};

export type SectionSpec = {
  type: string;                 // "hero" | "featured_products" | "rich_text" | …
  name: string;
  category: "Hero" | "Products" | "Story" | "Social proof" | "Contact" | "Layout" | "Marketing";
  settings: SettingSpec[];
  blocks?: BlockSpec[];
  maxBlocks?: number;
  presets?: { name: string; settings: Record<string, unknown>; blocks?: BlockInstance[] }[];
  limits?: { maxPerPage?: number };
  thumbnail: (themeTokens: ThemeTokens) => React.ReactNode; // live mini-render, not a hand-drawn SVG
};

export type SectionInstance = {
  id: string;                   // stable, client-generated
  type: string;                 // FK to a SectionSpec in the registry
  settings: Record<string, unknown>;
  blocks: BlockInstance[];      // ordered
  visible: boolean;
  customCss?: string;           // Business tier only, scoped by data-section-id
};
```

Stored shape of a page:

```jsonc
// stores_page.sections (versioned JSONB)
[
  { "id":"s_9f2", "type":"hero", "settings": { "variant":"split", "title":"Drop Season",
      "image":"media/…", "ctaLabel":"Shop now", "ctaTarget":"#collection" }, "blocks": [], "visible": true },
  { "id":"s_3a1", "type":"featured_products", "settings": { "collection":"new-in", "columns":4 },
      "blocks": [], "visible": true },
  { "id":"s_7c4", "type":"testimonials", "settings": { "layout":"carousel" },
      "blocks": [
        { "id":"b_1", "type":"testimonial", "settings": { "quote":"…", "author":"Ada", "avatar":"…" } }
      ], "visible": true }
]
```

### 2.2 Rendering

```tsx
// components/storefront/SectionRenderer.tsx  (server component — RSC, no client bundle)
export function SectionRenderer({ instance, ctx }: { instance: SectionInstance; ctx: StoreContext }) {
  const spec = SECTION_REGISTRY[instance.type];
  if (!spec) return null;                        // forward-compatible with unknown/removed types
  const settings = spec.settingsSchema.parse(instance.settings);   // zod: invalid → defaults, never crash
  const Component = spec.component;
  return <Component settings={settings} blocks={instance.blocks} ctx={ctx} />;
}
```

Bespoke section internals stay hand-crafted (that's where taste lives — `hero-1`'s brutalist blackout is *good*), but they receive typed, validated settings instead of crawling a global state object. The current `if (templateId === "hero-N")` chain (F-14) becomes `variants` **inside** one hero section, so 10 heroes × 4 variants is one file instead of 40 copy-pasted blocks.

## 3. Themes

A theme is a **preset file**: design tokens + per-page-type default section stacks + component styling decisions.

```ts
// lib/themes/editorial.ts
export const editorial: ThemePreset = {
  id: "editorial",
  name: "Editorial",
  description: "Serif display, generous whitespace, magazine grid.",
  tokens: { fontPair: "instrument+inter", radius: "sharp", density: "airy",
            motion: "subtle", imageRatio: "4/5", accent: "#111111" },
  templates: {
    home: [ /* ordered SectionInstance presets: hero(split) → featured_products(editorial) → about → testimonials → newsletter */ ],
    product: [ /* gallery left, sticky buy box, story block, related products */ ],
    catalog: [ /* filters + editorial grid */ ],
  },
};
```

Ship **~20 themes across ~8 families** (Editorial, Modern, Minimal, Boutique, Streetwear, Luxury, Technical, Playful) — each family with light/dark and 2–3 layouts. That alone multiplies perceived choice by ~100× versus today's single emerald gradient, and it's the difference between "pick a template" and "pick a brand".

Because themes are pure data over the same section registry, adding a theme is a recipe, not a rewrite (and later: a marketplace product).

## 4. Content model — and why this is a prerequisite

Axes C, E, F and H are all crippled by the blob (F-13/§3 of the audit). The engine above needs real rows:

```
stores            (id, owner_id, handle, name, plan, status, created_at)
store_settings    (store_id, theme_id, tokens_json, order_method, currency, wa_template, …)
store_domains     (store_id, host, verified_at, is_primary)
store_pages       (id, store_id, type, path, title, seo_json, published_revision_id)
store_revisions   (id, store_id, page_id, sections_json, created_by, created_at, published_at)
products          (id, store_id, title, description, price_minor, currency, status, …)
product_images    (id, product_id, media_id, position, alt)
product_variants  (id, product_id, options_json, sku, price_minor, stock)
collections       (id, store_id, title, slug, image_id)
collection_items  (collection_id, product_id, position)
orders            (id, store_id, customer_id, status, total_minor, currency, channel, …)
order_items       (id, order_id, product_id, variant_id, qty, unit_price_minor)
customers         (id, store_id, name, phone, email, …)
media             (id, store_id, storage_path, width, height, blurhash)
analytics_events  (id, store_id, type, product_id, metadata, created_at)
```

Notes that matter:
- **`orders` is the missing heart of the product.** WhatsApp checkout must *also* write an order row (channel = `whatsapp`) so merchants get an order list, revenue numbers and fulfilment state. That's the difference between a catalog and a business tool — and it's what makes the existing dispatch/analytics modules actually useful.
- **Revisions give draft/publish** (F-15): a page points at a `published_revision_id`; the editor writes new revisions; publish flips one pointer. Undo/redo becomes a pointer move.
- **`store_settings.tokens_json`** is exactly the shape from `01-DESIGN-SYSTEM.md` §3.1.
- **RLS done properly:** public read goes through a `storefront_public` view exposing only published pages/products/settings (kills F-04); writes require `auth.uid() = owner_id`; `dispatch_tracking` gets real ownership (kills F-02); reviews get an insert policy tied to an order or a rate-limited anon key (kills F-03).
- **Migration:** ship a one-time `state_json` → normalized backfill (products, settings, theme from `accentColor`/`heroTemplateId`), keep reading the blob in a compatibility layer for one release, then drop it. Do not attempt a big-bang cutover.
- **Migrations as code:** Supabase CLI (`supabase/migrations/*.sql`) replacing the 14 loose files in `docs/` (audit §3), so a fresh environment is reproducible and CI can test it.

## 5. Pages, routing, domains

- **Subdomain-first:** `merchant.swiftlink.com` (wildcard on Vercel) for the primary storefront, custom domain as a Pro feature (`store_domains` + verification record + on-demand wildcard cert). Keep `/store/<handle>` as a permanent redirect for links already shared.
- **Real path routing:** `/`, `/products`, `/products/[product]`, `/collections/[slug]`, `/about`, `/pages/[slug]`, `/cart`, `/checkout`, `/order/[id]` — per-page SEO metadata generated server-side, with `sitemap.ts` reading the DB and JSON-LD (`Product`, `Organization`, `BreadcrumbList`).
- **Rendering:** storefront is RSC + ISR, revalidated on publish via `revalidateTag(store:<id>)` — statically fast, instantly correct (kills the client-render SEO/perf failure of audit §4).
- **Auth for customers is optional** (guest checkout, magic-link order tracking by phone + code), kept separate from merchant auth so tenant and console sessions can never collide.

## 6. Stack decision

### Keep (already right)

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js 15 App Router + React 19** | already invested; RSC + ISR is exactly what a multi-tenant storefront needs |
| Data/Auth/Storage/Realtime | **Supabase (Postgres)** | already invested; row-level security maps cleanly onto multi-tenancy; keep realtime for order/dispatch updates |
| Styling | **Tailwind** (upgrade to **v4**) | v4's CSS-native `@theme` variables are a *better* fit for runtime per-tenant theming than v3 config; shadcn/ui's token model targets v4 |
| Components | **shadcn/ui + Radix primitives** | accessible behaviour we don't hand-roll, copy-in ownership, token-driven theming |
| Icons | **lucide-react** | already used everywhere (see 01 §7) |
| Motion | **framer-motion** (console), CSS (storefront) | already used; restrict to layout/enter-exit |
| Maps (dispatch) | **react-leaflet**, dynamically imported | already used, keep but lazy-load |

### Add

| Need | Choice | Why |
|---|---|---|
| Schema validation (everywhere) | **zod** | the section/theme/settings contracts in §2 are zod schemas; also validates env, API bodies, blob migration |
| Forms | **react-hook-form** + zod resolver | editor panels are form-dense; today they're hand-rolled `useState` per field |
| Drag-and-drop | **dnd-kit** | reorder sections/blocks/products with keyboard support and no HTML5-DnD pain |
| URL state | **nuqs** | deep-linkable editor state (`?page=home&section=s_3a1`) |
| Server auth | **@supabase/ssr** (already installed, never used) | real middleware/session protection (kills F-01) |
| Data tables (admin) | **TanStack Table** | admin console currently hand-rolls tables |
| Charts (analytics) | **Recharts** | light, composable, good enough for revenue/orders |
| Email | *pick from Gravity at implementation time* (Resend-class transactional email) | order confirmations, magic links, merchant digests |
| Monitoring | *pick from Gravity at implementation time* (Sentry-class) | today there is zero visibility into client errors |
| Rate limiting / caching | Upstash-class Redis (Gravity) | review/feedback/event endpoints are public and unthrottled |
| Tests | **Vitest** (unit) + **Playwright** (e2e + visual) | 0 tests today; the editor and checkout need e2e coverage before we touch them |
| CI | GitHub Actions: typecheck, lint, unit, e2e, visual diff | gates currently disabled entirely (F-11) |

### Payments (decided with evidence, not memory)

Gravity's catalog has **no regional Nigerian provider**, and its own analysis says so explicitly: Stripe "has limited support for local Nigerian payment methods like USSD and direct bank transfers" and doesn't handle local merchant payouts the way a regional provider such as **Paystack or Flutterwave** does. So: WhatsApp checkout stays the default for free/Pro; when we add online payment, it's **Paystack (NG) + Flutterwave (multi-Africa)** first, Stripe only for the international/marketplace case — and I'll pull exact install guidance from Gravity before writing that integration.

### Lazy-load or drop

- **three.js / @react-three/fiber / drei** — currently shipped to every storefront visitor (audit §4). Demote to *opt-in premium hero sections*, loaded via `next/dynamic` only when that section is present. If the bundle cost can't be justified, cut it.
- **Font Awesome CDN** — delete (duplicate icon system, render-blocking).
- **`@react-oauth/google`** — replace with Supabase's Google provider so one auth path exists end-to-end.
- Google Fonts `<link>` → `next/font` self-hosted.

## 7. Roadmap

Each phase has an exit criterion. Nothing in a later phase starts before its predecessor's criterion is met — that discipline is the actual fix for "vibecoded".

### P0 — Stop the bleeding (security + truth)
- Real SSR auth: Supabase session in middleware, server-side gates for `/pro`, `/business`, `/pro/admin`, `/dispatch`, `/account` (F-01, F-06).
- Rewrite the dangerous RLS policies; add the public projection view (F-02…F-05).
- Delete dead code: `VisualEditor.tsx`, `components/sections/*`, `editorMode`, orphan SQL/`sw.js`/`workbox-*` (F-07, F-10).
- Fix `/banned`, `/store/visit`, add `app/error.tsx`, `app/not-found.tsx` (F-08, F-09).
- Re-enable `typescript`/`eslint` build gates + add `typecheck`/`lint`/`test` scripts and a CI workflow (F-11, F-16).
- **Exit:** `npm run build && npm run typecheck && npm run lint && npm run test` green in CI; no route renders for a non-owner.

### P1 — Tokens + UI kit (looks like a product)
- Implement `lib/theme/*` (tokens, derive, contrast engine) and `styles/tokens.css`; delete the `!important` hijack and the CDN fonts/icons (F-17…F-20).
- Build `components/ui/*` on shadcn/Radix; replace `window.customPrompt`/`Confirm` and the fake overlay (F-22).
- Rebuild `LauncherView` + `AppChrome` + nav on the kit; adopt the `<Avatar>` ladder + Lucide-only icons.
- **Exit:** every console screen renders from tokens; dark mode is a token swap; screenshot tests for light/dark pass.

### P2 — Real data model
- Supabase CLI migrations; `products`, `product_images`, `product_variants`, `collections`, `orders`, `order_items`, `customers`, `media`, `store_settings`, `store_pages`, `store_revisions`, `store_domains`, `analytics_events`.
- `state_json` backfill + compatibility layer; order rows written by WhatsApp checkout; dispatch linked to real orders.
- **Exit:** a fresh environment is reproducible in one command; a WhatsApp order appears as an order record with revenue in analytics.

### P3 — Section engine + editor
- Section registry + zod contracts + `SectionRenderer` (server); port the 10 hero designs into hero *variants*; build the first 15 sections (hero, featured products, product grid, rich text, image+text, gallery, testimonials, logos, FAQ, newsletter, contact, map, announcement bar, video, footer).
- Rebuild the editor: rails + canvas + context bar, dnd-kit reordering, autosave draft, undo/redo, preview, publish (revisions), command palette, "Add section" catalog with live thumbnails.
- **Exit:** a merchant builds a 5-section page with blocks, undoes a mistake, previews, publishes — and a customer sees exactly that.

### P4 — Themes + storefront rebuild
- 20 theme presets; token-driven storefront components; RSC + ISR rendering; `next/image` pipeline with per-slot ratios; real product/collection/cart/checkout routes; performance budget enforced in CI.
- **Exit:** storefront ≤ 90 kB First Load JS, LCP < 2.5 s on throttled mobile, Lighthouse SEO ≥ 95 with rendered content.

### P5 — Growth surfaces
- Pages & navigation builder (multi-page, menus, footer columns); per-page SEO; subdomain routing + custom domains; announcement/promo sections.
- **Exit:** a merchant runs a 5-page site on their own domain without contacting us.

### P6 — Business tier & generative
- Custom CSS / head snippets (sandboxed, scoped), brand font upload, theme marketplace, and the AI assistant ("describe your business" → theme + sections + copy; import from a URL).
- **Exit:** a new merchant reaches a publishable, non-generic store in under 5 minutes without design help.

## 8. Non-negotiables

1. No hex literal or `!important` outside `lib/theme`.
2. No component reads `stores.state_json` after P2.
3. No client-side authorization: if a route or row isn't safe for an anonymous user, the server decides.
4. Every destructive action is undoable; nothing reaches customers without publish.
5. Storefront always server-renders content; JS is enhancement.
6. CI green or it doesn't merge.

## 9. Open decisions needed before P0/P1 code

1. **Rewrite strategy** — strangler refactor inside this app/repo, or a fresh app scaffolded beside it and swapped route-by-route?
2. **Scope of "custom website"** — how far down the axis list (§1) do we commit for v1: A–F (full builder), or A–B–C first (themes + styles + sections) and pages/domains later?
3. **Payments** — WhatsApp-only for now, or start the Paystack/Flutterwave integration in P2 so `orders` has a live channel from day one?
4. **Tailwind v4 upgrade** — now (during P1, cheap while the component surface is small) or after the storefront rebuild?
5. **Dispatch & social modules** — keep them in scope (they're differentiators but they're also 40% of the current code and share the god context), or freeze them in P0 and focus the rebuild on the builder?
