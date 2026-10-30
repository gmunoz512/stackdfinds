
-- Add new columns for "Meet the Vendor" and "Where you'll meet" sections
ALTER TABLE public.vendor_profiles
  ADD COLUMN IF NOT EXISTS host_bio text,
  ADD COLUMN IF NOT EXISTS host_avatar_url text,
  ADD COLUMN IF NOT EXISTS meeting_point_description text;

-- Recreate the public view to include these new columns
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
  FROM public.vendor_profiles
  WHERE is_published = true
    AND verification_status = 'approved';
