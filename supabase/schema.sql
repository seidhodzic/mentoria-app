-- Mentoria MVP — full schema aligned with app/features (profiles, courses, sessions, quizzes, materials, storage).
-- Run in the Supabase SQL editor. Service role bypasses RLS; policies below apply to anon + authenticated JWTs.
-- Performance: policies use (select auth.uid()) so the uid is evaluated once per statement (initplan-friendly).

create extension if not exists "pgcrypto";

-- ── Helper: admin check (used in policies) ─────────────────────────────────
create or replace function public.is_admin(uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = uid and p.role = 'admin'
  );
$$;

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

-- ── profiles (id = auth user) ─────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  full_name text,
  role text not null default 'user' check (role in ('user', 'mentor', 'admin')),
  status text not null default 'pending' check (status in ('pending', 'active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists profile_type text;
alter table public.profiles add column if not exists signup_access_type text;
alter table public.profiles add column if not exists signup_plan_key text;

-- ── subscriptions ─────────────────────────────────────────────────────────
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  plan text not null default 'starter',
  stripe_customer_id text,
  stripe_subscription_id text,
  status text not null default 'inactive' check (status in ('trialing', 'active', 'past_due', 'cancelled', 'inactive')),
  current_period_end timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_subscriptions_user_id on public.subscriptions(user_id);

-- ── materials (owner_id = auth user who uploaded) ─────────────────────────
create table if not exists public.materials (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  visibility text not null default 'public',
  owner_id uuid references public.profiles(id) on delete set null,
  file_url text,
  file_name text,
  file_size bigint,
  category text,
  is_premium boolean not null default false,
  target_audience text not null default 'all',
  created_at timestamptz not null default now()
);

-- Migrate legacy column name if present (must run before index on owner_id — existing
-- tables skip CREATE TABLE IF NOT EXISTS, so owner_id may not exist yet)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'materials' and column_name = 'created_by'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'materials' and column_name = 'owner_id'
  ) then
    alter table public.materials rename column created_by to owner_id;
  end if;
end $$;

alter table public.materials add column if not exists owner_id uuid references public.profiles(id) on delete set null;

create index if not exists idx_materials_owner_id on public.materials(owner_id);
alter table public.materials add column if not exists file_url text;
alter table public.materials add column if not exists file_name text;
alter table public.materials add column if not exists file_size bigint;
alter table public.materials add column if not exists category text;
alter table public.materials add column if not exists is_premium boolean;
update public.materials set is_premium = coalesce(is_premium, false) where is_premium is null;
alter table public.materials alter column is_premium set default false;
alter table public.materials alter column is_premium set not null;
alter table public.materials add column if not exists target_audience text not null default 'all';
update public.materials set target_audience = 'all' where target_audience is null;
alter table public.materials drop constraint if exists materials_target_audience_check;
alter table public.materials add constraint materials_target_audience_check
  check (target_audience in (
    'all','player','club','investor','agent','executive','lawyer','coach','student','other'
  ));
alter table public.materials add column if not exists visibility text not null default 'public';
update public.materials set visibility = 'public' where visibility is null;

-- Widen visibility check on existing DBs (add 'public'); safe to re-run.
do $$
declare
  r record;
begin
  for r in
    select c.conname
    from pg_constraint c
    join pg_class t on c.conrelid = t.oid
    join pg_namespace n on t.relnamespace = n.oid
    where n.nspname = 'public'
      and t.relname = 'materials'
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) like '%visibility%'
  loop
    execute format('alter table public.materials drop constraint %I', r.conname);
  end loop;
exception
  when undefined_table then null;
end $$;

-- Legacy: visibility 'all' meant everyone-visible (maps to public before new CHECK)
update public.materials set visibility = 'public' where visibility = 'all';

alter table public.materials add constraint materials_visibility_check
  check (visibility in ('public', 'mentors', 'users', 'admins'));

-- ── quizzes (catalog; optional owner) ───────────────────────────────────────
create table if not exists public.quizzes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  owner_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'quizzes' and column_name = 'created_by'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'quizzes' and column_name = 'owner_id'
  ) then
    alter table public.quizzes rename column created_by to owner_id;
  end if;
end $$;

alter table public.quizzes add column if not exists owner_id uuid references public.profiles(id) on delete set null;

-- ── courses & lessons ─────────────────────────────────────────────────────
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  category text,
  is_published boolean not null default false,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'courses' and column_name = 'created_by'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'courses' and column_name = 'owner_id'
  ) then
    alter table public.courses rename column created_by to owner_id;
  end if;
end $$;

