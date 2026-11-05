-- 1. Add ownership and trust fields to vendor_profiles
ALTER TABLE public.vendor_profiles
ADD COLUMN IF NOT EXISTS website_url text,
ADD COLUMN IF NOT EXISTS linkedin_url text,
ADD COLUMN IF NOT EXISTS business_registration_url text,
ADD COLUMN IF NOT EXISTS ownership_evidence_urls text[] DEFAULT '{}'::text[],
ADD COLUMN IF NOT EXISTS trust_score integer NOT NULL DEFAULT 0;

-- 2. Add is_banned to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_banned boolean NOT NULL DEFAULT false;

-- 3. Expose new columns in public view
DROP VIEW IF EXISTS public.vendor_profiles_public;
CREATE OR REPLACE VIEW public.vendor_profiles_public AS
 SELECT vp.id,
    vp.name,
    vp.category,
    vp.description,
    vp.about_experience,
    vp.photos,
    vp.price_per_person,
    vp.price_tiers,
    vp.max_guests,
    vp.duration,
    vp.included_items,
    vp.meeting_point_description,
    vp.age_restriction,
    vp.city,
    vp.listing_type,
    vp.is_published,
    vp.cancellation_hours,
    vp.google_rating,
    vp.google_place_id,
    vp.google_reviews_url,
    vp.airbnb_reviews,
    vp.airbnb_experience_url,
    vp.menu_url,
    vp.instagram_url,
    vp.website_url,
    vp.linkedin_url,
    vp.host_bio,
    vp.host_avatar_url,
    vp.trust_score,
    vp.created_at
   FROM public.vendor_profiles vp
  WHERE (vp.is_published = true AND vp.verification_status = 'approved'::vendor_verification_status);

-- 4. Create Vendor Trust Score Function
CREATE OR REPLACE FUNCTION public.calculate_vendor_trust_score(_vendor_profile_id uuid)
 RETURNS integer
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  score integer := 0;
  v_vendor RECORD;
  v_profile RECORD;
  v_completed_count integer := 0;
  v_refund_count integer := 0;
  v_avg_rating numeric;
  v_refund_rate numeric := 0;
BEGIN
  -- Get vendor profile data
  SELECT * INTO v_vendor
  FROM vendor_profiles
  WHERE id = _vendor_profile_id;

  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Get user profile data for identity verification status
  SELECT * INTO v_profile
  FROM profiles
  WHERE user_id = v_vendor.user_id;

  -- Identity verified (using existing host verification for now, as it applies to the user): +25
  IF v_profile.host_verification_status = 'verified' THEN
    score := score + 25;
  END IF;

  -- Verified payout (Stripe Connect): +20
  IF v_vendor.stripe_onboarding_complete = true THEN
    score := score + 20;
  END IF;

  -- Social profiles connected (website, linkedin, instagram): +5 each, max 15
  IF v_vendor.website_url IS NOT NULL THEN score := score + 5; END IF;
  IF v_vendor.linkedin_url IS NOT NULL THEN score := score + 5; END IF;
  IF v_vendor.instagram_url IS NOT NULL THEN score := score + 5; END IF;

  -- Completed experiences: +2 each, max 20
  SELECT COUNT(*) INTO v_completed_count
  FROM bookings
  WHERE vendor_profile_id = _vendor_profile_id AND status = 'completed';
  
  score := score + LEAST(v_completed_count * 2, 20);

  -- Positive reviews (avg >= 4): +15
  SELECT AVG(rating) INTO v_avg_rating
  FROM reviews
  WHERE vendor_profile_id = _vendor_profile_id;

  IF v_avg_rating IS NOT NULL AND v_avg_rating >= 4.0 THEN
    score := score + 15;
  ELSIF v_avg_rating IS NOT NULL AND v_avg_rating >= 3.0 THEN
    score := score + 5;
  END IF;

  -- Penalty for high refund rate
  IF v_completed_count > 0 THEN
    SELECT COUNT(*) INTO v_refund_count
    FROM refund_requests rr
    JOIN bookings b ON rr.booking_id = b.id
    WHERE b.vendor_profile_id = _vendor_profile_id AND rr.status = 'approved';

    v_refund_rate := v_refund_count::numeric / v_completed_count::numeric;
    
    IF v_refund_rate > 0.10 THEN
      score := score - 20; -- Deduct 20 points if >10% refund rate
    END IF;
  END IF;

  -- Ensure score is between 0 and 100
  RETURN GREATEST(0, LEAST(score, 100));
END;
$function$;

