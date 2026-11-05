
-- Fix 1: Restrict vendor UPDATE on bookings to only the 'status' column
DROP POLICY IF EXISTS "Vendors can update their booking status" ON public.bookings;
CREATE POLICY "Vendors can update booking status only"
  ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vendor_profiles
      WHERE vendor_profiles.id = bookings.vendor_profile_id
        AND vendor_profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM vendor_profiles
      WHERE vendor_profiles.id = bookings.vendor_profile_id
        AND vendor_profiles.user_id = auth.uid()
    )
    -- Only allow updating status; all financial fields must remain unchanged
    AND total_amount = (SELECT b.total_amount FROM bookings b WHERE b.id = bookings.id)
    AND vendor_payout_amount IS NOT DISTINCT FROM (SELECT b.vendor_payout_amount FROM bookings b WHERE b.id = bookings.id)
    AND host_payout_amount IS NOT DISTINCT FROM (SELECT b.host_payout_amount FROM bookings b WHERE b.id = bookings.id)
    AND platform_fee_amount IS NOT DISTINCT FROM (SELECT b.platform_fee_amount FROM bookings b WHERE b.id = bookings.id)
    AND payout_status IS NOT DISTINCT FROM (SELECT b.payout_status FROM bookings b WHERE b.id = bookings.id)
    AND stripe_session_id IS NOT DISTINCT FROM (SELECT b.stripe_session_id FROM bookings b WHERE b.id = bookings.id)
    AND stripe_payment_intent_id IS NOT DISTINCT FROM (SELECT b.stripe_payment_intent_id FROM bookings b WHERE b.id = bookings.id)
    AND currency = (SELECT b.currency FROM bookings b WHERE b.id = bookings.id)
    AND user_id = (SELECT b.user_id FROM bookings b WHERE b.id = bookings.id)
  );

-- Fix 2: Restrict vendor self-UPDATE to safe profile columns only
DROP POLICY IF EXISTS "Users can update their own vendor profiles" ON public.vendor_profiles;
CREATE POLICY "Users can update their own vendor profiles (safe fields only)"
  ON public.vendor_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    -- Prevent changes to sensitive fields
    AND verification_status IS NOT DISTINCT FROM (SELECT vp.verification_status FROM vendor_profiles vp WHERE vp.id = vendor_profiles.id)
    AND verified_at IS NOT DISTINCT FROM (SELECT vp.verified_at FROM vendor_profiles vp WHERE vp.id = vendor_profiles.id)
    AND verified_by IS NOT DISTINCT FROM (SELECT vp.verified_by FROM vendor_profiles vp WHERE vp.id = vendor_profiles.id)
    AND commission_percentage IS NOT DISTINCT FROM (SELECT vp.commission_percentage FROM vendor_profiles vp WHERE vp.id = vendor_profiles.id)
    AND host_commission_percentage IS NOT DISTINCT FROM (SELECT vp.host_commission_percentage FROM vendor_profiles vp WHERE vp.id = vendor_profiles.id)
    AND stripe_account_id IS NOT DISTINCT FROM (SELECT vp.stripe_account_id FROM vendor_profiles vp WHERE vp.id = vendor_profiles.id)
    AND stripe_onboarding_complete IS NOT DISTINCT FROM (SELECT vp.stripe_onboarding_complete FROM vendor_profiles vp WHERE vp.id = vendor_profiles.id)
    AND host_user_id IS NOT DISTINCT FROM (SELECT vp.host_user_id FROM vendor_profiles vp WHERE vp.id = vendor_profiles.id)
  );

-- Fix 3: Create a public reviews view hiding user_id and booking_id
CREATE OR REPLACE VIEW public.reviews_public AS
  SELECT id, rating, comment, vendor_profile_id, created_at
  FROM public.reviews;

-- Replace the broad public SELECT policy with one for authenticated users only
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON public.reviews;

-- Authenticated users can see all reviews (they need user_id for "my reviews" features)
CREATE POLICY "Authenticated users can view reviews"
  ON public.reviews
  FOR SELECT
  TO authenticated
  USING (true);
