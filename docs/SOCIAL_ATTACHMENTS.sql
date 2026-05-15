-- THE FINAL PIECE: ATTACHMENTS
-- Run this to allow photo sharing in the social hub

ALTER TABLE public.store_reviews 
ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- Ensure social_profiles has public read access
ALTER TABLE public.social_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public can read profiles" ON public.social_profiles;
CREATE POLICY "Public can read profiles" ON public.social_profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.social_profiles;
CREATE POLICY "Users can update their own profile" ON public.social_profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.social_profiles;
CREATE POLICY "Users can insert their own profile" ON public.social_profiles FOR INSERT WITH CHECK (auth.uid() = id);
