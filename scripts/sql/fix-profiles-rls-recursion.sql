-- One-off fix: "infinite recursion detected in policy for relation profiles"
-- Run in Supabase SQL Editor (Dashboard → SQL).
-- Cause: profiles_select_active_users_for_mentor_or_admin subqueried public.profiles,
--        re-entering RLS on the same table.

create or replace function public.auth_is_mentor_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('mentor', 'admin')
  );
$$;

grant execute on function public.auth_is_mentor_or_admin() to authenticated;

drop policy if exists "profiles_select_active_users_for_mentor_or_admin" on public.profiles;

create policy "profiles_select_active_users_for_mentor_or_admin"
  on public.profiles for select
  using (
    (select public.auth_is_mentor_or_admin())
    and role = 'user'
    and status = 'active'
  );
