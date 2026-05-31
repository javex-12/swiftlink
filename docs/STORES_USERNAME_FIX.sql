-- ================================================================
-- STORES TABLE — USERNAME UNIQUENESS & INDEXING (IDEMPOTENT)
-- Run this in your Supabase SQL editor
-- ================================================================

-- 1. Ensure store_username is unique across all stores
--    Using a DO block to prevent "already exists" errors.
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'stores_store_username_key') THEN
        ALTER TABLE public.stores ADD CONSTRAINT stores_store_username_key UNIQUE (store_username);
    END IF;
END $$;

-- 2. Add a Case-Insensitive Index for fast routing
CREATE INDEX IF NOT EXISTS idx_stores_store_username_lower ON public.stores (LOWER(store_username));

-- 3. (Optional) Cleanup: Drop the now-obsolete slugs table
-- DROP TABLE IF EXISTS public.slugs;