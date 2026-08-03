-- SwiftLink Pro — Live Dispatch Tracking schema (logistics)
-- Run in Supabase SQL editor. Safe to re-run (IF NOT EXISTS / additive columns).

CREATE TABLE IF NOT EXISTS public.dispatch_tracking (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tracking_code text NOT NULL UNIQUE,
    store_id uuid,
    driver_name text,
    customer_name text,
    customer_phone text,
    item_name text,
    waybill text,
    destination text,
    dest_lat double precision,
    dest_lng double precision,
    status text DEFAULT 'pending',
    lat double precision,
    lng double precision,
    heading double precision,
    speed double precision,
    accuracy double precision,
    delivery_pin text,
    path jsonb DEFAULT '[]'::jsonb,
    last_ping_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Additive columns for existing installs
ALTER TABLE public.dispatch_tracking ADD COLUMN IF NOT EXISTS customer_phone text;
ALTER TABLE public.dispatch_tracking ADD COLUMN IF NOT EXISTS item_name text;
ALTER TABLE public.dispatch_tracking ADD COLUMN IF NOT EXISTS waybill text;
ALTER TABLE public.dispatch_tracking ADD COLUMN IF NOT EXISTS dest_lat double precision;
ALTER TABLE public.dispatch_tracking ADD COLUMN IF NOT EXISTS dest_lng double precision;
ALTER TABLE public.dispatch_tracking ADD COLUMN IF NOT EXISTS heading double precision;
ALTER TABLE public.dispatch_tracking ADD COLUMN IF NOT EXISTS speed double precision;
ALTER TABLE public.dispatch_tracking ADD COLUMN IF NOT EXISTS accuracy double precision;
ALTER TABLE public.dispatch_tracking ADD COLUMN IF NOT EXISTS driver_phone text;
ALTER TABLE public.dispatch_tracking ADD COLUMN IF NOT EXISTS driver_vehicle text;
ALTER TABLE public.dispatch_tracking ADD COLUMN IF NOT EXISTS delivery_pin text;
ALTER TABLE public.dispatch_tracking ADD COLUMN IF NOT EXISTS path jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.dispatch_tracking ADD COLUMN IF NOT EXISTS last_ping_at timestamp with time zone;
ALTER TABLE public.dispatch_tracking ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dispatch_tracking_code ON public.dispatch_tracking (tracking_code);
CREATE INDEX IF NOT EXISTS idx_dispatch_tracking_store ON public.dispatch_tracking (store_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_tracking_updated ON public.dispatch_tracking (updated_at DESC);

-- RLS
ALTER TABLE public.dispatch_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read tracking" ON public.dispatch_tracking;
DROP POLICY IF EXISTS "Public upsert tracking location" ON public.dispatch_tracking;
DROP POLICY IF EXISTS "Public can read tracking by code" ON public.dispatch_tracking;
DROP POLICY IF EXISTS "Owner can insert their dispatch" ON public.dispatch_tracking;
DROP POLICY IF EXISTS "Owner/Driver can update tracking" ON public.dispatch_tracking;

-- Customers need unauthenticated read by tracking link
CREATE POLICY "Public read tracking"
    ON public.dispatch_tracking FOR SELECT
    USING (true);

-- Drivers share GPS without auth; merchants insert rows when logged in
CREATE POLICY "Public upsert tracking location"
    ON public.dispatch_tracking FOR ALL
    USING (true)
    WITH CHECK (true);

-- Realtime (ignore error if already added)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.dispatch_tracking;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
