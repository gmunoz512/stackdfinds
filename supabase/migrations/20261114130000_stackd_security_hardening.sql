-- Stackd (lryeshzwwhcdtzemeyzk) security hardening for the switch off the old backend.
-- Applied to Stackd on 2026-11-14. Safe to re-run.
BEGIN;

-- 1. Public views are read-only. Simple views are auto-updatable, so the old
--    INSERT/UPDATE/DELETE grants let anyone write through them.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.vendor_profiles_public, public.reviews_public, public.itineraries_public
  FROM anon, authenticated;
GRANT SELECT ON public.vendor_profiles_public, public.reviews_public, public.itineraries_public
  TO anon, authenticated;

-- 2. reviews_public: run as the caller. Signed-out visitors may read reviews,
--    but only the public columns (no user_id or booking_id).
ALTER VIEW public.reviews_public SET (security_invoker = true);
DROP POLICY IF EXISTS "Anyone can read public review fields" ON public.reviews;
CREATE POLICY "Anyone can read public review fields" ON public.reviews
  FOR SELECT TO anon USING (true);
REVOKE SELECT ON public.reviews FROM anon;
GRANT SELECT (id, rating, comment, vendor_profile_id, created_at) ON public.reviews TO anon;

-- 3. itineraries_public: run as the caller. Public itineraries are readable;
--    signed-out visitors cannot see user_id.
ALTER VIEW public.itineraries_public SET (security_invoker = true);
DROP POLICY IF EXISTS "Anyone can view public itineraries" ON public.itineraries;
CREATE POLICY "Anyone can view public itineraries" ON public.itineraries
  FOR SELECT TO anon, authenticated USING (is_public = true);
REVOKE SELECT ON public.itineraries FROM anon;
GRANT SELECT (id, destination, start_date, end_date, itinerary_data, is_confirmed,
  share_token, is_public, created_at, updated_at) ON public.itineraries TO anon;

-- vendor_profiles_public stays a definer view on purpose: it is the column
-- filter that hides stripe_account_id, commission, verification notes and
-- evidence URLs. Opening vendor_profiles itself to the public would expose them.
COMMENT ON VIEW public.vendor_profiles_public IS
  'Read-only public column subset of published, approved vendor_profiles. Definer view by design.';

-- 4. Signed-out visitors never write tables directly. Writes go through
--    signed-in RLS policies or edge functions (service role).
DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
           WHERE n.nspname = 'public' AND c.relkind IN ('r', 'v', 'm', 'p')
  LOOP
    EXECUTE format('REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON public.%I FROM anon', t.relname);
    EXECUTE format('REVOKE TRUNCATE, REFERENCES, TRIGGER ON public.%I FROM authenticated', t.relname);
  END LOOP;
END $$;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLES FROM anon;

-- 5. Internal SECURITY DEFINER functions: triggers, scoring, cleanup and promo
--    validation are not callable from the browser. Edge functions use service_role.
DO $$
DECLARE f record;
BEGIN
  FOR f IN SELECT p.oid::regprocedure AS sig FROM pg_proc p
           WHERE p.pronamespace = 'public'::regnamespace AND p.proname IN (
             'calculate_host_trust_score', 'calculate_vendor_trust_score',
             'check_booking_fraud', 'check_message_content', 'check_vendor_fraud',
             'cleanup_expired_otps', 'cleanup_rate_limits', 'get_host_listing_limit',
             'get_user_role', 'handle_new_user', 'refresh_host_trust_score',
             'refresh_vendor_trust_score', 'trigger_refresh_trust_score_on_booking',
             'trigger_refresh_trust_score_on_profile', 'trigger_refresh_trust_score_on_review',
             'trigger_refresh_vendor_trust_score_on_booking',
             'trigger_refresh_vendor_trust_score_on_refund',
             'trigger_refresh_vendor_trust_score_on_review', 'validate_promo_code')
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', f.sig);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role', f.sig);
  END LOOP;
END $$;

-- 6. has_role stays callable (RLS policies use it), but it only answers for the
--    caller's own id. Service-role edge functions and the database owner can
--    ask about anyone. Nobody can probe which accounts are admins.
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  ) AND (
    _user_id = auth.uid()
    OR coalesce(auth.role(), '') = 'service_role'
    OR session_user <> 'authenticator'
  )
$$;

-- 7. Service-role-only rate limit table: make the deny explicit.
DROP POLICY IF EXISTS "Deny all access to paid_api_limits" ON public.paid_api_limits;
CREATE POLICY "Deny all access to paid_api_limits" ON public.paid_api_limits
  FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

-- 8. Storage: public buckets serve files by URL without a SELECT policy.
--    Drop the broad SELECT policies so nobody can list every file; owners
--    can still list and delete files in their own folder.
DROP POLICY IF EXISTS "Anyone can view vendor photos" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view vendor menus" ON storage.objects;
DROP POLICY IF EXISTS "Owners can list their vendor photos" ON storage.objects;
CREATE POLICY "Owners can list their vendor photos" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'vendor-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
DROP POLICY IF EXISTS "Owners can list their vendor menus" ON storage.objects;
CREATE POLICY "Owners can list their vendor menus" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'vendor-menus' AND (storage.foldername(name))[1] = auth.uid()::text);
-- Menus: upload only into your own folder (was: anywhere in the bucket).
DROP POLICY IF EXISTS "Authenticated users can upload menus" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own menus" ON storage.objects;
CREATE POLICY "Users can upload their own menus" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'vendor-menus' AND (storage.foldername(name))[1] = auth.uid()::text);

-- 9. Index foreign keys flagged by the performance advisor.
CREATE INDEX IF NOT EXISTS bookings_vendor_profile_id_idx ON public.bookings (vendor_profile_id);
CREATE INDEX IF NOT EXISTS conversations_booking_id_idx ON public.conversations (booking_id);
CREATE INDEX IF NOT EXISTS host_vendor_links_vendor_profile_id_idx ON public.host_vendor_links (vendor_profile_id);
CREATE INDEX IF NOT EXISTS itinerary_items_user_id_idx ON public.itinerary_items (user_id);
CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON public.messages (conversation_id);
CREATE INDEX IF NOT EXISTS refund_requests_booking_id_idx ON public.refund_requests (booking_id);
CREATE INDEX IF NOT EXISTS reviews_vendor_profile_id_idx ON public.reviews (vendor_profile_id);
CREATE INDEX IF NOT EXISTS shared_itineraries_user_id_idx ON public.shared_itineraries (user_id);
CREATE INDEX IF NOT EXISTS vendor_profiles_vendor_id_idx ON public.vendor_profiles (vendor_id);
CREATE INDEX IF NOT EXISTS vendor_profiles_verified_by_idx ON public.vendor_profiles (verified_by);
CREATE INDEX IF NOT EXISTS wishlist_items_wishlist_id_idx ON public.wishlist_items (wishlist_id);

COMMIT;
