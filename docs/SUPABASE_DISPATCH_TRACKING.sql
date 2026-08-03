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
-- Handoff proof columns (written when customer confirms receipt)
ALTER TABLE public.dispatch_tracking ADD COLUMN IF NOT EXISTS handoff_lat double precision;
ALTER TABLE public.dispatch_tracking ADD COLUMN IF NOT EXISTS handoff_lng double precision;
ALTER TABLE public.dispatch_tracking ADD COLUMN IF NOT EXISTS handoff_at timestamp with time zone;
ALTER TABLE public.dispatch_tracking ADD COLUMN IF NOT EXISTS handoff_accuracy double precision;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_dispatch_tracking_code    ON public.dispatch_tracking (tracking_code);
CREATE INDEX IF NOT EXISTS idx_dispatch_tracking_store   ON public.dispatch_tracking (store_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_tracking_updated ON public.dispatch_tracking (updated_at DESC);

-- ─── DELIVERY RECEIPTS — IMMUTABLE TRUST LEDGER ───────────────────────────────
-- Written ONCE on successful PIN-verified handoff. Nobody can UPDATE or DELETE.
-- This is the court-admissible proof of delivery.
CREATE TABLE IF NOT EXISTS public.delivery_receipts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    receipt_ref text NOT NULL UNIQUE,       -- e.g. RC-20260803-X7K2M
    tracking_code text NOT NULL,
    store_id uuid,
    merchant_name text,
    driver_name text,
    driver_phone text,
    customer_name text,
    customer_phone text,
    item_name text,
    waybill text,
    destination text,
    -- Handoff proof
    verification_method text DEFAULT 'PIN_VERIFIED', -- PIN_VERIFIED | FORCE_COMPLETED
    handoff_lat double precision,
    handoff_lng double precision,
    handoff_accuracy_m double precision,
    handoff_at timestamp with time zone NOT NULL,
    -- Driver GPS at time of mark-delivered
    driver_final_lat double precision,
    driver_final_lng double precision,
    driver_handoff_distance_m double precision,  -- distance between driver & destination
    gps_within_radius boolean,                   -- true if driver was within 300m of dest
    full_path_snapshot jsonb DEFAULT '[]'::jsonb, -- full breadcrumb trail
    -- Dispute tracking
    dispute_status text DEFAULT 'none', -- none | raised | resolved_sender | resolved_customer
    dispute_notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_receipts_tracking_code ON public.delivery_receipts (tracking_code);
CREATE INDEX IF NOT EXISTS idx_receipts_store_id      ON public.delivery_receipts (store_id);
CREATE INDEX IF NOT EXISTS idx_receipts_ref           ON public.delivery_receipts (receipt_ref);

-- RLS
ALTER TABLE public.dispatch_tracking ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read tracking"             ON public.dispatch_tracking;
DROP POLICY IF EXISTS "Public upsert tracking location"  ON public.dispatch_tracking;
DROP POLICY IF EXISTS "Public can read tracking by code" ON public.dispatch_tracking;
DROP POLICY IF EXISTS "Owner can insert their dispatch"  ON public.dispatch_tracking;
DROP POLICY IF EXISTS "Owner/Driver can update tracking" ON public.dispatch_tracking;

CREATE POLICY "Public read tracking"
    ON public.dispatch_tracking FOR SELECT USING (true);

CREATE POLICY "Public upsert tracking location"
    ON public.dispatch_tracking FOR ALL USING (true) WITH CHECK (true);

-- delivery_receipts: append-only (no UPDATE/DELETE policies = nobody can modify)
ALTER TABLE public.delivery_receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can insert receipt"    ON public.delivery_receipts;
DROP POLICY IF EXISTS "Public read receipts by code" ON public.delivery_receipts;

CREATE POLICY "Anyone can insert receipt"
    ON public.delivery_receipts FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read receipts by code"
    ON public.delivery_receipts FOR SELECT USING (true);

-- Realtime
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.dispatch_tracking;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
