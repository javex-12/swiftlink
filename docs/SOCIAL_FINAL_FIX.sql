-- BULLETPROOF SOCIAL SCHEMA
-- This ensures store_id can be ANY string (UUID or Slug) to prevent "not saving" errors

-- 1. Alter store_id to TEXT for flexibility
ALTER TABLE public.store_reviews ALTER COLUMN store_id TYPE TEXT;

-- 2. Add some 'Social App' metadata
ALTER TABLE public.store_reviews 
ADD COLUMN IF NOT EXISTS author_avatar TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT false;

-- 3. Ensure comments also use TEXT for consistency if needed (though review_id is internal UUID)
-- No changes needed to comments id/review_id as they are system-generated UUIDs.

-- 4. Re-verify policies
DROP POLICY IF EXISTS "Allow public insert on store_reviews" ON public.store_reviews;
CREATE POLICY "Allow public insert on store_reviews" ON public.store_reviews FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow public update on store_reviews" ON public.store_reviews;
CREATE POLICY "Allow public update on store_reviews" ON public.store_reviews FOR UPDATE USING (true);
