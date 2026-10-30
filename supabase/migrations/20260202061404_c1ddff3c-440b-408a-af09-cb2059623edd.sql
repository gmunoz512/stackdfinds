-- Phase 1: Database Security

-- 1.1 Create secure view for public vendor profile access
CREATE VIEW public.vendor_profiles_public
WITH (security_invoker = on)
AS SELECT 
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
  created_at
FROM vendor_profiles
WHERE is_published = true;

-- Grant access to view for all roles
GRANT SELECT ON public.vendor_profiles_public TO anon, authenticated;

-- 1.2 Deny public access to vendors table
CREATE POLICY "Deny anon access to vendors"
ON public.vendors
FOR SELECT
TO anon
USING (false);

-- Phase 2: Rate Limiting Infrastructure

-- 2.1 Create rate_limits table
CREATE TABLE public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create composite index for fast lookups
CREATE INDEX idx_rate_limits_lookup 
ON public.rate_limits(identifier, endpoint, window_start);

-- Enable RLS - deny all direct access (only service role uses this)
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- No RLS policies = deny all client access

-- Create cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM rate_limits 
  WHERE window_start < now() - interval '1 hour';
END;
$$;