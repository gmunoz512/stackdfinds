-- Add column-change guards without replacing existing ownership/verification RLS.
-- SECURITY INVOKER is intentional: trusted SECURITY DEFINER score refreshes run
-- as their owner, whereas direct PostgREST writes run as authenticated/anon.
BEGIN;
CREATE OR REPLACE FUNCTION public.guard_profile_system_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF current_user IN ('postgres', 'supabase_admin', 'service_role') THEN
    RETURN NEW;
  END IF;
  IF public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RETURN NEW;
  END IF;
  IF TG_TABLE_NAME = 'profiles' THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.stripe_account_id IS NOT NULL
         OR NEW.stripe_onboarding_complete IS DISTINCT FROM false
         OR NEW.host_trust_score IS DISTINCT FROM 0
         OR NEW.first_booking_completed_at IS NOT NULL
         OR NEW.is_banned IS DISTINCT FROM false THEN
        RAISE EXCEPTION 'System-managed profile fields cannot be supplied' USING ERRCODE = '42501';
      END IF;
    ELSIF ROW(NEW.stripe_account_id, NEW.stripe_onboarding_complete,
              NEW.host_trust_score, NEW.first_booking_completed_at, NEW.is_banned)
      IS DISTINCT FROM
          ROW(OLD.stripe_account_id, OLD.stripe_onboarding_complete,
              OLD.host_trust_score, OLD.first_booking_completed_at, OLD.is_banned) THEN
      RAISE EXCEPTION 'System-managed profile fields cannot be changed' USING ERRCODE = '42501';
    END IF;
  ELSIF TG_TABLE_NAME = 'vendor_profiles' THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.trust_score IS DISTINCT FROM 0 THEN
        RAISE EXCEPTION 'Vendor trust score is system-managed' USING ERRCODE = '42501';
      END IF;
    ELSIF NEW.trust_score IS DISTINCT FROM OLD.trust_score THEN
      RAISE EXCEPTION 'Vendor trust score is system-managed' USING ERRCODE = '42501';
    END IF;
  ELSE
    RAISE EXCEPTION 'Unexpected trigger table';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_profile_system_fields() FROM PUBLIC;
CREATE TRIGGER guard_profile_system_fields
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_profile_system_fields();
CREATE TRIGGER guard_vendor_trust_score
BEFORE INSERT OR UPDATE ON public.vendor_profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_profile_system_fields();
COMMIT;
