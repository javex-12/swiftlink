# SwiftLink — Design System & UX Spec (Recon 02)

**Goal:** replace "vibecoded colors and 10 unrelated visual languages" with one token-driven system that (a) makes the product look like a real SaaS, and (b) lets a merchant express their own brand *without* CSS hacks.

**Read with:** `docs/00-AUDIT.md` — this spec is the direct answer to F-17, F-18, F-19, F-20.

---

## 1. Doctrine: two surfaces, never one palette

The single biggest design mistake in the current build is that merchant console and customer storefront share the same visual vocabulary (and fight over the same CSS classes). Separate them at the token level, in the DOM, from day one.

| | **Console** (SwiftLink product) | **Storefront** (tenant's brand) |
|---|---|---|
| Users | merchant, admin, driver | the merchant's customers |
| Job | friendly, guided merchant tool — clear over clever | sell, load fast, feel like the brand |
| Owns | SwiftLink tokens (`--app-*`) | tenant theme tokens (`--t-*`) |
| Colors | fixed brand (one accent, neutral grays) | merchant-controlled, derived, contrast-enforced |
| Type | one family, tight scale, tabular numbers | theme-driven pairings |
| Radius | 10/14 px | theme-driven (0 → 24 px) |
| Motion | 120–240 ms, functional | theme-driven, decorative, opt-in |
| JS budget | up to ~250 kB (it's an app) | **< 90 kB** (it's a shop, on mobile data) |

**Rule:** a tenant's brand may never restyle SwiftLink's own UI, and SwiftLink's UI may never leak into the storefront. Enforcement is structural: separate token namespaces, and the storefront is rendered inside a scope element — never by rewriting global utility classes.

**Console personality (decided, D5):** friendly Shopify-style. Generous whitespace, large tap targets, plain-language labels, illustrated empty states, a visible setup checklist, mobile-first layout — most merchants here will work from a phone. Density is earned through structure (cards, sections, tables), never by shrinking type. The one place we stay dense is data surfaces: orders, products and analytics tables keep compact rows with `tabular-nums` because scanning beats decoration there.

## 2. Principles

1. **Hierarchy beats volume.** Today nearly every label is `font-black uppercase tracking-widest`. New rule: one display weight per view, one accent color per view, small caps reserved for metadata only.
2. **Tokens or nothing.** No hex literal, no `rounded-[2.5rem]`, no arbitrary shadow may appear in a component. Everything resolves to a CSS variable. (Lint rule, see §12.)
3. **The merchant's brand wins on the storefront, accessibility wins over both.** If a merchant picks white-on-white, we fix it and tell them.
4. **Ship-empty looks finished.** Every list, section and image has a designed empty state and a skeleton — placeholder copy like `"Store launched on SwiftLink."` (F-21) is a bug.
5. **Two ways to be fast: fewer bytes and fewer round trips.** Mobile-first for the storefront, instant-feel (optimistic + skeleton) for the console.
6. **Undo is a feature, not a nicety.** Every destructive editor action is reversible; nothing autosaves to live customers without an explicit publish.

## 3. Token architecture

Three layers, each a CSS custom property. Follows the standard layered-token model (primitive → semantic → component) recommended across design-systems practice ([design-token architecture](https://martinfowler.com/articles/design-token-based-ui-architecture.html), [M3 tokens](https://m3.material.io/foundations/design-tokens), [multi-brand token architecture](https://zeroheight.com/learn/multi-brand-multi-product-and-white-label-token-architecture/)).

```
primitives   --sl-emerald-500: #10b981;            ← never used by components
semantic     --app-accent: var(--sl-emerald-500);  ← what components consume
component    --btn-primary-bg: var(--app-accent);  ← only if a component truly needs it
```

Token groups: color · typography · space · radius · shadow · border · motion · z-index · breakpoints.

### 3.1 Storefront tokens (`--t-*`)

The tenant theme is a **plain data object** (stored per store, versioned) that is compiled to CSS variables on a scope element:

```tsx
// app/(storefront)/layout.tsx  — server component
const theme = await getThemeForStore(storeId); // validated, defaults applied
return (
  <div data-theme-scope="storefront" style={themeToCssVars(theme)}>
    {children}
  </div>
);
```

```css
/* tokens/storefront.css — semantic only, no palette */
[data-theme-scope="storefront"] {
  --t-bg: var(--t-bg-value);
  --t-surface: /* derived */;
  --t-text: /* derived */;
  --t-text-muted: /* derived */;
  --t-accent: /* derived */;
  --t-accent-fg: /* derived by contrast */;
  --t-accent-hover: /* derived: accent darkened 8% */;
  --t-border: /* derived: text @ 12% */;
  --t-radius: 12px;
  --t-radius-sm: calc(var(--t-radius) * 0.5);
  --t-font-display: var(--font-tenant-display);
  --t-font-body: var(--font-tenant-body);
  --t-space-section: clamp(48px, 8vw, 112px);
}
```

Components then use ordinary Tailwind with semantic names (`bg-t-surface`, `text-t-text-muted`, `rounded-t-lg`) — **no `!important`, no class hijacking** (kills F-17). Because tokens are scoped to an element, the console and the storefront can be rendered in the same document safely (which is exactly what a live editor preview needs).

### 3.2 Console tokens (`--app-*`)

Fixed for now, ready for white-labelling later (e.g. an agency plan). Ship ~1 accent (emerald 500 `#10b981` — keep the existing brand equity), a 12-step neutral ramp, semantic states (success / warning / danger / info), and one **canonical** dark mode. Delete the `dark:bg-[#07110d]` / `#00c885` / `#0e251b` one-offs (F-19) — dark mode is a token swap, not a find-and-replace.

### 3.3 Where tokens live

- `lib/theme/tokens.ts` — primitives + console semantics (typed, exported as data).
- `lib/theme/theme-schema.ts` — the tenant theme contract + zod validator + defaults.
- `lib/theme/derive.ts` — pure functions: ramp generation, contrast fixing, dark-mode derivation.
- `styles/tokens.css` — the variables, imported once.

This is also the *only* place a color is ever written down. `PRESET_PALETTES` (24 hard-coded palettes in `BusinessView.tsx:19-45`) becomes 24 **theme presets** referencing the same structure, each with a validated contrast pass.

## 4. Color engine

Merchant input is a brand color (hex) + a background intent (light / dark / auto). We derive everything else, and we never ship an unreadable storefront.

```
buildTheme(brandHex, bgIntent) → {
  accent, accentFg, accentHover, accentSubtle,
  bg, surface, surfaceAlt, text, textMuted, border,
  contrast: { accentOnBg: 4.8, textOnBg: 12.1, passes: true }
}
```

Rules:
- Work in **OKLCH** for ramps (perceptually even lightness) and convert to hex only at the edge; modern browser support makes this safe, and CSS `color-mix()` is already relied on today (`CustomerStorefront.tsx:966`).
- **Contrast gates:** body text ≥ 4.5:1, large text ≥ 3:1, UI borders ≥ 3:1 against adjacent surface, focus ring ≥ 3:1. Fail → auto-correct lightness and show a quiet "we adjusted your color for readability" note. Never silently ship unreadable (F-18's Cyberpunk/Matrix presets).
- **Derived, not asked:** hover/active/disabled, subtle/tinted backgrounds, and the accent's foreground color (`accentFg`) come from the engine. Today `isDarkColor()` in `lib/utils.ts` is the entire contrast strategy.
- **Dark mode is derived**, not a second hand-authored palette.
- Ship a **preview strip** in the editor: swatch row showing contrast checks (body, muted, button, border) with pass/fail ticks — the merchant *sees* the accessibility guarantee.

## 5. Typography

- **Console:** one family (Plus Jakarta Sans or Inter), loaded with `next/font` (self-hosted, `display: swap`, no Google CSS request). Kill the 4-family CDN soup and `font-brand-header`/`font-serif-luxury` novelty faces from working UI.
- **Storefront:** a curated set of **theme pairings** (display + body), each self-hosted via `next/font` and selectable per theme: e.g. *Editorial* (Instrument Serif + Inter), *Modern* (Plus Jakarta + Inter), *Geometric* (Poppins + Inter), *Technical* (IBM Plex Sans/Mono), *Luxury* (Playfair + Lato). Merchant picks a pairing, not a font file.
- **Scale:** a modular scale expressed in tokens with fluid clamps for display sizes: `--text-xs … --text-6xl`, `--leading-tight/normal/relaxed`, `--tracking-tight/wide`.
- **Numbers:** `tabular-nums` for prices, quantities, totals and order IDs — revenue tables must align.

## 6. Space, radius, elevation, motion

- **Space:** 4 px base, 8 px rhythm (`--space-1 … --space-16`). Section padding on the storefront is tokenized so themes can move from "brutalist tight" to "editorial airy" without touching components.
- **Radius:** `--radius-none/sm/md/lg/xl/full` mapped to a theme setting (`sharp | soft | rounded | pill`) so all components respond coherently — the current `buttonRadius` only affects some buttons.
- **Elevation:** 4 named levels (`--shadow-xs/sm/md/lg`) with a dark-mode variant (dark mode uses borders + subtle glows instead of big shadows).
- **Motion:** `--duration-fast 120ms`, `--duration-base 200ms`, `--duration-slow 320ms`; easings `--ease-out`, `--ease-spring`. Storefront animations are opt-in per theme and must respect `prefers-reduced-motion`. The console keeps Framer Motion for layout transitions only; infinite decorative loops (`animate-pulse` orbs, `animate-float`, three.js heroes) are opt-in and never on the critical path.

## 7. Icons

**Decision: Lucide, and only Lucide.**

- It is already in the tree (`lucide-react@1.7.0`) and used in every major component, so adopting it costs nothing and removing Font Awesome + emoji removes an external render-blocking stylesheet and two inconsistent visual languages (F-20).
- Lucide's 24 px grid, 1.5 stroke default and tree-shakeable per-icon imports are the best fit for a dense console *and* a light storefront; Phosphor costs more per icon because every icon must carry six weights, and Heroicons has a smaller set ([2026 comparison](https://www.pkgpulse.com/guides/lucide-vs-heroicons-vs-phosphor-react-icon-libraries-2026)).
- One wrapper component enforces consistency:

```tsx
<Icon icon={ShoppingCart} size="md" />   // sizes: xs12 sm16 md20 lg24 xl32
```

- **No emoji as UI iconography anywhere** (product categories, avatars, status). Merchants may *type* emoji in copy; the product never ships 🧑‍🍳 as an avatar or 🚚 as a status.
- **Merchant-facing icon picker:** a curated subset (~120 tagged icons) for categories and section badges, stored as an icon *name* validated against the registry — not a free-text glyph.
- Custom brand marks (logo, payment/provider logos, WhatsApp) live in `/public/brand` as SVGs with correct licensing.

## 8. Avatars & identity

Today: hard-coded `👨‍🚀` for the merchant (`LauncherView.tsx:66`), ten hashed emoji for commenters (`SocialPage.tsx:46-52`), `charCodeAt % N` for the storefront. Replace with a four-tier deterministic ladder:

```
1. Uploaded image (any of user / store logo)   → avatar
2. Provider image (Google profile)             → avatar
3. Deterministic generated SVG                 → avatar (seed = user id or store id)
4. Branded initials                            → avatar (initials + accent gradient)
```

- **Tier 3:** generate locally (`boring-avatars`-style gradient/marble/beam geometry, or `@dicebear/core` with one or two styles bundled locally, **not** the dicebear HTTP API — no third-party request on a customer's storefront, and deterministic output so avatars don't flicker between renders). DiceBear offers ~63 styles as local libraries and Boring Avatars is a tiny gradient-based React component ([comparison](https://www.dicebear.com/understand/dicebear-vs-alternatives/)) — we bundle exactly one style for user identity, and the storefront's theme controls the palette.
- **Tier 4** uses the tenant accent so comment avatars look native to the store's brand instead of like emoji confetti.
- **One `<Avatar>` component**, sizes `xs 20 · sm 28 · md 36 · lg 48 · xl 80`, with `ring`, `status` and `verified` slots. Verified badges (already a feature — `docs/` social work) become a token-colored check on a consistent 16 px badge, not a per-call-site overlay.
- Store logo gets an **upload + crop/focal-point** step with a square preview and a monogram fallback, so the "no image" state is branded rather than blank.

## 9. The merchant editor — UX research and target design

Current editor (`BusinessView.tsx`) is one scrolling page of 8 accordions plus a tab for appearance and an inbox, with an all-or-nothing Save and a `beforeUnload` warning. The industry pattern for this class of tool (Shopify theme editor, Webflow, Framer) is:

**Layout:** three zones — left **structure/settings rail** (scrollable, collapsible, searchable), center **canvas** (device-framed preview, real data), top **context bar** (page selector, device toggle, undo/redo, preview, publish). Mobile: canvas full-bleed with a bottom sheet for settings.

**Interaction contract:**

| Concern | Target behavior |
|---|---|
| Draft vs live | explicit **draft → preview → publish**, with a "unpublished changes" indicator; live customers never see drafts (kills F-15) |
| Saving | autosave the **draft** with optimistic UI + visible "Saved 2s ago"; publish is a deliberate act |
| Undo | global undo/redo (`⌘Z` / `⇧⌘Z`) over the draft, history kept server-side per revision |
| Selecting | clicking a region in the canvas selects the corresponding section in the rail (bidirectional highlight); hovering highlights the tree node |
| Reordering | drag-and-drop with a drop indicator + keyboard alternative (⌥↑/⌥↓), not just up/down buttons |
| Adding | "Add section" opens a **catalog with live thumbnails** grouped by purpose (Hero, Products, Story, Social proof, Contact), not a flat list of 10 identical cards |
| Editing | inline text editing on the canvas for headings/buttons (content is canonical in the settings panel) |
| Data binding | settings pick from *real* products/collections, not typed-in strings |
| Keyboard | command palette (`⌘K`) for add section / switch page / publish |
| Guardrails | destructive actions are undoable, never modal-gated with `window.customConfirm` (kills F-22) |
| Onboarding | a **checklist** ("add 3 products · pick a theme · set your handle · connect WhatsApp"), each item deep-linking to the right panel — replaces the substring heuristic in `OnboardingModal.tsx` (kills F-21) |
| Empty state | a freshly created store opens on a *designed* starter theme with sample content flagged "example — replace", one click to clear |

**Accessibility of the editor itself:** every control keyboard reachable, labelled, and operable; the canvas is an `aria-hidden` visual mirror with an accessible settings tree alongside (this is the part drag-and-drop builders usually fail, and merchants with screen readers deserve an editor too).

## 10. Storefront UX

- **Mobile-first, sub-2s.** Server-rendered HTML with meaningful content in the first byte; JS is progressive enhancement (cart, filters, gallery). Performance budget enforced in CI: storefront route ≤ 90 kB First Load JS, LCP < 2.5 s on a mid-tier Android over 4G, CLS < 0.1.
- **Images:** `next/image` with explicit aspect ratios per slot (1:1 product grid, 4:5 portrait fashion, 16:9 banner), lazy below the fold, `priority` on hero. No more raw `<img>` (lint already flags them).
- **Product page:** gallery with thumbnails + swipe, price with `tabular-nums`, stock state, variant picker (see `02-BUILDER-ARCHITECTURE.md` §4), delivery estimate, and a single primary CTA whose label follows the merchant's chosen order method.
- **Checkout paths (all first-class):** WhatsApp (kept — it's the moat), on-site form + order record, and online payment when enabled. One component, three modes.
- **Trust block:** reviews with photos, verified buyer badge, return policy, delivery areas/fees, contact — currently scattered and partly unreachable.
- **Empty states:** no products → a branded "coming soon" storefront with WhatsApp contact, not a broken grid.
- **Navigation:** configurable per theme (`bottom bar | drawer | top nav`), which the current storefront hard-codes as a bottom bar.

## 11. Accessibility

Target **WCAG 2.2 AA** for the console and anything the merchant can't control; the storefront inherits AA by construction (contrast engine §4) with merchant overrides validated.

Concretely: visible focus rings everywhere (never `outline: none`), semantic landmarks (`header/nav/main/footer`), real `<button>`s, labelled inputs with error text tied via `aria-describedby`, min 44×44 px touch targets, `alt` text on every image (lint currently warns), a skip link, and a reduced-motion path for every animation.

## 12. Enforcement (so this doesn't decay again)

1. **Component library** (`components/ui/*`): Button, IconButton, Input, Textarea, Select, Combobox, Field, Switch, Checkbox, RadioGroup, Slider, ColorPicker, Tabs, Accordion, Card, Badge, Avatar, Tooltip, DropdownMenu, Dialog, Sheet, Toast, Table, EmptyState, Skeleton, Spinner, Progress. Built on shadcn/ui primitives (Radix + Tailwind, copy-in components we own) so we get accessible behaviour without a black-box dependency, and tokenized via CSS variables exactly as shadcn's theming model expects ([shadcn theming](https://ui.shadcn.com/docs/theming)).
2. **Lint rules:** ban `!important` in component files, ban raw hex literals outside `lib/theme`, ban `<img>`, ban arbitrary Tailwind values (`w-[347px]`, `rounded-[2.5rem]`) in `components/ui`.
3. **Visual regression:** Playwright screenshots of the storefront for the top N theme presets × light/dark × mobile/desktop, in CI. A design system without screenshot tests is a document, not a guarantee.
4. **Storybook-or-equivalent:** one page rendering every `ui/` component in both console themes (light/dark) and a sample tenant theme, so "did I break dark mode?" is answerable in one glance.

## 13. What we delete (mapped to the audit)

- `app/globals.css` `!important` dark-mode overrides and the `.bg-black` rewrites → F-17/F-19
- storefront injected `<style>` class-hijack block (`CustomerStorefront.tsx:963-973`) → F-17
- Font Awesome CDN + Google Fonts `<link>` block in `app/layout.tsx` → F-19/F-20
- emoji avatars (`LauncherView.tsx:66`, `SocialPage.tsx:46-52`) → F-20
- hard-coded `PRESET_PALETTES` hex table → replaced by validated theme presets → F-18
- `window.customPrompt` / `window.customConfirm` → real `Dialog`/`PromptDialog` components → F-22
- fake loading overlay + scripted hand-cursor tour (move behind an explicit "Take a tour" action) → F-22
