
-- Add 'suspended' to the vendor_verification_status enum
ALTER TYPE public.vendor_verification_status ADD VALUE IF NOT EXISTS 'suspended';

-- Recreate vendor_profiles_public view to also exclude suspended
CREATE OR REPLACE VIEW public.vendor_profiles_public AS
  SELECT
    id, name, category, description, about_experience, photos, menu_url,
    instagram_url, duration, included_items, google_place_id, google_rating,
    google_reviews_url, airbnb_experience_url, airbnb_reviews, listing_type,
    age_restriction, city, host_bio, host_avatar_url, meeting_point_description,
    price_per_person, price_tiers, max_guests, is_published, cancellation_hours,
    created_at
  FROM public.vendor_profiles
  WHERE is_published = true
    AND verification_status = 'approved';
