# Supabase workflow

**Status:** scaffolded in P1, first used in P2. This document is the runbook.

Replaces the old approach, which was 14 loose `.sql` files in `docs/` (`SUPABASE_SETUP.sql`, `SOCIAL_*.sql` ×11, `store_reviews.sql`, `ADMIN_SETUP.sql`) with no ordering, contradictory policies and no way to reproduce an environment (docs/00-AUDIT.md §3). `docs/*.sql` are historical reference only — **`supabase/migrations/` is authoritative from now on.**

The CLI is already initialised in this repo: `supabase/config.toml`, `supabase/.gitignore`, and a first migration at `supabase/migrations/20260921090000_drop_dispatch_tracking.sql`.

---

## 1. One-time setup

The CLI is installed (`supabase 2.101.0`; upstream is `2.117.0` — `scoop update supabase` to move up). Nothing is linked yet, so run these yourself once. They are interactive and touch a real project, which is why they are not run for you.

```bash
# 1. Authenticate (opens a browser; writes a token to your user config)
supabase login

# 2. Link this repo to your project. Get the ref from the project URL:
#    https://supabase.com/dashboard/project/<project-ref>
supabase link --project-ref <project-ref>

# 3. Confirm what the CLI thinks the state is
supabase migration list
```

`supabase link` writes `supabase/.temp/` (git-ignored). The project ref is not secret; the access token is, and stays outside the repo.

## 2. Everyday loop

```bash
npm run db:diff -- rls_hardening   # generate a migration from local changes
npm run db:push                    # apply pending migrations to the linked project
npm run db:pull                    # pull remote schema changes back into a migration
npm run db:lint                    # lint the database for policy/security issues
npm run db:types                   # regenerate lib/supabase/database.types.ts from the live schema
```

`db:push` applies migrations to a **real database**. It is not reversible by rerunning it. Before the first push on a database with merchant data:

```bash
pg_dump "$DATABASE_URL" > backup-$(date +%Y%m%d).sql   # or: supabase db dump --db-url "$DATABASE_URL"
```

Local development (`npm run db:reset`) needs Docker Desktop running; it rebuilds the local database from `supabase/migrations/` from scratch. That is the test for "is our migration history actually complete".

## 3. Baseline: how we get from 14 loose files to one history

The current production schema was never captured as ordered migrations, so the history cannot be reconstructed by guessing. Capture it from the live database instead:

```bash
# Run once, against the real project, to record what actually exists today
supabase db pull --schema public
```

That produces a timestamped baseline migration. From then on, every change is a new file and `supabase db reset` must succeed — that is the P2 exit criterion ("a fresh environment is reproducible in one command"). Do **not** hand-write the baseline: a guessed schema is exactly the failure this replaces.

## 4. Initialisation order and env vars

If you ever bootstrap a new project or a second environment, the pieces that are not in `migrations/` and must be applied manually are:

1. **Storage bucket** for merchant media (product images, logos). Create it in the dashboard, or with `supabase storage` via the Management API.
2. **Auth providers** — email/password plus Google. `docs/02-BUILDER-ARCHITECTURE.md` §6 also drops `@react-oauth/google` in favour of Supabase's Google provider so there is one auth path end to end.
3. **Auth redirect URLs** — add the deployed origin and `http://localhost:3000` so magic links and password resets return to the right place.
4. **RLS** — comes from `migrations/`, never from a dashboard click, or the two will disagree.

Local env (`cp .env.example .env.local`):

| Variable | Where it comes from |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Project settings → API (safe for the browser; RLS is the gate) |
| `SUPABASE_SERVICE_ROLE_KEY` | Project settings → API. **Server only.** Never prefix with `NEXT_PUBLIC_`. |

Without the two public vars the app runs in local demo mode (`lib/supabase-client.ts` → `isSupabaseConfigured()`), which is why a misconfigured deploy currently looks like "empty store" rather than an error — making that loud is tracked in `docs/00-AUDIT.md` §P2.

## 5. Row-level security

RLS is the only thing standing between one merchant's data and another's, and the audit found four unsafe policies (F-02…F-05). Where they stand:

