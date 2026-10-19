-- Subscription billing (Paystack), as the account's source of truth.
--
-- Until now there was no paid tier at all: `stores.plan` existed, the admin
-- console could set it, and nothing else ever wrote it. `account_subscriptions`
-- records what was actually bought, so the answer to "which plan am I on" no
-- longer depends on a row an administrator typed, and a cancelled subscription
-- has somewhere to say so.
--
-- One subscription per account (`owner_id` is the primary key): plans are sold
-- per account, not per store, and `get_account_entitlement` widens the answer to
-- every store the account owns.
--
-- Money is stored in **minor units** (kobo), exactly as Paystack reports it, so
-- no rounding happens between the provider and the record.

create table if not exists public.account_subscriptions (
  owner_id uuid primary key references auth.users (id) on delete cascade,
  plan text not null check (plan in ('pro', 'business')),
  status text not null default 'active'
    check (status in ('active', 'past_due', 'cancelled', 'complete')),
  provider text not null default 'paystack',
  provider_subscription_code text,
  provider_customer_code text,
  provider_email_token text,
  amount integer,
  currency text not null default 'NGN',
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.account_subscriptions is
  'The account''s paid plan, written only by the Paystack routes (service role). Entitlements read this before stores.plan; see get_account_entitlement.';

alter table public.account_subscriptions enable row level security;

-- A merchant may read their own subscription (the Settings screen shows its
-- state). There is deliberately no insert/update/delete policy: a plan is written
-- by a verified webhook or by the verified-transaction check, both of which use
-- the service role. A client that could write here could grant itself Business.
drop policy if exists "Owners can read their subscription" on public.account_subscriptions;
create policy "Owners can read their subscription"
  on public.account_subscriptions
  for select
  using (auth.uid() = owner_id);

-- Webhook deliveries are retried by Paystack, and the same `charge.success` can
-- arrive more than once. The primary key is the idempotency key: a duplicate
-- insert is a no-op, so a merchant cannot be charged twice into two upgrades,
-- and an event that failed halfway can be inspected afterwards.
create table if not exists public.payment_events (
  id text primary key,
  type text not null,
  owner_id uuid,
  payload jsonb not null,
  received_at timestamptz not null default now()
);

comment on table public.payment_events is
  'Idempotency log for provider webhooks (key = event type + reference/code). Service role only: RLS is enabled with no policies.';

alter table public.payment_events enable row level security;

create index if not exists payment_events_owner_idx on public.payment_events (owner_id, received_at desc);

/*
 * Entitlement, now including what was actually bought.
 *
 * Order of authority:
 *   1. an active (or past-due, still inside the grace period) subscription,
 *   2. an administrator of this deployment (Business),
 *   3. the most privileged plan among the stores the account owns.
 *
 * `past_due` keeps the paid tier on purpose: the 7-day grace period in
 * lib/plans.ts means a failed renewal does not remove features immediately, and
 * the webhook is what downgrades once that window passes.
 */
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
  ),
  sub as (
    select s.plan
    from public.account_subscriptions s, me
    where s.owner_id = me.uid
      and s.status in ('active', 'past_due')
    limit 1
  )
  select
    coalesce(
      (select plan from sub),
      case
        when (select is_admin from admin) then 'business'
        else coalesce(
          (
            select case max(
                          case st.plan
                            when 'business' then 2
                            when 'pro' then 1
                            else 0
                          end
                        )
                     when 2 then 'business'
                     when 1 then 'pro'
                     else 'free'
                   end
            from public.stores st, me
            where st.owner_id = me.uid
          ),
          'free'
        )
      end
    ) as plan,
    (select is_admin from admin) as is_admin;
$$;

/*
 * Only signed-in callers may ask. Anonymous visitors have no subscription and no
 * stores, so the answer would always be `free, false` — there is nothing to gain,
 * and a public endpoint that reports whether a given deployment has admins is
 * information best not volunteered.
 */
revoke all on function public.get_account_entitlement() from public;
revoke all on function public.get_account_entitlement() from anon;
grant execute on function public.get_account_entitlement() to authenticated;
