-- ================================================================
-- STORES TABLE — MULTI-STORE SCHEMA + RLS FIX
-- Run this in your Supabase SQL editor
-- ================================================================

-- 0. DROP the old FK constraint that ties stores.id to auth.users(id).
--    The original schema had one store per user (store.id = user.id).
--    Now stores use owner_id for the user reference, so id is a free UUID.
ALTER TABLE public.stores DROP CONSTRAINT IF EXISTS stores_id_fkey;
ALTER TABLE public.stores DROP CONSTRAINT IF EXISTS stores_id_key;

-- Also ensure owner_id column exists (in case of old schema)
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 1. Make sure RLS is enabled on the stores table
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

-- 2. Drop ALL possible existing policies on stores (fully idempotent)
DROP POLICY IF EXISTS "Users can view own stores"              ON public.stores;
DROP POLICY IF EXISTS "Users can insert own stores"            ON public.stores;
DROP POLICY IF EXISTS "Users can update own stores"            ON public.stores;
DROP POLICY IF EXISTS "Users can delete own stores"            ON public.stores;
DROP POLICY IF EXISTS "Public can view stores"                 ON public.stores;
DROP POLICY IF EXISTS "Authenticated users can insert"         ON public.stores;
DROP POLICY IF EXISTS "Authenticated users can insert stores"  ON public.stores;
DROP POLICY IF EXISTS "Owner can update"                       ON public.stores;
DROP POLICY IF EXISTS "Owner can update stores"                ON public.stores;
DROP POLICY IF EXISTS "Owner can delete"                       ON public.stores;
DROP POLICY IF EXISTS "Owner can delete stores"                ON public.stores;

-- 3. Allow anyone to read stores (needed for storefront public view)
CREATE POLICY "Public can view stores"
  ON public.stores FOR SELECT
  USING (true);

-- 4. Allow any authenticated user to insert — no limit on number of stores per user
CREATE POLICY "Authenticated users can insert stores"
  ON public.stores FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- 5. Allow owner to update their own stores
CREATE POLICY "Owner can update stores"
  ON public.stores FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- 6. Allow owner to delete their own stores
CREATE POLICY "Owner can delete stores"
  ON public.stores FOR DELETE
  USING (auth.uid() = owner_id);


-- ================================================================
-- SLUGS TABLE — RLS (needed for store username routing)
-- ================================================================

ALTER TABLE public.slugs ENABLE ROW LEVEL SECURITY;

-- Drop all possible existing slugs policies
DROP POLICY IF EXISTS "Public can view slugs"           ON public.slugs;
DROP POLICY IF EXISTS "Authenticated can upsert slugs"  ON public.slugs;
DROP POLICY IF EXISTS "Authenticated can update slugs"  ON public.slugs;
DROP POLICY IF EXISTS "Authenticated can insert slugs"  ON public.slugs;

CREATE POLICY "Public can view slugs"
  ON public.slugs FOR SELECT USING (true);

CREATE POLICY "Authenticated can upsert slugs"
  ON public.slugs FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated can update slugs"
  ON public.slugs FOR UPDATE
  USING (auth.role() = 'authenticated');


-- ================================================================
-- REVIEWS & COMMENTS — unchanged from previous migration
-- ================================================================

ALTER TABLE public.store_reviews          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_review_comments  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read reviews"   ON public.store_reviews;
DROP POLICY IF EXISTS "Auth insert reviews"   ON public.store_reviews;
DROP POLICY IF EXISTS "Owner delete reviews"  ON public.store_reviews;
DROP POLICY IF EXISTS "Public read comments"  ON public.store_review_comments;
DROP POLICY IF EXISTS "Auth insert comments"  ON public.store_review_comments;
DROP POLICY IF EXISTS "Owner delete comments" ON public.store_review_comments;

CREATE POLICY "Public read reviews"
  ON public.store_reviews FOR SELECT USING (true);

CREATE POLICY "Auth insert reviews"
  ON public.store_reviews FOR INSERT WITH CHECK (true);

CREATE POLICY "Owner delete reviews"
  ON public.store_reviews FOR DELETE
  USING (auth.uid() = author_id);

CREATE POLICY "Public read comments"
  ON public.store_review_comments FOR SELECT USING (true);

CREATE POLICY "Auth insert comments"
  ON public.store_review_comments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Owner delete comments"
  ON public.store_review_comments FOR DELETE
  USING (auth.uid() = author_id);
