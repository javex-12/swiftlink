# 06 · Deployment: blue-green, rollback, and safe migrations

This document defines how SwiftLink Pro is released. It is written to be followed
under pressure — during a bad deploy — so it states the *order* of operations and
the exact command for each gate.

---

## 1. What "blue-green" means here

Two identical production environments:

| | Blue | Green |
|---|---|---|
| Role | serves 100% of live traffic | idle; receives the new version |
| State | last known-good release | candidate release |
| Traffic | live | none until promoted |

A release is: **deploy to the idle environment → verify it → switch traffic →
keep the old one warm**. If the candidate fails verification, you never switch —
users never saw it. If it passes verification but fails in production, you switch
back, which is a router change measured in seconds rather than a redeploy.

The properties that matter, and how they are obtained:

- **Zero downtime** — no user request is served by a half-updated process,
  because traffic moves between two complete environments.
- **Instant rollback** — the previous environment still exists and still works.
- **Cost** — the idle stack is duplicated capacity. This is the trade.

---

## 2. Current reality (read this before planning anything)

SwiftLink Pro today is **one** Next.js app deployed to a single hosted
production, with **one** Supabase project behind it. There is no in-repo deploy
configuration (no `vercel.json`, no Dockerfile, no Procfile); deploys are driven
from the host's dashboard.

That means:

- **Application blue-green is already available, natively** — see §3.
- **Infrastructure blue-green is not configured** — see §4 if you need literal
  blue/green rather than the managed equivalent.
- **The database is the hard part** — a shared database cannot be blue-green the
  same way an app can. §6 is the section that will actually bite you.

---

## 3. Option A — managed atomic deploys (recommended default)

Most managed platforms give you blue-green's two useful properties without you
running two stacks:

1. Every deploy builds an **immutable** artifact. The running version is never
   mutated in place.
2. The production alias is **switched atomically** to the new artifact once it is
   healthy. In-flight requests complete on the old version.
3. The **previous artifact is retained**, so rollback is "point the alias at the
   previous deployment" — seconds, not a rebuild.

On Vercel specifically: every deployment gets a unique URL; production is an
alias; "Promote to production" / "Instant Rollback" moves that alias. Preview
deployments are your *idle* environment for verification, and promotion is the
traffic switch.

**Use this unless you have a requirement that forces §4.** It gives you the
outcome you want at a fraction of the operational cost, and it is the only option
that needs no new infrastructure.

### What this project actually does (checked against the live project, 2026-10-10)

Project `swiftlinkpro`, team `dosunmumichael26-9505s-projects`.

- **Production branch is `main`, so a push to `main` builds *and auto-promotes*.**
  Every deployment in the project's history is `readyState: PROMOTED`. There is
  no idle "green" environment unless you push a **branch**, which builds a
  preview. Blue-green here means: branch → verify → merge to `main` → verify
  production; the safety net is rollback, not a staged promote.
- **Deployment Protection is on** (`ssoProtection.deploymentType:
  "all_except_custom_domains"`), so every preview and per-deployment URL answers
  `302 → Protected by Vercel Authentication`. Only the production alias
  (`swiftlinkpro.vercel.app`) is publicly reachable. An unauthenticated smoke run
  against a candidate will therefore report **302s, not the app** — which looks
  exactly like a broken deploy. Fix: Project Settings → Deployment Protection →
  **Protection Bypass for Automation** (this is dashboard-only; the REST API does
  not expose it), then export the secret. Vercel also injects it into builds as
  `VERCEL_AUTOMATION_BYPASS_SECRET`, and `scripts/smoke.mjs` sends it as
  `x-vercel-protection-bypass` on every request when that or
  `SMOKE_PROTECTION_BYPASS` is set.
- **Preview deployments only have Supabase access because the public vars were
  extended to the `preview` target** on 2026-10-10 (`SUPABASE_URL`,
  `SUPABASE_ANON_KEY`, `SUPABASE_PUBLISHABLE_KEY` and the three
  `NEXT_PUBLIC_*` mirrors). The anon key ships in the browser bundle anyway. The
  service-role key, `SUPABASE_JWT_SECRET` and every `POSTGRES_*` value are still
  **production-only on purpose** — a preview URL must not hold the credentials
  that bypass RLS.
- **This team's API token makes the CLI's user-scoped commands fail** with
  `Error: User not found.` (`whoami`, `link`, `domains ls`): the token is
  team-scoped and the CLI resolves the user first. The REST API works fine with
  `?teamId=team_n7Li58dgZQmoXyRPDg1LyUcS`. `vercel login` in a browser is what
  makes the CLI usable.

### Promotion checklist (Option A)

