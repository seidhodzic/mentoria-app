-- Sessions & session requests (idempotent). Policies use public.is_admin (no profiles RLS recursion).

CREATE TABLE IF NOT EXISTS public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  mentor_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  type text NOT NULL DEFAULT '1on1' CHECK (type IN ('1on1', 'group')),
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'completed')),
  meet_link text,
  scheduled_at timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 60,
  max_participants integer DEFAULT 1,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sessions_mentor_id ON public.sessions(mentor_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_type_status ON public.sessions(type, status);

CREATE TABLE IF NOT EXISTS public.session_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  mentor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  topic text NOT NULL,
  message text,
  preferred_time text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  session_id uuid REFERENCES public.sessions(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_session_requests_user_id ON public.session_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_session_requests_mentor_id ON public.session_requests(mentor_id);
CREATE INDEX IF NOT EXISTS idx_session_requests_session_id ON public.session_requests(session_id);

-- Upgrade from older schema: widen status enum, add nullable columns
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS meet_link text;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.session_requests ADD COLUMN IF NOT EXISTS session_id uuid REFERENCES public.sessions(id) ON DELETE SET NULL;

-- Replace older status check (e.g. scheduled|completed|cancelled) with spec values
ALTER TABLE public.sessions DROP CONSTRAINT IF EXISTS sessions_status_check;
ALTER TABLE public.sessions
  ADD CONSTRAINT sessions_status_check
  CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'completed'));

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_requests ENABLE ROW LEVEL SECURITY;

-- Replace prior granular policies (from full schema) with consolidated policies
DROP POLICY IF EXISTS "sessions_select_participants_or_group_or_admin" ON public.sessions;
DROP POLICY IF EXISTS "sessions_insert_mentor" ON public.sessions;
DROP POLICY IF EXISTS "sessions_update_mentor_or_admin" ON public.sessions;
DROP POLICY IF EXISTS "sessions_delete_mentor_or_admin" ON public.sessions;

DROP POLICY IF EXISTS "session_requests_select_parties_or_admin" ON public.session_requests;
DROP POLICY IF EXISTS "session_requests_insert_own_user" ON public.session_requests;
DROP POLICY IF EXISTS "session_requests_update_mentor_or_admin" ON public.session_requests;
DROP POLICY IF EXISTS "session_requests_delete_own_or_admin" ON public.session_requests;

DROP POLICY IF EXISTS "Sessions visible to participants" ON public.sessions;
DROP POLICY IF EXISTS "Mentors manage their sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users manage own requests" ON public.session_requests;

CREATE POLICY "Sessions visible to participants" ON public.sessions FOR SELECT
  USING (
    (select auth.uid()) = user_id
    OR (select auth.uid()) = mentor_id
    OR public.is_admin((select auth.uid()))
  );

CREATE POLICY "Mentors manage their sessions" ON public.sessions FOR ALL
  USING (
    (select auth.uid()) = mentor_id
    OR public.is_admin((select auth.uid()))
  )
  WITH CHECK (
    (select auth.uid()) = mentor_id
    OR public.is_admin((select auth.uid()))
  );

CREATE POLICY "Users manage own requests" ON public.session_requests FOR ALL
  USING (
    (select auth.uid()) = user_id
    OR (select auth.uid()) = mentor_id
    OR public.is_admin((select auth.uid()))
  )
  WITH CHECK (
    (select auth.uid()) = user_id
    OR (select auth.uid()) = mentor_id
    OR public.is_admin((select auth.uid()))
  );
