
-- Fix 1: Recreate itineraries_public with WHERE is_public = true
DROP VIEW IF EXISTS public.itineraries_public;
CREATE VIEW public.itineraries_public AS
  SELECT id, start_date, end_date, itinerary_data, is_confirmed,
         share_token, is_public, created_at, updated_at, destination
  FROM public.itineraries
  WHERE is_public = true;

-- Fix 2: Recreate vendor_profiles_public with proper filters
DROP VIEW IF EXISTS public.vendor_profiles_public;
CREATE VIEW public.vendor_profiles_public AS
  SELECT id, name, category, description, about_experience, photos,
         menu_url, instagram_url, duration, included_items,
         google_place_id, google_rating, google_reviews_url,
         airbnb_experience_url, airbnb_reviews, listing_type,
         age_restriction, city, host_bio, host_avatar_url,
         meeting_point_description, price_per_person, price_tiers,
         max_guests, is_published, cancellation_hours, created_at
  FROM public.vendor_profiles
  WHERE is_published = true AND verification_status = 'approved';
