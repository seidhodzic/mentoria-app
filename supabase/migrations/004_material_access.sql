-- Material access: is_premium defaults, target_audience for subscription/plan gating, updated SELECT RLS.
-- Runs before 004_subscriptions_user_id_unique.sql (lexicographic order: 004_material_access < 004_subscriptions_...).

-- ── Columns (idempotent) ───────────────────────────────────────────────────
ALTER TABLE public.materials
  ADD COLUMN IF NOT EXISTS is_premium boolean;

UPDATE public.materials SET is_premium = coalesce(is_premium, false);

ALTER TABLE public.materials
  ALTER COLUMN is_premium SET DEFAULT false;

ALTER TABLE public.materials
  ALTER COLUMN is_premium SET NOT NULL;

ALTER TABLE public.materials
  ADD COLUMN IF NOT EXISTS target_audience text;

UPDATE public.materials SET target_audience = 'all' WHERE target_audience IS NULL;

ALTER TABLE public.materials
  ALTER COLUMN target_audience SET DEFAULT 'all';

ALTER TABLE public.materials
  ALTER COLUMN target_audience SET NOT NULL;

ALTER TABLE public.materials DROP CONSTRAINT IF EXISTS materials_target_audience_check;

ALTER TABLE public.materials ADD CONSTRAINT materials_target_audience_check
  CHECK (
    target_audience IN (
      'all',
      'player',
      'club',
      'investor',
      'agent',
      'executive',
      'lawyer',
      'coach',
      'student',
      'other'
    )
  );

-- ── RLS: replace materials SELECT policy ────────────────────────────────────
DROP POLICY IF EXISTS "Materials are viewable by everyone" ON public.materials;
DROP POLICY IF EXISTS "Materials are viewable by authorized users" ON public.materials;
DROP POLICY IF EXISTS "materials_select_rls" ON public.materials;

-- Admins: all rows. Owners: own rows. Mentors: all public rows (staff preview).
-- Members (visibility = public): free materials for any logged-in user; premium materials
-- require paid access AND (target_audience = 'all' OR profile_type matches target_audience).
CREATE POLICY "materials_select_rls"
  ON public.materials FOR SELECT
  USING (
    public.is_admin((SELECT auth.uid()))
    OR (SELECT auth.uid()) = owner_id
    OR (
      (SELECT auth.uid()) IS NOT NULL
      AND visibility = 'public'
      AND public.auth_is_mentor_or_admin()
    )
    OR (
      (SELECT auth.uid()) IS NOT NULL
      AND visibility = 'public'
      AND NOT public.auth_is_mentor_or_admin()
      AND (
        NOT COALESCE(is_premium, false)
        OR (
          COALESCE(is_premium, false)
          AND (
            EXISTS (
              SELECT 1
              FROM public.subscriptions s
              WHERE s.user_id = (SELECT auth.uid())
                AND s.status = 'active'
            )
            OR EXISTS (
              SELECT 1
              FROM public.profiles p
              WHERE p.id = (SELECT auth.uid())
                AND p.signup_access_type = 'subscription'
                AND p.status = 'active'
                AND COALESCE(p.is_active, false)
            )
          )
          AND (
            COALESCE(target_audience, 'all') = 'all'
            OR EXISTS (
              SELECT 1
              FROM public.profiles p
              WHERE p.id = (SELECT auth.uid())
                AND COALESCE(p.is_active, false)
                AND p.profile_type IS NOT NULL
                AND p.profile_type = target_audience
            )
          )
        )
      )
    )
  );
