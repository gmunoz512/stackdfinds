
-- 1. Add host_trust_score and first_booking_completed_at to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS host_trust_score integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS first_booking_completed_at timestamptz;

-- 2. Create the trust score calculation function
CREATE OR REPLACE FUNCTION public.calculate_host_trust_score(_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  score integer := 0;
  v_profile RECORD;
  v_completed_count integer;
  v_avg_rating numeric;
BEGIN
  -- Get profile data
  SELECT host_verification_status, verified_phone, stripe_onboarding_complete
  INTO v_profile
  FROM profiles
  WHERE user_id = _user_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Verified identity: +25
  IF v_profile.host_verification_status = 'verified' THEN
    score := score + 25;
  END IF;

  -- Verified payout (Stripe Connect): +20
  IF v_profile.stripe_onboarding_complete = true THEN
    score := score + 20;
  END IF;

  -- Verified phone: +10
  IF v_profile.verified_phone IS NOT NULL THEN
    score := score + 10;
  END IF;

  -- Social profiles placeholder: +5 each, max 15 (future feature)
  -- score := score + LEAST(social_count * 5, 15);

  -- Completed experiences: +2 each, max 20
  SELECT COUNT(*) INTO v_completed_count
  FROM bookings
  WHERE host_user_id = _user_id AND status = 'completed';
  
  score := score + LEAST(v_completed_count * 2, 20);

  -- Positive reviews (avg >= 4): +10
  SELECT AVG(r.rating) INTO v_avg_rating
  FROM reviews r
  JOIN vendor_profiles vp ON r.vendor_profile_id = vp.id
  JOIN host_vendor_links hvl ON hvl.vendor_profile_id = vp.id
  WHERE hvl.host_user_id = _user_id;

  IF v_avg_rating IS NOT NULL AND v_avg_rating >= 4.0 THEN
    score := score + 10;
  END IF;

  RETURN LEAST(score, 100);
END;
$$;

-- 3. Create a function to refresh a host's trust score
CREATE OR REPLACE FUNCTION public.refresh_host_trust_score(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_score integer;
BEGIN
  new_score := calculate_host_trust_score(_user_id);
  UPDATE profiles SET host_trust_score = new_score WHERE user_id = _user_id;
END;
$$;

-- 4. Trigger to update trust score when profile changes
CREATE OR REPLACE FUNCTION public.trigger_refresh_trust_score_on_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM refresh_host_trust_score(NEW.user_id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_profile_trust_score
  AFTER UPDATE OF host_verification_status, verified_phone, stripe_onboarding_complete
  ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION trigger_refresh_trust_score_on_profile();

-- 5. Trigger to update trust score when bookings complete
CREATE OR REPLACE FUNCTION public.trigger_refresh_trust_score_on_booking()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    -- Refresh host trust score
    IF NEW.host_user_id IS NOT NULL THEN
      PERFORM refresh_host_trust_score(NEW.host_user_id);
      -- Track first completed booking
      UPDATE profiles 
      SET first_booking_completed_at = now() 
      WHERE user_id = NEW.host_user_id 
        AND first_booking_completed_at IS NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_booking_trust_score
  AFTER UPDATE OF status
  ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION trigger_refresh_trust_score_on_booking();

-- 6. Trigger to update trust score when reviews are added
CREATE OR REPLACE FUNCTION public.trigger_refresh_trust_score_on_review()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_host_user_id uuid;
BEGIN
  -- Find the host linked to this vendor
  SELECT hvl.host_user_id INTO v_host_user_id
  FROM host_vendor_links hvl
  WHERE hvl.vendor_profile_id = NEW.vendor_profile_id
  LIMIT 1;

  IF v_host_user_id IS NOT NULL THEN
    PERFORM refresh_host_trust_score(v_host_user_id);
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_review_trust_score
  AFTER INSERT
  ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION trigger_refresh_trust_score_on_review();

-- 7. Replace reviews INSERT policy to require completed booking
DROP POLICY IF EXISTS "Users can create their own reviews" ON public.reviews;

CREATE POLICY "Users can create verified reviews only"
  ON public.reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND booking_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM bookings
      WHERE bookings.id = reviews.booking_id
      AND bookings.user_id = auth.uid()
      AND bookings.status = 'completed'
    )
  );

-- 8. Unique constraint on booking_id (one review per booking)
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_booking_id_unique UNIQUE (booking_id);

-- 9. Function to get listing limit based on trust score
CREATE OR REPLACE FUNCTION public.get_host_listing_limit(_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN host_trust_score >= 61 THEN 999999
    WHEN host_trust_score >= 30 THEN 5
    ELSE 2
  END
  FROM profiles
  WHERE user_id = _user_id;
$$;
