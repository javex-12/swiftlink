-- ================================================================
-- ADMINISTRATIVE RLS POLICIES FOR SWIFTLINK PRO
-- Run this in your Supabase SQL Editor to enable admin privileges
-- ================================================================

-- Create a helper function to identify if a user is an admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_email text;
BEGIN
    -- Look up the email of the user from auth.users
    SELECT email INTO user_email FROM auth.users WHERE id = user_id;
    
    -- Admins are users whose email includes 'admin' or matches specific admin emails
    IF user_email IS NOT NULL AND (
        user_email = 'admin@swiftlink.pro' 
        OR LOWER(user_email) LIKE '%admin%'
    ) THEN
        RETURN true;
    END IF;
    
    RETURN false;
END;
$$;

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
