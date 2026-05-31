-- ================================================================
-- STORES TABLE — USERNAME UNIQUENESS & INDEXING
-- Run this in your Supabase SQL editor
-- ================================================================

-- 1. Ensure store_username is unique across all stores
--    This prevents two people from claiming the same handle.
ALTER TABLE public.stores ADD CONSTRAINT stores_store_username_key UNIQUE (store_username);

-- 2. Add a Case-Insensitive Index for fast routing
--    This makes lookups like /store/MyStore and /store/mystore both work instantly.
CREATE INDEX IF NOT EXISTS idx_stores_store_username_lower ON public.stores (LOWER(store_username));

-- 3. (Optional) Cleanup: Drop the now-obsolete slugs table
--    WARNING: Only run this if you are sure you no longer need the slugs table.
-- DROP TABLE IF EXISTS public.slugs;
