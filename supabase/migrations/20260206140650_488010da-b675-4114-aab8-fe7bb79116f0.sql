
-- Fix vendor_profiles_public: remove security_invoker so guests can read
DROP VIEW IF EXISTS public.vendor_profiles_public;
CREATE VIEW public.vendor_profiles_public AS
SELECT
  id, name, category, description, about_experience,
  photos, menu_url, instagram_url, price_per_person,
  price_tiers, duration, max_guests, google_rating,
  google_place_id, google_reviews_url, airbnb_experience_url,
  airbnb_reviews, included_items, age_restriction,
  listing_type, is_published, cancellation_hours, created_at, city
FROM public.vendor_profiles
WHERE is_published = true;

-- Fix itineraries_public: remove security_invoker so anon can read shared trips
DROP VIEW IF EXISTS public.itineraries_public;
CREATE VIEW public.itineraries_public AS
SELECT
  id, destination, start_date, end_date,
  itinerary_data #- '{userId}' as itinerary_data,
  is_confirmed, share_token, is_public,
  created_at, updated_at
FROM public.itineraries
WHERE is_public = true;