| Finding | What was wrong | Status |
|---|---|---|
| **F-02** `dispatch_tracking` world-writable (any anonymous client could move any delivery's GPS) | The whole dispatch module is gone | ✅ resolved by `20260921090000_drop_dispatch_tracking.sql` |
| **F-03** `store_reviews` and `store_review_comments` insert `WITH CHECK (true)` / role-only | Anyone can inject arbitrary content into any merchant's storefront feed | ⏳ P2 — needs the reviews model rebuilt on verified orders, so the policy can require one |
| **F-04** `stores` is `FOR SELECT USING (true)` and `state_json` holds phone numbers, delivery fees and the cost structure | The public projection view + the read-path split | ⏳ P2 — see below |
| **F-05** Delivery PINs live inside the publicly readable blob | Fixed by F-04's fix, not separately | ⏳ P2 |
| **F-06** Admin elevation and plan tiers are client state | Server-side `requireAdmin()` in place; plan enforcement still client-side | 🟡 partial (P0) |

**Why F-04 is not fixed yet — the honest reason.** `stores.state_json` is currently the *only* place the storefront's data lives, and it mixes public content (products, colors, sections) with private config (phone, WhatsApp template, delivery fees). Every anonymous read goes through `.from("stores").select("state_json")`. Locking the table down before `store_settings` exists would break every live storefront, and creating the public projection view first would mean the view and the table disagree about what "public" means — trading one inconsistency for another.

So F-04 lands with the normalized model in P2, in this order:

1. `store_settings` takes the private fields; the blob keeps only public content.
2. A `storefront_public` view exposes exactly the public surface (and *no* private columns).
3. `stores` becomes owner-only; the view is what anonymous clients read.
4. The client read path moves to the view (one place: `lib/supabase-client.ts` consumers), verified against a live project before the policy change ships.

**Rule for any new policy in this repo:** if a row is not safe for an anonymous user, the server decides — never the client (docs/02-BUILDER-ARCHITECTURE.md §8.3). A policy that compares `auth.uid()` to a store id, or that trusts `auth.role()` alone, is a bug.

## 6. CI

`.github/workflows/ci.yml` runs typecheck · lint · test. Once a baseline exists, add a database step so policy drift fails the build:

```bash
supabase db start          # needs Docker in the runner
supabase db reset          # replay every migration on a clean database
supabase db lint --level error
```

---

## 7. Verified state of the remote database (2026-09-21)

Recorded because the SQL files in `docs/` no longer describe the live database, and every RLS decision in this repo has to be made against reality.

**Linked project:** `ytoejmdujqtbgjdtzwwl` (`swiftlink`, West EU — Ireland). The project was paused and has since been unpaused; `supabase link --project-ref ytoejmdujqtbgjdtzwwl` succeeded, and the CLI authenticates without a database password (`db query --linked` works).

**Migration history:**

```
Local          | Remote | Time (UTC)
20260921090000 |        | 2026-09-21 09:00:00   <- drop_dispatch_tracking, not yet applied
```

Remote has **no migration history at all** — the schema was assembled by hand. Adopting it requires a baseline; see §3.

**Live row counts** (exact, not `pg_stat_user_tables` — see the warning below):

| Table | Rows | Table | Rows |
|---|---|---|---|
| `stores` | 16 | `user_feedback` | 5 |
| `store_reviews` | 24 | `system_admins` | 2 |
| `store_review_comments` | 1 | `dispatch_tracking` | **5** |
| `social_profiles` | 5 | `delivery_receipts` | 0 |
| `auth.users` | 23 | everything else | 0 |

> **Never use `pg_stat_user_tables.n_live_tup` to decide a destructive action.** It reported **0** for every table on this database, including `stores` with 16 real rows — stale statistics. A `DROP TABLE` decision made from that column would have looked completely safe. It was wrong.

**`dispatch_tracking` held 5 real delivery records**, so `20260921090000_drop_dispatch_tracking.sql` was a genuine data loss rather than a no-op — hence the backup described below.

**The `SECURITY DEFINER` functions are safe.** All six in `public` have `EXECUTE` granted to `anon`, which reads as a critical privilege-escalation surface. It is not: each enforces authorization in its own body (`is_admin(auth.uid())`, or an `auth.uid()` ownership check that raises when an anonymous caller supplies NULL), and each validates its arguments. Details and the reasoning are in `docs/00-AUDIT.md` F-23 so this is not re-raised as a new panic.

### Applied on 2026-09-21

`supabase db push` applied both migrations. Remote history now matches local:

```
Local          | Remote         | Time (UTC)
20260921090000 | 20260921090000 | 2026-09-21 09:00:00   drop_dispatch_tracking
20260921120000 | 20260921120000 | 2026-09-21 12:00:00   rls_dedupe_and_slug_hijack
```

Verified after the push:

| Check | Result |
|---|---|
| `dispatch_tracking` / `delivery_receipts` | GONE |
| `stores` / `store_reviews` rows | 16 / 24 — unchanged, no data loss |
| RLS policies on `public` | 55 → 38 (17 removed) |
| `UPDATE`/`ALL` policies with `qual = 'true'` | **0** — the "anyone can rewrite any row" class is closed across the whole schema |
| Slug-hijack policies (`Authenticated can update/upsert slugs`) | 0 |
| New author-scoped review `UPDATE` policy | present |

### The backup, and why it wasn't `pg_dump`

`supabase db dump` and `db pull` shell out to `pg_dump` **inside a Docker container**, and Docker Desktop is not installed on this machine — so neither can run. Instead the safety net was taken *inside* the database, from `supabase/.temp/backup-before-drop.sql`:

| Object | Contents |
|---|---|
| `backups.dispatch_tracking_20260921` | the 5 delivery rows that were dropped |
| `backups.delivery_receipts_20260921` | 0 rows |
| `backups.rls_policies_20260921` | snapshot of all 55 policies, so any dropped one can be restored verbatim |

The `backups` schema is not exposed to the API (`config.toml` exposes only `public` and `graphql_public`) and has been revoked from `anon`/`authenticated`. **Drop it once production has been stable for a release:** `drop schema backups cascade;`

This is a good substitute for a policy-and-row rollback and a poor one for disaster recovery. It does not protect against a bad schema change to a table it doesn't cover, so installing Docker (or `pg_dump` via `scoop install postgresql`) is still worth doing before the P2 data model lands.

### Still outstanding: the baseline migration

The remote schema for the other 14 tables, 6 functions and 38 policies still has **no baseline migration**, so `supabase db reset` cannot reproduce a fresh environment yet. That is the P2 exit criterion, and it needs `pg_dump`:

```bash
# With Docker running (or a local pg_dump on PATH):
supabase db pull --schema public

# Rename the pulled file to sort BEFORE 20260921090000 (e.g. 20260920000000_remote_schema.sql),
# or a fresh `db reset` would try to CREATE tables the drop migration already removed.

# Mark it applied on the remote, or db push will re-run CREATE TABLE against tables that exist:
supabase migration repair --status applied 20260920000000
```
