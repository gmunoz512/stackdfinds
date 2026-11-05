-- Add listing_type column to vendor_profiles
ALTER TABLE public.vendor_profiles 
ADD COLUMN listing_type text NOT NULL DEFAULT 'experience' 
CHECK (listing_type IN ('restaurant', 'experience'));