-- 5. Function to refresh vendor trust score
CREATE OR REPLACE FUNCTION public.refresh_vendor_trust_score(_vendor_profile_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_score integer;
BEGIN
  new_score := calculate_vendor_trust_score(_vendor_profile_id);
  UPDATE vendor_profiles SET trust_score = new_score WHERE id = _vendor_profile_id;
END;
$function$;

-- 6. Trigger: update vendor trust score on booking completion
CREATE OR REPLACE FUNCTION public.trigger_refresh_vendor_trust_score_on_booking()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    IF NEW.vendor_profile_id IS NOT NULL THEN
      PERFORM refresh_vendor_trust_score(NEW.vendor_profile_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS refresh_vendor_trust_score_booking ON public.bookings;
CREATE TRIGGER refresh_vendor_trust_score_booking
AFTER UPDATE OF status ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.trigger_refresh_vendor_trust_score_on_booking();

-- 7. Trigger: update vendor trust score on review creation/update
CREATE OR REPLACE FUNCTION public.trigger_refresh_vendor_trust_score_on_review()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.vendor_profile_id IS NOT NULL THEN
    PERFORM refresh_vendor_trust_score(NEW.vendor_profile_id);
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS refresh_vendor_trust_score_review ON public.reviews;
CREATE TRIGGER refresh_vendor_trust_score_review
AFTER INSERT OR UPDATE OF rating ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.trigger_refresh_vendor_trust_score_on_review();

-- 8. Trigger: update vendor trust score on refund request approval
CREATE OR REPLACE FUNCTION public.trigger_refresh_vendor_trust_score_on_refund()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_vendor_profile_id uuid;
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS DISTINCT FROM 'approved') THEN
    SELECT vendor_profile_id INTO v_vendor_profile_id
    FROM bookings
    WHERE id = NEW.booking_id;
    
    IF v_vendor_profile_id IS NOT NULL THEN
      PERFORM refresh_vendor_trust_score(v_vendor_profile_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS refresh_vendor_trust_score_refund ON public.refund_requests;
CREATE TRIGGER refresh_vendor_trust_score_refund
AFTER UPDATE OF status ON public.refund_requests
FOR EACH ROW
EXECUTE FUNCTION public.trigger_refresh_vendor_trust_score_on_refund();

-- 9. Fraud Detection: Booking Spikes for new vendors
CREATE OR REPLACE FUNCTION public.check_booking_fraud()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_vendor_created_at timestamptz;
  v_recent_booking_count integer;
BEGIN
  -- Only care about new bookings for vendors
  IF NEW.vendor_profile_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get vendor creation date
  SELECT created_at INTO v_vendor_created_at
  FROM vendor_profiles
  WHERE id = NEW.vendor_profile_id;

  -- If vendor is less than 7 days old
  IF v_vendor_created_at > (now() - interval '7 days') THEN
    -- Check how many bookings they have
    SELECT COUNT(*) INTO v_recent_booking_count
    FROM bookings
    WHERE vendor_profile_id = NEW.vendor_profile_id;

    -- If > 5 bookings, flag for rapid bookings
    IF v_recent_booking_count >= 5 THEN
      -- Use a safe insert that won't fail if we already flagged them recently
      INSERT INTO fraud_alerts (alert_type, target_user_id, target_listing_id, details)
      SELECT 'rapid_bookings', NEW.user_id, NEW.vendor_profile_id, 
        jsonb_build_object('booking_count', v_recent_booking_count + 1)
      WHERE NOT EXISTS (
        SELECT 1 FROM fraud_alerts 
        WHERE alert_type = 'rapid_bookings' 
          AND target_listing_id = NEW.vendor_profile_id
          AND created_at > now() - interval '1 day'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS check_booking_fraud_trigger ON public.bookings;
CREATE TRIGGER check_booking_fraud_trigger
AFTER INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.check_booking_fraud();

-- 10. Update check_vendor_fraud trigger to handle duplicate content (naive check)
CREATE OR REPLACE FUNCTION public.check_vendor_fraud()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  listing_count integer;
  duplicate_listing_id uuid;
BEGIN
  -- Check for too many listings
  SELECT COUNT(*) INTO listing_count
  FROM vendor_profiles WHERE user_id = NEW.user_id;

  IF listing_count >= 3 THEN
    INSERT INTO fraud_alerts (alert_type, target_user_id, target_listing_id, details)
    VALUES ('multiple_listings', NEW.user_id, NEW.id, 
      jsonb_build_object('listing_count', listing_count + 1, 'listing_name', NEW.name));
  END IF;

  -- Check for suspicious pricing
  IF NEW.price_per_person IS NOT NULL AND NEW.price_per_person < 5 THEN
    INSERT INTO fraud_alerts (alert_type, target_user_id, target_listing_id, details)
    VALUES ('suspicious_pricing', NEW.user_id, NEW.id,
      jsonb_build_object('price', NEW.price_per_person, 'listing_name', NEW.name));
  END IF;

  -- Check for duplicate listing names/descriptions from DIFFERENT users
  SELECT id INTO duplicate_listing_id
  FROM vendor_profiles
  WHERE (name = NEW.name OR (description IS NOT NULL AND description = NEW.description))
    AND user_id != NEW.user_id
  LIMIT 1;

  IF duplicate_listing_id IS NOT NULL THEN
    INSERT INTO fraud_alerts (alert_type, target_user_id, target_listing_id, details)
    VALUES ('duplicate_listing', NEW.user_id, NEW.id,
      jsonb_build_object('matched_listing_id', duplicate_listing_id, 'reason', 'Title or description matches another vendor'));
  END IF;

  RETURN NEW;
END;
$function$;

-- 11. Storage bucket for ownership evidence
INSERT INTO storage.buckets (id, name, public) 
VALUES ('vendor-evidence', 'vendor-evidence', false)
ON CONFLICT (id) DO NOTHING;

-- RLS for vendor-evidence bucket
CREATE POLICY "Users can upload their own vendor evidence" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'vendor-evidence' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own vendor evidence" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'vendor-evidence' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all vendor evidence" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'vendor-evidence' AND public.has_role(auth.uid(), 'admin'));
