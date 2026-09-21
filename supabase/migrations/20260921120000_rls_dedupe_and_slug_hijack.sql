-- ============================================================================
-- RLS: remove duplicate policies, close the slug-hijack and anon-review-update
-- holes.
--
-- WHY THIS EXISTS
--
-- The schema was built by hand from fourteen loose SQL files in `docs/`
-- (SUPABASE_SETUP.sql, SOCIAL_*.sql x11, store_reviews.sql, ADMIN_SETUP.sql) with
-- no ordering and no migration tool. Each file added policies without removing
-- the previous attempt, and this migration was written against the **actual**
-- remote state rather than against those files, which no longer describe reality.
--
-- The important consequence, and the reason this is not mere tidiness:
--
--     Postgres ORs policies of the same command together.
--
-- So a leftover `USING (true)` policy makes every narrower policy sitting beside
-- it meaningless. That is what happened here - see `stores` and `slugs` below,
-- where three overlapping permissive SELECT policies made the narrower ones
-- decorative. Consolidation is a security control, not housekeeping.
--
-- SCOPE
--
-- Only changes that are a genuine no-op for legitimate traffic, plus two holes
-- that cannot be justified by any caller:
--   * `slugs`: any authenticated user could rewrite any store's handle.
--   * `store_reviews`: anyone at all could rewrite any review's text.
-- The anonymous-write policies on reviews, comments, events and feedback are
-- deliberately NOT touched here: whether a storefront visitor may post a review
-- without an account is a product decision tied to rebuilding reviews on verified
-- orders (docs/00-AUDIT.md F-03, P2). Changing them unilaterally would break
-- features rather than secure them.
--
-- Verified before writing: `dispatch_tracking` (5 rows) and `delivery_receipts`
-- (0 rows) are dropped separately; `system_admins` has 2 rows; `stores` 16.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- stores
-- ---------------------------------------------------------------------------

-- Three identical `USING (true)` SELECT policies. Keep one, named for its intent.
DROP POLICY IF EXISTS "Public Read Access"        ON public.stores;
DROP POLICY IF EXISTS "Public can read live stores" ON public.stores;

-- Dead policy: compares a *user* id to a *store* id, so it can never be true.
-- The same class of bug as the original dispatch insert policy (F-02). Write
-- access is unaffected because "Owners can manage their stores" covers it.
DROP POLICY IF EXISTS "Owner Write Access" ON public.stores;

-- ---------------------------------------------------------------------------
-- slugs
-- ---------------------------------------------------------------------------

-- Two duplicate permissive SELECT policies; "Public can view slugs" remains.
DROP POLICY IF EXISTS "Public Slug Read"  ON public.slugs;
DROP POLICY IF EXISTS "Public can read slugs" ON public.slugs;

-- THE HOLE. `USING (auth.role() = 'authenticated')` with no ownership predicate
-- lets any signed-in user rewrite any merchant's handle. `slug` is the table's
-- primary key, so this is both storefront hijacking and a denial-of-service on
-- the victim's existing link. Legitimate owners keep access through the
-- ownership-correlated "Owners can manage their slugs" policy.
DROP POLICY IF EXISTS "Authenticated can update slugs" ON public.slugs;

-- Same predicate on INSERT: any authenticated user could claim an unclaimed
-- handle. Also redundant with the ownership-correlated policy.
DROP POLICY IF EXISTS "Authenticated can upsert slugs" ON public.slugs;

-- ---------------------------------------------------------------------------
-- store_reviews
-- ---------------------------------------------------------------------------

-- `USING (true)` with no WITH CHECK: visitors could rewrite the text of any
-- review on any merchant's storefront via PATCH /rest/v1/store_reviews?id=eq.<x>.
-- Replaced with an author-scoped policy so nothing legitimate is lost.
DROP POLICY IF EXISTS "Allow public update on store_reviews" ON public.store_reviews;
DROP POLICY IF EXISTS "Authors can update own reviews"      ON public.store_reviews;

CREATE POLICY "Authors can update own reviews"
  ON public.store_reviews FOR UPDATE
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Three byte-identical INSERT policies. Keep "Auth insert reviews" as the single
-- known name and drop the two copies; the effective permission (OR of the three)
-- is unchanged.
DROP POLICY IF EXISTS "Allow public insert on store_reviews" ON public.store_reviews;
DROP POLICY IF EXISTS "Anyone can post review"              ON public.store_reviews;

-- ---------------------------------------------------------------------------
-- store_review_comments
-- ---------------------------------------------------------------------------

-- Two identical `WITH CHECK (true)` INSERT policies; the third is a strict subset
-- of them under OR semantics, so one copy is all that can ever matter.
DROP POLICY IF EXISTS "Allow public insert on store_review_comments" ON public.store_review_comments;
DROP POLICY IF EXISTS "Anyone can post comment"                      ON public.store_review_comments;

-- ---------------------------------------------------------------------------
-- user_feedback
-- ---------------------------------------------------------------------------

-- Two identical `WITH CHECK (auth.uid() = user_id)` INSERT policies.
DROP POLICY IF EXISTS "Users can insert own feedback" ON public.user_feedback;

-- ---------------------------------------------------------------------------
-- system_admins
-- ---------------------------------------------------------------------------

-- Let any signed-in user enumerate the platform's administrators. Admins keep
-- read access through "Admins can manage system_admins".
DROP POLICY IF EXISTS "Authenticated users can view system_admins" ON public.system_admins;

-- ============================================================================
-- NOT CHANGED HERE, AND WHY (tracked in docs/00-AUDIT.md + 04-SUPABASE-WORKFLOW.md)
--
--   store_reviews / store_review_comments anonymous INSERT (WITH CHECK true)
--     -> whether a visitor may review without an account is a product decision;
--        the fix is an insert policy tied to a verified order (P2).
--   store_events "Public can insert events" (WITH CHECK true)
--     -> storefront analytics are legitimately anonymous; needs rate limiting,
--        not a policy change (P2, Upstash-class limiter).
--   social_notifications "System/Users can insert notifications" (true)
--     -> any authenticated user can insert a notification for any other user.
--        The social module is rebuilt in P3; fixing it now would be rework.
--   user_feedback "Public can view feedback" (USING true)
--     -> all merchant feedback is world-readable, including user ids. Needs the
--        admin-only read plus an owner read, reviewed with the feedback feature.
--   stores "Public can view stores" (USING true)
--     -> docs/00-AUDIT.md F-04. Locking this down requires `store_settings` to
--        exist first and the anonymous read path to move to a projection view,
--        or every live storefront breaks. Sequence is in docs/04-SUPABASE-WORKFLOW.md §5.
-- ============================================================================
