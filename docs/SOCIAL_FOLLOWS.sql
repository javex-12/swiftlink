-- SOCIAL FOLLOW SYSTEM
-- Run this to allow users to follow stores and other creators

CREATE TABLE IF NOT EXISTS public.social_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Can be a store owner or another user
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id)
);

-- RLS
ALTER TABLE public.social_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can see follow counts" 
ON public.social_follows FOR SELECT 
USING (true);

CREATE POLICY "Users can manage their follows" 
ON public.social_follows FOR ALL 
USING (auth.uid() = follower_id);
