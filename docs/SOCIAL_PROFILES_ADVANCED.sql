-- ADVANCED PROFILE FEATURES
-- Run this to allow bio, cover photos and verified status

ALTER TABLE public.social_profiles 
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS cover_url TEXT,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Policy to allow users to update their own advanced profile fields
DROP POLICY IF EXISTS "Users can update their own profile" ON public.social_profiles;
CREATE POLICY "Users can update their own profile" ON public.social_profiles FOR UPDATE USING (auth.uid() = id);
