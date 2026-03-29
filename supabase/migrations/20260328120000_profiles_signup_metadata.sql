-- Adds signup metadata columns expected by the app (admin users, registration).
-- Apply once: Supabase Dashboard → SQL → New query → paste → Run.
-- Safe to re-run: uses IF NOT EXISTS.

alter table public.profiles add column if not exists profile_type text;
alter table public.profiles add column if not exists signup_access_type text;
alter table public.profiles add column if not exists signup_plan_key text;
