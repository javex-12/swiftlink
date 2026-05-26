-- Migration to create dispatch_tracking table for live driver location sharing

CREATE TABLE IF NOT EXISTS public.dispatch_tracking (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tracking_code text NOT NULL UNIQUE,
    store_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    driver_name text,
    customer_name text,
    destination text,
    status text DEFAULT 'pending',
    lat double precision,
    lng double precision,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security
ALTER TABLE public.dispatch_tracking ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read tracking (customers need to see driver location)
CREATE POLICY "Public read tracking"
    ON public.dispatch_tracking FOR SELECT
    USING (true);

-- Allow anyone to insert/update (drivers upserting their location without auth)
CREATE POLICY "Public upsert tracking location"
    ON public.dispatch_tracking FOR ALL
    USING (true)
    WITH CHECK (true);

-- NOTE: dispatch_tracking is already in the supabase_realtime publication.
-- If you need to re-add it manually, run:
--   ALTER PUBLICATION supabase_realtime ADD TABLE public.dispatch_tracking;

