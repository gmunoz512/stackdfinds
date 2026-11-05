-- Add Airbnb URL and reviews columns to vendor_profiles
ALTER TABLE public.vendor_profiles
ADD COLUMN IF NOT EXISTS airbnb_experience_url text,
ADD COLUMN IF NOT EXISTS airbnb_reviews jsonb DEFAULT '[]'::jsonb;