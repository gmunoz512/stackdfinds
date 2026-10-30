-- =============================================
-- SECURITY REMEDIATION: Create public views and tighten RLS
-- =============================================

-- 1. Create itineraries_public view (strips user_id and userId from JSON)
CREATE VIEW public.itineraries_public
WITH (security_invoker=on) AS
SELECT
  id,
  destination,
  start_date,
  end_date,
  itinerary_data #- '{userId}' as itinerary_data,
  is_confirmed,
  share_token,
  is_public,
  created_at,
  updated_at
FROM public.itineraries
WHERE is_public = true;

-- 2. Update itineraries RLS: Remove public access to base table
DROP POLICY IF EXISTS "Anyone can view public itineraries" ON public.itineraries;
DROP POLICY IF EXISTS "Deny anon access to private itineraries" ON public.itineraries;

-- 3. Drop and recreate vendor_profiles_public view with security_invoker
DROP VIEW IF EXISTS public.vendor_profiles_public;

CREATE VIEW public.vendor_profiles_public
WITH (security_invoker=on) AS
SELECT
  id,
  name,
  category,
  description,
  about_experience,
  photos,
  menu_url,
  instagram_url,
  price_per_person,
  price_tiers,
  duration,
  max_guests,
  google_rating,
  google_place_id,
  google_reviews_url,
  airbnb_experience_url,
  airbnb_reviews,
  included_items,
  age_restriction,
  listing_type,
  is_published,
  cancellation_hours,
  created_at,
  city
FROM public.vendor_profiles
WHERE is_published = true;

-- 4. Update vendor_profiles RLS: Restrict base table to owners/admins only
DROP POLICY IF EXISTS "Users can view all published vendor profiles" ON public.vendor_profiles;

-- Owners can view their own profiles
CREATE POLICY "Owners can view their vendor profiles"
ON public.vendor_profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Hosts can view vendor profiles linked to them
CREATE POLICY "Hosts can view linked vendor profiles"
ON public.vendor_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM host_vendor_links
    WHERE host_vendor_links.vendor_profile_id = vendor_profiles.id
    AND host_vendor_links.host_user_id = auth.uid()
  )
);