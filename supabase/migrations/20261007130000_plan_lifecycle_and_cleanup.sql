-- Plan lifecycle: failed-payment grace period + inactivity-cleanup exclusion.
--
-- Policy (confirmed with the owner):
--   * A failed card payment must never delete anything. The store keeps its
--     full entitlements for a grace window (7 days, `GRACE_PERIOD_DAYS` in
--     `lib/plans.ts`) while reminder emails go out.
--   * Only after the grace window closes does a lapse get recorded and the plan
--     get reduced — and reducing a plan still never deletes: over-limit products
--     are hidden (`state_json.products[].visible = false`) and extra stores are
--     unpublished (`state_json.isLive = false`).
--   * A store whose plan has lapsed must be **excluded** from any inactivity
--     cleanup, so a billing problem can never turn into data loss.
--
-- There is no cleanup job in the codebase today (`cron.job` does not exist on
-- this project). The view below is the contract such a job must read from, and
-- it mirrors the `isCleanupEligible` predicate in `lib/plans.ts` exactly.

ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS plan_grace_until timestamptz,
  ADD COLUMN IF NOT EXISTS plan_lapsed_at timestamptz;

COMMENT ON COLUMN public.stores.plan_grace_until IS
  'When a failed payment puts the store in grace, the moment the grace window ends. Non-null only while a grace window is set. '
  'Set by the billing provider webhook; entitlements are unchanged until it passes. See GRACE_PERIOD_DAYS in lib/plans.ts.';

COMMENT ON COLUMN public.stores.plan_lapsed_at IS
  'Set once the grace window has expired and the plan was reduced. A non-null value permanently opts the store out of inactivity cleanup.';

-- Index the cleanup predicate so a future sweeper can find candidates without a
-- sequential scan over every store. `now()` is STABLE, not IMMUTABLE, so it
-- cannot appear in an index predicate — the grace comparison lives in the view.
CREATE INDEX IF NOT EXISTS idx_stores_cleanup_candidates
  ON public.stores (updated_at)
  WHERE plan_lapsed_at IS NULL;

-- The store ids an inactivity-cleanup job may consider.
--
-- Excluded: stores currently inside a grace window (too early to touch a
-- possibly-paying customer) and stores that have already lapsed (never punish a
-- billing failure with data loss).
--
-- `security_invoker = true` so the view evaluates the caller's RLS on `stores`
-- rather than the view owner's. Access is denied to `anon` and `authenticated`:
-- a cleanup job runs with the service role.
CREATE OR REPLACE VIEW public.cleanup_eligible_stores
WITH (security_invoker = true) AS
SELECT s.id, s.owner_id, s.updated_at
FROM public.stores s
WHERE s.plan_lapsed_at IS NULL
  AND (s.plan_grace_until IS NULL OR s.plan_grace_until <= now());

COMMENT ON VIEW public.cleanup_eligible_stores IS
  'Stores a future inactivity-cleanup job may sweep. Mirrors isCleanupEligible() in lib/plans.ts: excludes stores in a payment grace window and stores whose plan has lapsed.';

REVOKE ALL ON public.cleanup_eligible_stores FROM anon, authenticated;
GRANT SELECT ON public.cleanup_eligible_stores TO service_role;
