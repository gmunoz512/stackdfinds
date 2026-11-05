-- Phase 5: guest checkout (book without an account).
-- NOT APPLIED. Write-only migration for review; the Lovable-managed project
-- must apply it before guest checkout can create bookings. Until then the
-- app tells signed-out guests to sign in to pay (graceful fallback).

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS guest_email text,
  ADD COLUMN IF NOT EXISTS guest_name text;

ALTER TABLE public.bookings ALTER COLUMN user_id DROP NOT NULL;

-- Every booking belongs to an account or to a guest email.
ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_owner_present;
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_owner_present
  CHECK (user_id IS NOT NULL OR guest_email IS NOT NULL);

-- Guest rows are written only by the stripe-webhook (service role). Existing
-- RLS policies key on auth.uid() = user_id, so guest rows stay private.

-- When a guest later signs up with the same email, attach their bookings.
CREATE OR REPLACE FUNCTION public.claim_guest_bookings()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claimed integer;
  my_email text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN 0;
  END IF;
  SELECT email INTO my_email FROM auth.users WHERE id = auth.uid() AND email_confirmed_at IS NOT NULL;
  IF my_email IS NULL THEN
    RETURN 0;
  END IF;
  UPDATE public.bookings
     SET user_id = auth.uid()
   WHERE user_id IS NULL
     AND lower(guest_email) = lower(my_email);
  GET DIAGNOSTICS claimed = ROW_COUNT;
  RETURN claimed;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_guest_bookings() FROM public;
GRANT EXECUTE ON FUNCTION public.claim_guest_bookings() TO authenticated;
