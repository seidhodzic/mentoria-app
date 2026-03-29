-- Run once in Supabase → SQL Editor (fixes: column profiles.is_active does not exist)
-- Safe to re-run: IF NOT EXISTS

alter table public.profiles add column if not exists is_active boolean not null default true;
alter table public.profiles add column if not exists stripe_customer_id text;

comment on column public.profiles.is_active is 'Member access flag; subscription checkout + webhook set true for paid signups.';
comment on column public.profiles.stripe_customer_id is 'Stripe Customer ID (cus_…) for billing portal / support.';
