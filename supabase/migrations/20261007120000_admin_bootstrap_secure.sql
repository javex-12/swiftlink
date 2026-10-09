-- Admin bootstrap + SECURITY DEFINER hardening.
--
-- Why this migration exists
-- -------------------------
-- `system_admins` is the single source of truth for console admin access: the
-- RLS policy on the table is `is_admin(auth.uid())`, so an admin is the only
-- thing that can create another admin. That is deliberately locked — no
-- `authenticated` SELECT, no auto-promotion trigger (`auto_register_system_admins`
-- is a documented no-op). The consequence is a bootstrap problem: the first rows
-- must be inserted by the owner.
--
-- This migration makes the owner's account an admin **by email**, not by a
-- hard-coded UUID, so it is portable across environments and idempotent: running
-- it twice is a no-op, and running it before the user has signed up inserts
-- nothing rather than failing or creating a dangling row.
--
-- `system_admins.id` is a FK to `auth.users(id)` (ON DELETE CASCADE), so the row
-- can only exist for a real account and is cleaned up automatically if the
-- account is deleted.

INSERT INTO public.system_admins (id, email)
SELECT u.id, lower(u.email)
FROM auth.users u
WHERE lower(u.email) = 'michaeldosunmu22@gmail.com'
ON CONFLICT (id) DO NOTHING;

-- Pin `search_path` on the SECURITY DEFINER functions that were missing it.
--
-- A SECURITY DEFINER function runs with the owner's privileges, so a mutable
-- `search_path` is a privilege-escalation foot-gun: an object shadowing
-- `system_admins` in an earlier schema would be resolved instead of the real
-- one. `is_admin` is called from RLS policies on every console request, which
-- makes it the highest-value function to harden. The other three are trigger /
-- helper functions on the same path. `promote_admin_by_email`, `set_user_plan`,
-- `set_account_status` and `transfer_store_by_email` already pin it.

ALTER FUNCTION public.is_admin(uuid) SET search_path = public;
ALTER FUNCTION public.auto_register_system_admins() SET search_path = public;
ALTER FUNCTION public.create_or_update_inquiry(
  uuid, bigint, text, character, integer, text, text, text, text, text
) SET search_path = public;
ALTER FUNCTION public.sync_customer_on_inquiry_insert() SET search_path = public;
ALTER FUNCTION public.sync_customer_on_inquiry_status_change() SET search_path = public;
ALTER FUNCTION public.rollup_inquiry_into_daily_stats() SET search_path = public;