```bash
# 0. One-time, per machine: authenticate and link this directory. Both are
#    interactive — `vercel whoami` hangs forever when the CLI has never been
#    logged in, which is how this repo sat undeployed. In CI, use VERCEL_TOKEN.
npx vercel login
npx vercel link

# 1. Build the candidate (the "green" environment) without touching production.
#    Push a branch: `main` is the production branch, so any *other* branch is a
#    preview build.
git push origin HEAD:refs/heads/bluegreen-gate

# 2. Verify the candidate BEFORE promoting it. Needs a Protection Bypass secret
#    (see above), otherwise every request 302s to the Vercel SSO.
SMOKE_BASE_URL=https://<preview-url> SMOKE_STORE_HANDLE=cyder \
  SMOKE_PROTECTION_BYPASS=<bypass-secret> npm run smoke

# 3. Switch traffic: merging to `main` is the atomic switch here.
git checkout main && git merge --ff-only <branch> && git push origin main

# 4. Re-run the gate against the public production alias.
SMOKE_BASE_URL=https://swiftlinkpro.vercel.app SMOKE_STORE_HANDLE=cyder npm run smoke

# If step 4 fails, go back instead of forward: the previous deployment is
# retained and rollback is seconds, not a rebuild.
npx vercel rollback            # or: npx vercel promote <previous-deployment-url>
```

A promotion without step 2 is a guess, not a release. Step 2 is also the step
most likely to be skipped by accident, because a protected candidate fails the
smoke gate in a way that reads like an outage.

`next.config.ts` sets `output: "standalone"` for the self-hosted path in §5.
That is not a Vercel problem (Vercel builds the app its own way), so it does not
need to change before deploying here.

---

## 4. Option B — literal blue/green infrastructure

Only if you need two long-lived environments behind your own router. The shape:

```
                    ┌──────────────────────────┐
   users ──────────►│  router / load balancer  │
                    │  (traffic switch lives   │
                    │   here, nowhere else)    │
                    └───────┬──────────┬───────┘
                            │          │
                    ┌───────▼───┐  ┌───▼───────┐
                    │  BLUE     │  │  GREEN    │
                    │ (active)  │  │ (idle)    │
                    └─────┬─────┘  └─────┬─────┘
                          └──────┬───────┘
                                 ▼
                        one shared database
```

Rules that make it work:

1. **The switch is a single atomic operation** at the router. If switching
   requires three changes, it is not blue-green.
2. **Both environments run the same env contract** and differ only in which
   build is deployed. Any per-environment secret or URL difference must be
   declared up front; missing configuration is the most common cause of a
   "green is broken" switch.
3. **Both environments must be healthy against the same database at the same
   time** during the transition. That constraint is what §6 exists to satisfy.
4. **Never deploy to the active environment.** Deploy to idle, verify, switch.
5. **Keep the previous environment warm** and unmodified after a switch, so
   rollback is a router change. Do not deploy to it while it is the rollback
   target.

### Switch procedure

```bash
# 1. Deploy the candidate to the IDLE environment.
# 2. Wait for the readiness probe to pass repeatedly, not once.
for i in 1 2 3; do
  curl -sf https://green.example.com/api/health | grep -q '"status":"ok"' || exit 1
  sleep 5
done

# 3. Run the full smoke gate against idle.
SMOKE_BASE_URL=https://green.example.com SMOKE_STORE_HANDLE=cyder npm run smoke

# 4. Switch traffic at the router (blue → green).
# 5. Verify through the PUBLIC url, not the environment url — this catches
#    routing, TLS and header problems that the environment-level check misses.
SMOKE_BASE_URL=https://swiftlink.example.com SMOKE_STORE_HANDLE=cyder npm run smoke
```

### Rollback

Switch the router back. Then confirm:

```bash
SMOKE_BASE_URL=https://swiftlink.example.com npm run smoke
```

Rollback is **only** a traffic operation. It does **not** undo migrations that
already ran — see §6.4.

---

## 5. The readiness gate

Two artifacts, both in this repo:

| Artifact | Purpose | Command |
|---|---|---|
| `GET /api/health` | app liveness + database reachability | `curl -sf $BASE/api/health` |
| `scripts/smoke.mjs` | route-level contract check | `npm run smoke -- $BASE` |

`/api/health` returns **200** when the app booted and either the database answers
or Supabase is not configured (local demo mode). It returns **503** when Supabase
is configured but unreachable — do not switch to an environment in that state. It
never returns credentials, the database hostname, or row data.

The database probe is a `GET /auth/v1/health` round trip with a 4 s budget,
**retried once** before the environment is declared degraded (worst case ~8 s,
and only when the deploy is being rejected anyway). This retry is not decoration:
with a single 3 s attempt the probe reported `503` against a Supabase project that
answered fine one second later — a fail-closed false negative that would block a
healthy release. A readiness gate that cries wolf gets bypassed, so the flake is
worth the extra attempt. Treat a single `503` as "re-check", and a repeated one as
"do not switch".

`npm run smoke` asserts the contracts that have actually broken in this repo:

- `/api/health` → 200 and `status: "ok"`
- `/` (landing), `/terms`, `/privacy`, `/offline` → 200
- `/manifest.webmanifest` → 200, valid, with a maskable icon
- `/sw.js` → 200
- `/pro` → 307 to sign-in (the auth gate still holds)
- an unknown `/<handle>` → **404**, not the old soft 200
- with `SMOKE_STORE_HANDLE` set: `/<handle>` → 200 and `/store/<handle>` → 308

