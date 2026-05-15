-- SOCIAL HUB SCHEMA UPDATE
-- Run this in your Supabase SQL Editor to fix "Posts Not Saving"

-- 1. Add likes and dislikes to store_reviews if they don't exist
ALTER TABLE public.store_reviews 
ADD COLUMN IF NOT EXISTS likes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS dislikes INTEGER DEFAULT 0;

-- 2. Create store_review_comments table
CREATE TABLE IF NOT EXISTS public.store_review_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID REFERENCES public.store_reviews(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE public.store_review_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_reviews ENABLE ROW LEVEL SECURITY;

-- 4. Policies for store_reviews (Ensure they exist)
DROP POLICY IF EXISTS "Allow public insert on store_reviews" ON public.store_reviews;
CREATE POLICY "Allow public insert on store_reviews" 
ON public.store_reviews FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update on store_reviews" ON public.store_reviews;
CREATE POLICY "Allow public update on store_reviews" 
ON public.store_reviews FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public read reviews" ON public.store_reviews;
CREATE POLICY "Public read reviews"
ON public.store_reviews FOR SELECT USING (true);

-- 5. Policies for comments
DROP POLICY IF EXISTS "Allow public select on store_review_comments" ON public.store_review_comments;
CREATE POLICY "Allow public select on store_review_comments" 
ON public.store_review_comments FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert on store_review_comments" ON public.store_review_comments;
CREATE POLICY "Allow public insert on store_review_comments" 
ON public.store_review_comments FOR INSERT WITH CHECK (true);