alter table public.courses add column if not exists owner_id uuid references public.profiles(id) on delete cascade;
alter table public.courses add column if not exists category text;
alter table public.courses add column if not exists is_published boolean;
alter table public.courses add column if not exists updated_at timestamptz;
update public.courses set is_published = coalesce(is_published, false) where is_published is null;

create index if not exists idx_courses_owner_id on public.courses(owner_id);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  content text,
  video_url text,
  duration_minutes int,
  sort_order int not null default 0
);

create index if not exists idx_lessons_course_id on public.lessons(course_id);

alter table public.lessons add column if not exists is_premium boolean not null default false;

-- ── progress (per user per lesson) ─────────────────────────────────────────
create table if not exists public.progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);

create index if not exists idx_progress_user_id on public.progress(user_id);

-- ── quiz attempts ─────────────────────────────────────────────────────────
create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  score int not null,
  total int not null,
  answers jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_quiz_attempts_user_id on public.quiz_attempts(user_id);

-- ── sessions & session requests ───────────────────────────────────────────
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  mentor_id uuid not null references public.profiles(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  type text not null default '1on1' check (type in ('1on1', 'group')),
  meet_link text,
  scheduled_at timestamptz not null,
  duration_minutes int not null default 60,
  max_participants int not null default 1,
  notes text,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_sessions_mentor_id on public.sessions(mentor_id);
create index if not exists idx_sessions_user_id on public.sessions(user_id);
create index if not exists idx_sessions_type_status on public.sessions(type, status);

create table if not exists public.session_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  mentor_id uuid references public.profiles(id) on delete set null,
  topic text not null,
  message text,
  preferred_time text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  created_at timestamptz not null default now()
);

create index if not exists idx_session_requests_user_id on public.session_requests(user_id);
create index if not exists idx_session_requests_mentor_id on public.session_requests(mentor_id);

-- ── Auth trigger (new user → profile) ─────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (
    id, email, full_name, role, status,
    profile_type, signup_access_type, signup_plan_key
  )
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    coalesce(new.raw_user_meta_data ->> 'role', 'user'),
    'active',
    nullif(trim(new.raw_user_meta_data ->> 'profile_type'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'signup_access_type'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'signup_plan_key'), '')
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(excluded.full_name, public.profiles.full_name),
        role = excluded.role,
        profile_type = coalesce(excluded.profile_type, public.profiles.profile_type),
        signup_access_type = coalesce(excluded.signup_access_type, public.profiles.signup_access_type),
        signup_plan_key = coalesce(excluded.signup_plan_key, public.profiles.signup_plan_key),
        updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── RLS enable ────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.materials enable row level security;
alter table public.quizzes enable row level security;
alter table public.courses enable row level security;
alter table public.lessons enable row level security;
alter table public.progress enable row level security;
alter table public.quiz_attempts enable row level security;
alter table public.sessions enable row level security;
alter table public.session_requests enable row level security;

-- ── Drop old policies (idempotent) ────────────────────────────────────────
do $$
declare
  r record;
begin
  for r in
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'profiles','subscriptions','materials','quizzes','courses','lessons',
        'progress','quiz_attempts','sessions','session_requests'
      )
  loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- ── profiles ───────────────────────────────────────────────────────────────
create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using ((select auth.uid()) = id or public.is_admin((select auth.uid())));

-- Members need to list active mentors; mentors need to list active users (sessions UI).
create policy "profiles_select_active_mentors_for_authenticated"
  on public.profiles for select
  using (
    (select auth.uid()) is not null
    and role = 'mentor'
    and status = 'active'
  );

create policy "profiles_select_active_users_for_mentor_or_admin"
  on public.profiles for select
  using (
    (select public.auth_is_mentor_or_admin())
    and role = 'user'
    and status = 'active'
  );

create policy "profiles_insert_own"
  on public.profiles for insert
  with check ((select auth.uid()) = id);

create policy "profiles_update_own"
  on public.profiles for update
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "profiles_update_admin"
  on public.profiles for update
  using (public.is_admin((select auth.uid())))
  with check (public.is_admin((select auth.uid())));

-- ── subscriptions ─────────────────────────────────────────────────────────
create policy "subscriptions_select_own_or_admin"
  on public.subscriptions for select
  using ((select auth.uid()) = user_id or public.is_admin((select auth.uid())));

create policy "subscriptions_all_admin"
  on public.subscriptions for all
  using (public.is_admin((select auth.uid())))
  with check (public.is_admin((select auth.uid())));

