-- Create the system_admins table
CREATE TABLE IF NOT EXISTS public.system_admins (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.system_admins ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view system_admins (so clients can query if they are admin)
DROP POLICY IF EXISTS "Authenticated users can view system_admins" ON public.system_admins;
CREATE POLICY "Authenticated users can view system_admins"
  ON public.system_admins FOR SELECT
  USING (auth.role() = 'authenticated');

-- Create trigger function to automatically promote admin@swiftlink.pro to system_admins on registration
CREATE OR REPLACE FUNCTION public.auto_register_system_admins()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.email = 'admin@swiftlink.pro' THEN
    INSERT INTO public.system_admins (id, email)
    VALUES (NEW.id, NEW.email)
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_auto_register_system_admins ON auth.users;
CREATE TRIGGER tr_auto_register_system_admins
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_register_system_admins();

-- Create a helper function to identify if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.system_admins WHERE id = user_id
    );
END;
$$;

-- Allow admins to manage (insert/delete) other admins
DROP POLICY IF EXISTS "Admins can manage system_admins" ON public.system_admins;
CREATE POLICY "Admins can manage system_admins"
  ON public.system_admins FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- 1. STORES TABLE ADMINISTRATIVE POLICIES
-- Allow admin users to SELECT all stores (already public, but good for completeness)
DROP POLICY IF EXISTS "Admins can manage all stores" ON public.stores;
CREATE POLICY "Admins can manage all stores"
ON public.stores
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- 2. STORE EVENTS ADMINISTRATIVE POLICIES
-- Allow admin users to view all store events for system-wide activity monitoring
DROP POLICY IF EXISTS "Admins can view all events" ON public.store_events;
CREATE POLICY "Admins can view all events"
ON public.store_events
FOR SELECT
USING (public.is_admin(auth.uid()));

-- 3. USER FEEDBACK ADMINISTRATIVE POLICIES
-- Allow admin users to select and update feedbacks (e.g. change status or add replies)
DROP POLICY IF EXISTS "Admins can manage all feedback" ON public.user_feedback;
CREATE POLICY "Admins can manage all feedback"
ON public.user_feedback
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Public can view feedback" ON public.user_feedback;
CREATE POLICY "Public can view feedback"
ON public.user_feedback
FOR SELECT
USING (true);

-- 4. SOCIAL PROFILES ADMINISTRATIVE POLICIES
-- Allow admin users to update social profiles (such as toggling the is_verified status)
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.social_profiles;
CREATE POLICY "Admins can manage all profiles"
ON public.social_profiles
FOR ALL
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- ================================================================
-- RPC: PROMOTE ADMIN BY EMAIL
-- Used by the Manage Admins panel in the dashboard.
-- Takes an email address, looks up the user UUID from auth.users,
-- and inserts them into system_admins. No UUID required from the client.
-- Only callable by existing admins (RLS on system_admins enforces this).
-- ================================================================

CREATE OR REPLACE FUNCTION public.promote_admin_by_email(target_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_uid uuid;
  clean_email text;
BEGIN
  -- Only allow existing admins to call this
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can promote other users.';
  END IF;

  clean_email := LOWER(TRIM(target_email));

  -- Look up the target user's UUID from auth.users
  SELECT id INTO target_uid
  FROM auth.users
  WHERE LOWER(email) = clean_email
  LIMIT 1;

  IF target_uid IS NULL THEN
    RAISE EXCEPTION 'User with email % not found. They must register on SwiftLink first.', clean_email;
  END IF;

-- Insert into system_admins (skip if already admin)
  INSERT INTO public.system_admins (id, email)
  VALUES (target_uid, clean_email)
  ON CONFLICT (id) DO NOTHING;

  RETURN true;
END;
$$;

-- ================================================================
-- STORES TABLE: ADD plan AND account_status COLUMNS
-- Run these once. IF NOT EXISTS guards prevent duplicate errors.
-- ================================================================

ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free';
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'active';

-- Backfill plan from state_json for existing rows (safe, idempotent)
UPDATE public.stores
SET plan = COALESCE((state_json->>'plan')::text, 'free')
WHERE plan = 'free' AND state_json->>'plan' IS NOT NULL;

-- ================================================================
-- RPC: SET USER PLAN
-- Admin-only. Updates the plan column on a store.
-- Also mirrors the change into state_json for backward compat.
-- ================================================================

CREATE OR REPLACE FUNCTION public.set_user_plan(store_id_param uuid, new_plan text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can change user plans.';
  END IF;

  IF new_plan NOT IN ('free', 'pro', 'business') THEN
    RAISE EXCEPTION 'Invalid plan: %. Must be free, pro, or business.', new_plan;
  END IF;

  UPDATE public.stores
  SET
    plan = new_plan,
    state_json = jsonb_set(COALESCE(state_json, '{}'::jsonb), '{plan}', to_jsonb(new_plan)),
    updated_at = now()
  WHERE id = store_id_param;

  RETURN FOUND;
END;
$$;

-- ================================================================
-- RPC: SET ACCOUNT STATUS (ban / unban)
-- Admin-only. Updates account_status to 'active' or 'banned'.
-- ================================================================

CREATE OR REPLACE FUNCTION public.set_account_status(store_id_param uuid, new_status text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can change account status.';
  END IF;

  IF new_status NOT IN ('active', 'banned') THEN
    RAISE EXCEPTION 'Invalid status: %. Must be active or banned.', new_status;
  END IF;

  UPDATE public.stores
  SET account_status = new_status, updated_at = now()
  WHERE id = store_id_param;

  RETURN FOUND;
END;
$$;
