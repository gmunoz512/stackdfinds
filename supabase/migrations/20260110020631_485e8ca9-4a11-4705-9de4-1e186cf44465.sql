-- Add cancellation policy hours to vendor_profiles (hours before booking that cancellation is allowed)
ALTER TABLE public.vendor_profiles 
ADD COLUMN cancellation_hours integer NOT NULL DEFAULT 24;

COMMENT ON COLUMN public.vendor_profiles.cancellation_hours IS 'Number of hours before the booking start time that guests can cancel';