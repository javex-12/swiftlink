-- ============================================================================
-- Fix Supabase Advisor Security Lint 0010: security_definer_view
-- ============================================================================
-- `public.public_stores` was created without security_invoker = true, running
-- with the elevated privileges of the view creator (security definer).
--
-- This migration switches the view to security invoker mode so queries respect
-- the querying role's permissions and RLS policies on the underlying `stores` table.
-- ============================================================================

ALTER VIEW public.public_stores
  SET (security_invoker = true);

-- Re-affirm explicit SELECT grant to client roles
GRANT SELECT ON public.public_stores TO anon, authenticated;
