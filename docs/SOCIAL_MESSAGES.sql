-- SWIFTCHAT: DIRECT MESSAGING SYSTEM
-- Run this to enable private messaging between users

CREATE TABLE IF NOT EXISTS public.social_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.social_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own messages" 
ON public.social_messages FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages" 
ON public.social_messages FOR INSERT 
WITH CHECK (auth.uid() = sender_id);
