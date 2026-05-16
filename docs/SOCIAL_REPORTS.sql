-- SOCIAL REPORTING SYSTEM
-- For the 'Talk' / Support tab

CREATE TABLE IF NOT EXISTS public.social_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'bug', 'idea', 'vibe', 'safety'
  content TEXT NOT NULL,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.social_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can see their own reports" 
ON public.social_reports FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can submit reports" 
ON public.social_reports FOR INSERT 
WITH CHECK (auth.uid() = user_id);
