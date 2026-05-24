-- ================================================================
-- PART 1 — Run this block FIRST, then run PART 2 below
-- ================================================================

-- Add author_id to store_reviews if missing
ALTER TABLE public.store_reviews
  ADD COLUMN IF NOT EXISTS author_id uuid;

-- Create comments table
CREATE TABLE IF NOT EXISTS public.store_review_comments (
  id          uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id   uuid         NOT NULL REFERENCES public.store_reviews(id) ON DELETE CASCADE,
  store_id    text,
  author_name text         NOT NULL DEFAULT 'Store Owner',
  author_id   uuid,
  message     text         NOT NULL,
  created_at  timestamptz  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_src_review_id
  ON public.store_review_comments(review_id);

-- Enable RLS
ALTER TABLE public.store_reviews          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_review_comments  ENABLE ROW LEVEL SECURITY;


-- ================================================================
-- PART 2 — ONLY run this AFTER Part 1 succeeds
-- ================================================================

-- Clean up any old/broken policies first
DROP POLICY IF EXISTS "Public read reviews"   ON public.store_reviews;
DROP POLICY IF EXISTS "Auth insert reviews"   ON public.store_reviews;
DROP POLICY IF EXISTS "Owner delete reviews"  ON public.store_reviews;
DROP POLICY IF EXISTS "Public read comments"  ON public.store_review_comments;
DROP POLICY IF EXISTS "Auth insert comments"  ON public.store_review_comments;
DROP POLICY IF EXISTS "Owner delete comments" ON public.store_review_comments;

-- store_reviews policies
CREATE POLICY "Public read reviews"
  ON public.store_reviews FOR SELECT USING (true);

CREATE POLICY "Auth insert reviews"
  ON public.store_reviews FOR INSERT WITH CHECK (true);

CREATE POLICY "Owner delete reviews"
  ON public.store_reviews FOR DELETE
  USING (auth.uid() = author_id);

-- store_review_comments policies
CREATE POLICY "Public read comments"
  ON public.store_review_comments FOR SELECT USING (true);

CREATE POLICY "Auth insert comments"
  ON public.store_review_comments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Owner delete comments"
  ON public.store_review_comments FOR DELETE
  USING (auth.uid() = author_id);
