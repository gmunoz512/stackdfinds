
-- Create host verification status enum
CREATE TYPE public.host_verification_status AS ENUM ('unverified', 'pending_verification', 'verified', 'rejected');

-- Add verification columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN host_verification_status public.host_verification_status NOT NULL DEFAULT 'unverified',
  ADD COLUMN government_id_url text,
  ADD COLUMN selfie_url text,
  ADD COLUMN verified_phone text,
  ADD COLUMN host_verification_notes text,
  ADD COLUMN host_verified_at timestamp with time zone,
  ADD COLUMN host_verified_by uuid;

-- Create private storage bucket for verification documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('host-verification-docs', 'host-verification-docs', false);

-- RLS: Hosts can upload to their own folder
CREATE POLICY "Hosts can upload their own verification docs"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'host-verification-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- RLS: Hosts can view their own verification docs
CREATE POLICY "Hosts can view their own verification docs"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'host-verification-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- RLS: Admins can view all verification docs
CREATE POLICY "Admins can view all verification docs"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'host-verification-docs'
    AND has_role(auth.uid(), 'admin'::app_role)
  );

-- RLS: Hosts can update/replace their own docs
CREATE POLICY "Hosts can update their own verification docs"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'host-verification-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- RLS: Hosts can delete their own docs
CREATE POLICY "Hosts can delete their own verification docs"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'host-verification-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Restrict self-update of verification fields on profiles
-- Drop and recreate the profiles update policy to prevent hosts from self-verifying
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    -- Prevent self-modification of admin-only verification fields
    AND host_verification_status IS NOT DISTINCT FROM (SELECT p.host_verification_status FROM profiles p WHERE p.user_id = auth.uid())
    AND host_verified_at IS NOT DISTINCT FROM (SELECT p.host_verified_at FROM profiles p WHERE p.user_id = auth.uid())
    AND host_verified_by IS NOT DISTINCT FROM (SELECT p.host_verified_by FROM profiles p WHERE p.user_id = auth.uid())
    AND host_verification_notes IS NOT DISTINCT FROM (SELECT p.host_verification_notes FROM profiles p WHERE p.user_id = auth.uid())
  );

-- Admin policy to update verification status on profiles
CREATE POLICY "Admins can update host verification status"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admin policy to view all profiles for verification review
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
