-- Add affiliate commission percentage to vendor_profiles
ALTER TABLE public.vendor_profiles
ADD COLUMN commission_percentage numeric DEFAULT NULL;

-- Add a comment for clarity
COMMENT ON COLUMN public.vendor_profiles.commission_percentage IS 'Affiliate commission percentage offered to hosts (visible to hosts/vendors only)';