-- SOCIAL ACTIVITY & NOTIFICATIONS
-- Run this to enable real-time notifications for vibes and comments

CREATE TABLE IF NOT EXISTS public.social_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Target user
  actor_id UUID REFERENCES auth.users(id), -- Source user
  type TEXT NOT NULL, -- 'vibe', 'comment', 'mention'
  post_id UUID REFERENCES public.store_reviews(id) ON DELETE CASCADE,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.social_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own notifications" 
ON public.social_notifications FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "System/Users can insert notifications" 
ON public.social_notifications FOR INSERT 
WITH CHECK (true);
