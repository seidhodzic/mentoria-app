-- Add missing columns to profiles (idempotent)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS signup_access_type text NOT NULL DEFAULT 'subscription'
    CHECK (signup_access_type IN ('subscription', 'one_time', 'free'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_type text DEFAULT NULL;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Legacy DBs: column may pre-exist without NOT NULL / CHECK (e.g. partial migrations)
UPDATE public.profiles
SET signup_access_type = coalesce(nullif(trim(signup_access_type), ''), 'subscription');
ALTER TABLE public.profiles ALTER COLUMN signup_access_type SET DEFAULT 'subscription';
ALTER TABLE public.profiles ALTER COLUMN signup_access_type SET NOT NULL;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_signup_access_type_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_signup_access_type_check
  CHECK (signup_access_type IN ('subscription', 'one_time', 'free'));

ALTER TABLE public.profiles ALTER COLUMN is_active SET DEFAULT false;

-- Existing rows: align is_active with status
UPDATE public.profiles SET is_active = true WHERE status = 'active';

-- Auto-update updated_at on changes
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_updated_at();
