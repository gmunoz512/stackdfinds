-- Create verification status enum
CREATE TYPE public.vendor_verification_status AS ENUM (
  'draft',
  'pending',
  'approved',
  'rejected',
  'changes_requested'
);

-- Add verification columns to vendor_profiles
ALTER TABLE public.vendor_profiles
  ADD COLUMN verification_status public.vendor_verification_status DEFAULT 'draft',
  ADD COLUMN verification_notes text,
  ADD COLUMN verified_at timestamptz,
  ADD COLUMN verified_by uuid REFERENCES auth.users(id),
  ADD COLUMN submitted_for_review_at timestamptz;

-- Grandfather existing published vendors as approved
UPDATE public.vendor_profiles 
SET verification_status = 'approved'
WHERE is_published = true;

-- Create admin-only policy for updating verification status
CREATE POLICY "Admins can update vendor verification status"
  ON public.vendor_profiles
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Create policy to allow admins to view all vendor profiles
CREATE POLICY "Admins can view all vendor profiles"
  ON public.vendor_profiles
  FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));