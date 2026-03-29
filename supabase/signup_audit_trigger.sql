-- Optional: audit trail when a row is inserted into auth.users.
-- Run in the Supabase SQL editor after creating your project.
-- This does not send email by itself; pair with Dashboard → Database → Webhooks (auth.users INSERT → Edge Function)
-- if you want fully DB-driven notifications.

create table if not exists public.signup_audit (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

alter table public.signup_audit enable row level security;

-- No policies: only service role / dashboard can read (adjust if you add an admin policy).

create or replace function public.audit_auth_user_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.signup_audit (user_id, email)
  values (new.id, new.email)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_signup_audit on auth.users;
create trigger on_auth_user_signup_audit
  after insert on auth.users
  for each row execute procedure public.audit_auth_user_insert();
