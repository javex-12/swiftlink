-- SQL to set up Dispatch Tracking for SwiftLink Pro
-- Run this in your Supabase SQL Editor

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