Both are also safe to run against production after a switch.

---

## 6. Database changes: expand and contract

This is the part blue-green frameworks do not solve for you. Two application
versions — the outgoing one and the incoming one — are simultaneously able to
serve traffic during a switch, and they share **one** database. Therefore:

> **Every migration must work with both the old and the new application code.**

A migration and the code that depends on it are therefore never shipped in the
same release when the change is not purely additive.

### 6.1 The four phases

| Phase | Database change | Application change | Shippable alone? |
|---|---|---|---|
| **1. Expand** | add new column / table / index — nullable, defaulted, additive only | none, or write to *both* old and new | yes |
| **2. Migrate** | backfill existing rows (batched, idempotent) | none | yes |
| **3. Switch** | none | read from new, stop writing to old | yes |
| **4. Contract** | drop the old column / index / constraint | none | yes, *after* the previous release is no longer a rollback target |

### 6.2 Never do these in one step

- **Rename** a column or table. Renaming is a drop plus an add. Old code breaks
  the instant the migration lands, while it is still serving traffic.
- **Drop** a column or table still referenced by the deployed version.
- **Change a type** in place (e.g. `text` → `uuid`, integer → bigint with
  rewrite) while old code reads it.
- **Add `NOT NULL`** without a default to a populated table — the running
  version's inserts start failing immediately.
- **Add a constraint** that existing rows violate; the running version's writes
  start failing.
- **`REVOKE`** a grant the live app still uses. (This bit us before: see
  `docs/05-IMPROVEMENT-PLAN.md` R-04b.)

### 6.3 Worked examples from this repo

The migrations we have shipped follow the additive rule:

- `20261007120000_admin_bootstrap_secure.sql` — inserts an admin row and sets
  `search_path` on functions. **Data + attribute changes only**, no schema change,
  so any running version is unaffected. Safe in one release.
- `20261007130000_plan_lifecycle_and_cleanup.sql` — **expand only**. It adds two
  nullable `timestamptz` columns, a partial index, and a view. No existing
  statement changes meaning, so old and new code both work against it. Safe to
  apply before the code that reads the columns is deployed — which is the
  correct order.
- `20261008140000_store_drafts.sql` — **expand only, and the cleanest example of
  the rule.** It creates one new table (`store_drafts`) with its own owner-only
  RLS policies and one index. It touches no existing table, column, or policy,
  so the previous application version runs unchanged against it: the old code
  never mentions `store_drafts`, and the new code degrades to local-only
  autosave if the table is absent. Schema before code, always.

  It is also the cautionary example for a different rule: **do not hang private
  data off a public table.** `stores` carries a world-readable SELECT policy, so
  the obvious design — a `stores.draft_json` column — would have published
  unpublished merchant work to anyone holding the anon key. A new table with its
  own RLS is what keeps that from happening, and it costs nothing in migration
  safety because it is still purely additive.

By contrast, dropping `stores.handle` once the 6 NULL-handle rows were backfilled
would be a **phase 4** action: it must wait until no deployed version reads it.

### 6.4 Rollback vs migrations

Application rollback does not revert the database. So:

- Roll back **code** freely; the previous version must still work against the
  current schema — that is exactly what §6 guarantees.
- A **bad migration** is corrected forward, with another migration. Write the
  compensating migration *before* you need it.
- Take a database backup/snapshot before any phase 4 (destructive) step. Phases
  1–3 are additive and recoverable by simply not using the new objects.

---

## 7. Release checklist

Copy this into the release issue.

```
[ ] CI green on the commit (typecheck · lint · test · build)
[ ] Migrations: additive only, or split across releases per §6
[ ] Applied migrations to production, verified with a rolled-back probe
[ ] Deployed to the idle environment
[ ] curl /api/health on idle → 200 status:"ok", three times in a row
[ ] npm run smoke -- <idle-url> → 0 failures
[ ] Traffic switched at the router / alias
[ ] npm run smoke -- <public-url> → 0 failures
[ ] Previous environment left warm and unmodified as the rollback target
[ ] Rollback path written down for this release (what to switch, and the one
    command to verify it)
```

---

## 8. Known gaps

Stated plainly so nobody assumes these are handled:

- **No infrastructure is provisioned by this repo.** §3 and §4 describe the
  procedures; setting up two environments, a router, and environment contracts is
  an infrastructure change that must be made deliberately.
- **No automated canary or metric-based rollback.** The switch is manual and
  gated by `/api/health` plus the smoke script. Automatic rollback on error-rate
  would require an error-reporting pipeline (see the error-monitoring item in
  `docs/05-IMPROVEMENT-PLAN.md`).
- **No database staging environment.** Migration rehearsals should run against a
  branch/scratch project, not production. `npm run db:diff` exists for this.
- **Backups and restore drills** are a Supabase-project responsibility and are
  not verified here.
