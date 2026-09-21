# SwiftLink Pro

SwiftLink Pro is a **storefront builder for small businesses** — a merchant creates a store, adds products, publishes it on a public link, and takes orders over WhatsApp, with their own brand, theme and layout.

> **Status: mid-rebuild.** This repository is being taken from an early prototype to a production-grade builder. Start with the documents below — they are the source of truth for what exists, what's broken, and what we're building.

## Rebuild documents

| Document | What it covers |
|---|---|
| [`docs/00-AUDIT.md`](docs/00-AUDIT.md) | Current-state audit: 22 severity-ranked findings with `file:line` evidence, measured bundle sizes, and what's worth keeping |
| [`docs/01-DESIGN-SYSTEM.md`](docs/01-DESIGN-SYSTEM.md) | Two-surface doctrine, token architecture, color/contrast engine, typography, icons, avatars, editor UX contract, storefront budgets |
| [`docs/02-BUILDER-ARCHITECTURE.md`](docs/02-BUILDER-ARCHITECTURE.md) | The customization engine (themes → templates → sections → blocks), data model, routing, stack decisions, P0–P6 roadmap |
| [`docs/03-DECISIONS.md`](docs/03-DECISIONS.md) | Locked decisions, phase progress, and the reasoning behind both |
| [`docs/04-SUPABASE-WORKFLOW.md`](docs/04-SUPABASE-WORKFLOW.md) | Migration workflow, environment setup, and where each RLS finding stands |

## Quick start

```bash
npm install
cp .env.example .env.local   # fill in Supabase credentials
npm run dev
```

Without Supabase credentials the app runs in local "demo mode": no session, no persistence.

### Environment variables

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key — safe in the browser, RLS is the gate |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only. Never prefix with `NEXT_PUBLIC_` |

## Commands

```bash
npm run dev         # development server
npm run build       # production build (type + lint gates are ON)
npm run check       # typecheck + lint + test — run this before pushing

npm run db:diff     # generate a migration from schema changes
npm run db:push     # apply pending migrations (see docs/04-SUPABASE-WORKFLOW.md)
npm run db:types    # regenerate database types from the live schema
```

## Architecture at a glance

- **Next.js 15 (App Router) + React 19 + TypeScript** — RSC and ISR are what a multi-tenant storefront needs.
- **Supabase** — Postgres, auth, storage. RLS is the multi-tenancy boundary; see the RLS table in `docs/04-SUPABASE-WORKFLOW.md`.
- **Tailwind + tokens** — `styles/tokens.css` is the single source of truth for every color, radius, shadow and duration, mirrored as typed data in `lib/theme/tokens.ts` and enforced for parity by a test. Two namespaces, never mixed: `app-*` for the merchant console, `t-*` for the tenant storefront.
- **`lib/theme/`** — the color engine (OKLCH + WCAG contrast gates), the tenant theme contract, its derivation, and the preset library. A merchant supplies one brand color; everything else is derived and contrast-corrected.
- **`components/ui/`** — the component kit. No hex literals, no `!important`, no arbitrary Tailwind values, enforced by `.eslintrc.js`.

### Design system

Run the dev server and open **`/dev/ui`** for the live catalogue of tokens, all 20 theme presets with their measured contrast ratios, and every kit component. It renders 404 in production.

## Testing

```bash
npm run test          # vitest, ~140 unit tests
npm run test:watch
```

The suite covers URL/handle logic, shop-state normalization, PIN hashing, the color engine (including WCAG values from published references), token↔CSS parity, every theme preset's accessibility, and avatar determinism. CI (`.github/workflows/ci.yml`) runs typecheck · lint · test.
