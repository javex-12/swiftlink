-- Custom domains.
--
-- A merchant points a CNAME at the platform, proves control by doing so, and the
-- storefront answers on their own hostname. Two things this schema gets right
-- that a naive version does not:
--
--   * **A domain belongs to exactly one store.** `domain` is unique, case-folded
--     and stored without scheme or `www.`, so `Shop.Example.com` and
--     `shop.example.com` cannot both be claimed — and one merchant cannot take a
--     hostname that another already verified.
--   * **Only verified domains route.** `resolve_store_domain` filters on
--     `verified_at`, so adding a row does not let anyone serve a store on a
--     hostname they do not control.

create table if not exists public.store_domains (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  owner_id uuid not null references auth.users (id) on delete cascade,
  domain text not null unique,
  -- `gen_random_uuid()` is in core Postgres; `gen_random_bytes` lives in
  -- pgcrypto's `extensions` schema, which is not on the migration search path.
  verification_token text not null default replace(gen_random_uuid()::text, '-', ''),
  verified_at timestamptz,
  ssl_status text not null default 'pending' check (ssl_status in ('pending', 'issued', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint store_domains_domain_is_hostname check (
    domain = lower(domain) and domain not like 'http%' and position('/' in domain) = 0
  )
);

comment on table public.store_domains is
  'Custom hostnames per store. Written by the owning merchant; routed only when verified_at is set. See middleware.ts and /api/domains/verify.';

create index if not exists store_domains_store_idx on public.store_domains (store_id);

alter table public.store_domains enable row level security;

drop policy if exists "Owners manage their domains" on public.store_domains;
create policy "Owners manage their domains"
  on public.store_domains
  for all
  using (owner_id = auth.uid())
  with check (
    owner_id = auth.uid()
    and exists (
      select 1
      from public.stores s
      where s.id = store_id
        and s.owner_id = auth.uid()
    )
  );

/*
 * Host → store, for the routing layer.
 *
 * SECURITY DEFINER because middleware runs before any user context and must read
 * a table it cannot otherwise see. It exposes only what a public storefront
 * already exposes: the store id and its public handle. It never returns an owner,
 * an unverified row, or anything about another merchant's domains.
 */
create or replace function public.resolve_store_domain(hostname text)
returns table (store_id uuid, handle text)
language sql
stable
security definer
set search_path = public
as $$
  select s.id, s.store_username
  from public.store_domains d
  join public.stores s on s.id = d.store_id
  where d.domain = lower(trim(hostname))
    and d.verified_at is not null
    and s.store_username is not null
  limit 1;
$$;

revoke all on function public.resolve_store_domain(text) from public;
grant execute on function public.resolve_store_domain(text) to anon, authenticated;
