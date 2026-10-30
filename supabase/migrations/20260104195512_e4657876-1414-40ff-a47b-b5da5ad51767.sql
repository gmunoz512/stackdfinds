-- Create platform settings table for configurable commission
CREATE TABLE public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform_fee_percentage numeric NOT NULL DEFAULT 10,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insert default settings
INSERT INTO public.platform_settings (platform_fee_percentage) VALUES (10);

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can modify, everyone can read (for checkout calculations)
CREATE POLICY "Anyone can view platform settings"
ON public.platform_settings
FOR SELECT
USING (true);

-- Add Stripe Connect fields to vendor_profiles
ALTER TABLE public.vendor_profiles
ADD COLUMN IF NOT EXISTS stripe_account_id text,
ADD COLUMN IF NOT EXISTS stripe_onboarding_complete boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS host_user_id uuid,
ADD COLUMN IF NOT EXISTS host_commission_percentage numeric DEFAULT 15;

-- Add Stripe Connect fields to profiles (for hosts)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS stripe_account_id text,
ADD COLUMN IF NOT EXISTS stripe_onboarding_complete boolean DEFAULT false;

-- Add payout tracking to bookings
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS vendor_payout_amount numeric,
ADD COLUMN IF NOT EXISTS host_payout_amount numeric,
ADD COLUMN IF NOT EXISTS platform_fee_amount numeric,
ADD COLUMN IF NOT EXISTS payout_status text DEFAULT 'pending';

-- Update timestamp trigger for platform_settings
CREATE TRIGGER update_platform_settings_updated_at
BEFORE UPDATE ON public.platform_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();