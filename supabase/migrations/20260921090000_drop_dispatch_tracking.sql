-- =============================================================
-- Drop the dispatch / logistics tracking schema
-- Decided in docs/03-DECISIONS.md (D3) — the feature is removed
-- from the product, so its tables go with it.
--
-- DESTRUCTIVE: this deletes all dispatch history. Take a backup
-- (`supabase db dump`) before running against production.
--
-- Replaces docs/SUPABASE_DISPATCH_TRACKING.sql (deleted). This is
-- the first file in the new `supabase/migrations` history that will
-- take over from the loose SQL scripts in docs/ (see audit §3).
-- =============================================================

-- Policies first, so the migration is re-runnable on partially
-- applied environments.
DROP POLICY IF EXISTS "Public can read tracking by code"   ON public.dispatch_tracking;
DROP POLICY IF EXISTS "Owner can insert their dispatch"    ON public.dispatch_tracking;
DROP POLICY IF EXISTS "Owner/Driver can update tracking"   ON public.dispatch_tracking;

DROP TABLE IF EXISTS public.dispatch_tracking;
DROP TABLE IF EXISTS public.delivery_receipts;

-- The remaining unsafe policies flagged in docs/00-AUDIT.md (F-02…F-05)
-- are rewritten in the next migration, not this one.
