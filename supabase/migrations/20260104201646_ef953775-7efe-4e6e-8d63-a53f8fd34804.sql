-- Create junction table for host-vendor relationships
-- Multiple hosts can add the same vendor
CREATE TABLE public.host_vendor_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_user_id uuid NOT NULL,
  vendor_profile_id uuid NOT NULL REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(host_user_id, vendor_profile_id)
);

-- Enable RLS
ALTER TABLE public.host_vendor_links ENABLE ROW LEVEL SECURITY;

-- Hosts can view their own vendor links
CREATE POLICY "Hosts can view their vendor links"
ON public.host_vendor_links
FOR SELECT
USING (auth.uid() = host_user_id);

-- Hosts can add vendors to their profile
CREATE POLICY "Hosts can add vendors"
ON public.host_vendor_links
FOR INSERT
WITH CHECK (auth.uid() = host_user_id);

-- Hosts can remove vendors from their profile
CREATE POLICY "Hosts can remove vendors"
ON public.host_vendor_links
FOR DELETE
USING (auth.uid() = host_user_id);

-- Add host_user_id to bookings to track which host referred the guest
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS host_user_id uuid;

-- Update platform fee to 3%
UPDATE public.platform_settings SET platform_fee_percentage = 3;