-- SQL to set up Dispatch Tracking for SwiftLink Pro
-- Run this in your Supabase SQL Editor

-- VISUAL STORE BUILDER CORE
-- Existing installs can run these safely; new installs should make sure stores exists first.
ALTER TABLE stores
  ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS sections JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS state_json JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS biz_name TEXT,
  ADD COLUMN IF NOT EXISTS store_username TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_stores_owner_id ON stores(owner_id);

ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners can manage their stores" ON stores;
CREATE POLICY "Owners can manage their stores"
ON stores FOR ALL
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Public can read live stores" ON stores;
CREATE POLICY "Public can read live stores"
ON stores FOR SELECT
USING (true);

create table dispatch_tracking (
  id uuid primary key default gen_random_uuid(),
  tracking_code text unique not null,
  store_id uuid references stores(id),
  driver_name text,
  customer_name text,
  destination text,
  status text default 'pending', -- pending | en_route | delivered
  lat double precision,
  lng double precision,
  updated_at timestamptz default now()
);

-- Enable Row Level Security
alter table dispatch_tracking enable row level security;

-- Anyone can read tracking by code (for customer tracking page)
create policy "Public can read tracking by code"
on dispatch_tracking for select
using (true);

-- Only authenticated store owner can insert/update their own dispatch
create policy "Owner can insert their dispatch"
on dispatch_tracking for insert
with check (auth.uid() = store_id);

create policy "Owner/Driver can update tracking"
on dispatch_tracking for update
using (true); -- Simplified for driver page to work without auth for now

-- USER FEEDBACK & REPORTS
CREATE TABLE user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  store_id UUID REFERENCES stores(id),
  type TEXT NOT NULL, -- 'bug', 'feature', 'general', 'report'
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  upvotes INTEGER DEFAULT 0,
  public_replies JSONB DEFAULT '[]'::jsonb,
  is_public BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert their own feedback" ON user_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ANALYTICS & EVENTS
CREATE TABLE store_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'view', 'product_click', 'whatsapp_checkout'
  product_id BIGINT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE store_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can insert events" ON store_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Owners can view their own events" ON store_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = store_events.store_id
      AND stores.owner_id = auth.uid()
    )
  );

CREATE INDEX idx_events_store_id ON store_events(store_id);
CREATE INDEX idx_events_type ON store_events(event_type);

-- NOTIFICATIONS
CREATE TABLE store_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'message', -- 'order', 'message', 'trend', 'feedback'
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE store_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can manage their own notifications" ON store_notifications 
  FOR ALL USING (auth.uid() = store_id);
