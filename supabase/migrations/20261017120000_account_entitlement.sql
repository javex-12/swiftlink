-- Account entitlement, resolved on the server.
--
-- Why this exists: the console derived the merchant's plan from `stores.plan` in
-- the browser, and then *also* upgraded the local state to 'business' for
-- administrators (`checkAdminStatus`). Both paths wrote the same field, so the
-- two disagreed on every load: the admin override painted "Business" for a
-- moment and `fetchStores` immediately replaced it with the row's real value,
-- which is 'free' for every non-subscriber. Merchants saw a plan badge that
-- flicked to their real tier and back, and admins were silently capped at the
-- free tier's six products.
--
-- Deciding it here instead gives the browser one answer, computed from the same
-- data for every caller:
--
--   * an administrator of *this* deployment is entitled to Business (the
--     previous client-side rule, moved where it cannot be overwritten), and
--   * everyone else gets the most privileged plan among the stores they own,
--     matching `accountPlanFor` in lib/plans.ts.
--
-- SECURITY DEFINER because `system_admins` is not readable by ordinary users —
-- that is the whole point of the first bullet. It exposes one boolean about the
-- *caller* and nothing about anyone else, and an anonymous caller (`auth.uid()`
-- is null) always gets `free, false`.

create or replace function public.get_account_entitlement()
returns table (plan text, is_admin boolean)
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select auth.uid() as uid
  ),
  admin as (
    select exists (
      select 1
      from public.system_admins a, me
      where a.id = me.uid
    ) as is_admin
  )
  select
    case
      when (select is_admin from admin) then 'business'
      else coalesce(
        (
          select case max(
                        case s.plan
                          when 'business' then 2
                          when 'pro' then 1
                          else 0
                        end
                      )
                   when 2 then 'business'
                   when 1 then 'pro'
                   else 'free'
                 end
          from public.stores s, me
          where s.owner_id = me.uid
        ),
        'free'
      )
    end as plan,
    (select is_admin from admin) as is_admin;
$$;

comment on function public.get_account_entitlement() is
  'The signed-in account''s effective plan: business for a system administrator, otherwise the most privileged plan among the stores it owns. Read by the console instead of trusting one store row. See lib/plans.ts.';

revoke all on function public.get_account_entitlement() from public;
grant execute on function public.get_account_entitlement() to authenticated;