-- ── materials ───────────────────────────────────────────────────────────────
-- SELECT: admins see all; owners see own rows; others only if visibility = 'public',
--         and premium rows: active Stripe subscription OR subscription member activated after Checkout (profiles.is_active).
create policy "materials_select_rls"
  on public.materials for select
  using (
    public.is_admin((select auth.uid()))
    or (select auth.uid()) = owner_id
    or (
      (select auth.uid()) is not null
      and visibility = 'public'
      and public.auth_is_mentor_or_admin()
    )
    or (
      (select auth.uid()) is not null
      and visibility = 'public'
      and not public.auth_is_mentor_or_admin()
      and (
        not coalesce(is_premium, false)
        or (
          coalesce(is_premium, false)
          and (
            exists (
              select 1 from public.subscriptions s
              where s.user_id = (select auth.uid())
                and s.status = 'active'
            )
            or exists (
              select 1 from public.profiles p
              where p.id = (select auth.uid())
                and p.signup_access_type = 'subscription'
                and p.status = 'active'
                and coalesce(p.is_active, false)
            )
          )
          and (
            coalesce(target_audience, 'all') = 'all'
            or exists (
              select 1 from public.profiles p
              where p.id = (select auth.uid())
                and coalesce(p.is_active, false)
                and p.profile_type is not null
                and p.profile_type = target_audience
            )
          )
        )
      )
    )
  );

create policy "materials_insert_owner"
  on public.materials for insert
  with check (
    (select auth.uid()) = owner_id
    or public.is_admin((select auth.uid()))
  );

create policy "materials_update_owner_or_admin"
  on public.materials for update
  using (
    (select auth.uid()) = owner_id
    or public.is_admin((select auth.uid()))
  )
  with check (
    (select auth.uid()) = owner_id
    or public.is_admin((select auth.uid()))
  );

create policy "materials_delete_owner_or_admin"
  on public.materials for delete
  using (
    (select auth.uid()) = owner_id
    or public.is_admin((select auth.uid()))
  );

-- ── quizzes (catalog) ───────────────────────────────────────────────────────
create policy "quizzes_select_authenticated"
  on public.quizzes for select
  using ((select auth.uid()) is not null);

create policy "quizzes_all_admin"
  on public.quizzes for all
  using (public.is_admin((select auth.uid())))
  with check (public.is_admin((select auth.uid())));

-- ── courses ─────────────────────────────────────────────────────────────────
create policy "courses_select_published_or_owner_or_admin"
  on public.courses for select
  using (
    is_published = true
    or (select auth.uid()) = owner_id
    or public.is_admin((select auth.uid()))
  );

create policy "courses_insert_owner"
  on public.courses for insert
  with check (
    (select auth.uid()) = owner_id
    or public.is_admin((select auth.uid()))
  );

create policy "courses_update_owner_or_admin"
  on public.courses for update
  using (
    (select auth.uid()) = owner_id
    or public.is_admin((select auth.uid()))
  )
  with check (
    (select auth.uid()) = owner_id
    or public.is_admin((select auth.uid()))
  );

create policy "courses_delete_owner_or_admin"
  on public.courses for delete
  using (
    (select auth.uid()) = owner_id
    or public.is_admin((select auth.uid()))
  );

-- ── lessons (ownership via parent course.owner_id) ─────────────────────────
create policy "lessons_select_visible"
  on public.lessons for select
  using (
    exists (
      select 1 from public.courses c
      where c.id = course_id
        and (
          c.is_published = true
          or (select auth.uid()) = c.owner_id
          or public.is_admin((select auth.uid()))
        )
    )
  );

create policy "lessons_insert_owner_or_admin"
  on public.lessons for insert
  with check (
    exists (
      select 1 from public.courses c
      where c.id = course_id
        and (
          (select auth.uid()) = c.owner_id
          or public.is_admin((select auth.uid()))
        )
    )
  );

create policy "lessons_update_owner_or_admin"
  on public.lessons for update
  using (
    exists (
      select 1 from public.courses c
      where c.id = course_id
        and (
          (select auth.uid()) = c.owner_id
          or public.is_admin((select auth.uid()))
        )
    )
  )
  with check (
    exists (
      select 1 from public.courses c
      where c.id = course_id
        and (
          (select auth.uid()) = c.owner_id
          or public.is_admin((select auth.uid()))
        )
    )
  );

create policy "lessons_delete_owner_or_admin"
  on public.lessons for delete
  using (
    exists (
      select 1 from public.courses c
      where c.id = course_id
        and (
          (select auth.uid()) = c.owner_id
          or public.is_admin((select auth.uid()))
        )
    )
  );

