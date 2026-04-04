-- Prevent authenticated users from self-promoting via profiles UPDATE (RLS "own" policy).
-- Service role / webhook (auth.uid() IS NULL) may still update rows for system sync.

CREATE OR REPLACE FUNCTION public.prevent_unauthorized_profile_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP <> 'UPDATE' THEN
    RETURN NEW;
  END IF;
  IF NEW.role IS NOT DISTINCT FROM OLD.role THEN
    RETURN NEW;
  END IF;
  IF (SELECT auth.uid()) IS NULL THEN
    RETURN NEW;
  END IF;
  IF public.is_admin((SELECT auth.uid())) THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'role change requires admin'
    USING ERRCODE = '42501';
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_role_guard ON public.profiles;
CREATE TRIGGER trg_profiles_role_guard
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.prevent_unauthorized_profile_role_change();
