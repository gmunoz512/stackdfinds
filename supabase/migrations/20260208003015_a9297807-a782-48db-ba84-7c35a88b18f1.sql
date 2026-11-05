
-- Revert vendor_profiles_public to security definer (no security_invoker)
-- This is required so unauthenticated guests can browse published vendors
-- The base table remains protected by restrictive RLS policies
DROP VIEW IF EXISTS public.vendor_profiles_public;

CREATE VIEW public.vendor_profiles_public AS
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
    included_items,
    google_place_id,
    google_rating,
    google_reviews_url,
    airbnb_experience_url,
    airbnb_reviews,
    is_published,
    listing_type,
    age_restriction,
    cancellation_hours,
    city,
    created_at,
    host_bio,
    host_avatar_url,
    meeting_point_description
  FROM public.vendor_profiles;