-- ── progress ───────────────────────────────────────────────────────────────
create policy "progress_select_own_or_admin"
  on public.progress for select
  using ((select auth.uid()) = user_id or public.is_admin((select auth.uid())));

create policy "progress_insert_own"
  on public.progress for insert
  with check ((select auth.uid()) = user_id or public.is_admin((select auth.uid())));

create policy "progress_update_own_or_admin"
  on public.progress for update
  using ((select auth.uid()) = user_id or public.is_admin((select auth.uid())))
  with check ((select auth.uid()) = user_id or public.is_admin((select auth.uid())));

create policy "progress_delete_own_or_admin"
  on public.progress for delete
  using ((select auth.uid()) = user_id or public.is_admin((select auth.uid())));

-- ── quiz_attempts ─────────────────────────────────────────────────────────
create policy "quiz_attempts_select_own_or_admin"
  on public.quiz_attempts for select
  using ((select auth.uid()) = user_id or public.is_admin((select auth.uid())));

create policy "quiz_attempts_insert_own"
  on public.quiz_attempts for insert
  with check ((select auth.uid()) = user_id);

create policy "quiz_attempts_update_own_or_admin"
  on public.quiz_attempts for update
  using ((select auth.uid()) = user_id or public.is_admin((select auth.uid())))
  with check ((select auth.uid()) = user_id or public.is_admin((select auth.uid())));

create policy "quiz_attempts_delete_admin"
  on public.quiz_attempts for delete
  using (public.is_admin((select auth.uid())));

-- ── sessions ───────────────────────────────────────────────────────────────
create policy "sessions_select_participants_or_group_or_admin"
  on public.sessions for select
  using (
    (select auth.uid()) = mentor_id
    or (select auth.uid()) = user_id
    or (type = 'group' and status = 'scheduled')
    or public.is_admin((select auth.uid()))
  );

create policy "sessions_insert_mentor"
  on public.sessions for insert
  with check (
    (select auth.uid()) = mentor_id
    or public.is_admin((select auth.uid()))
  );

create policy "sessions_update_mentor_or_admin"
  on public.sessions for update
  using (
    (select auth.uid()) = mentor_id
    or public.is_admin((select auth.uid()))
  )
  with check (
    (select auth.uid()) = mentor_id
    or public.is_admin((select auth.uid()))
  );

create policy "sessions_delete_mentor_or_admin"
  on public.sessions for delete
  using (
    (select auth.uid()) = mentor_id
    or public.is_admin((select auth.uid()))
  );

-- ── session_requests ───────────────────────────────────────────────────────
create policy "session_requests_select_parties_or_admin"
  on public.session_requests for select
  using (
    (select auth.uid()) = user_id
    or (select auth.uid()) = mentor_id
    or public.is_admin((select auth.uid()))
  );

create policy "session_requests_insert_own_user"
  on public.session_requests for insert
  with check ((select auth.uid()) = user_id);

create policy "session_requests_update_mentor_or_admin"
  on public.session_requests for update
  using (
    (select auth.uid()) = mentor_id
    or public.is_admin((select auth.uid()))
  )
  with check (
    (select auth.uid()) = mentor_id
    or public.is_admin((select auth.uid()))
  );

create policy "session_requests_delete_own_or_admin"
  on public.session_requests for delete
  using (
    (select auth.uid()) = user_id
    or public.is_admin((select auth.uid()))
  );

-- ── Storage: materials bucket ─────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('materials', 'materials', true)
on conflict (id) do update set public = excluded.public;

do $$
declare
  r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname = 'storage' and tablename = 'objects' and policyname like 'materials_%'
  loop
    execute format('drop policy if exists %I on storage.objects', r.policyname);
  end loop;
exception when undefined_table then null;
end $$;

create policy "materials_objects_select_public"
  on storage.objects for select
  using (bucket_id = 'materials');

create policy "materials_objects_insert_own_folder"
  on storage.objects for insert
  with check (
    bucket_id = 'materials'
    and (select auth.uid()) is not null
    and split_part(name, '/', 1) = (select auth.uid())::text
  );

create policy "materials_objects_update_own_folder"
  on storage.objects for update
  using (
    bucket_id = 'materials'
    and split_part(name, '/', 1) = (select auth.uid())::text
  )
  with check (
    bucket_id = 'materials'
    and split_part(name, '/', 1) = (select auth.uid())::text
  );

create policy "materials_objects_delete_own_or_admin"
  on storage.objects for delete
  using (
    bucket_id = 'materials'
    and (
      split_part(name, '/', 1) = (select auth.uid())::text
      or public.is_admin((select auth.uid()))
    )
  );
