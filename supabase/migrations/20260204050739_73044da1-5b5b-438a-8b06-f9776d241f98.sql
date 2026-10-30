-- Add explicit deny policies for internal-only tables
-- These tables are only accessed via service_role key in edge functions

-- password_reset_otps: Only accessed by send-reset-otp and verify-reset-otp edge functions
CREATE POLICY "Deny all access to password_reset_otps"
  ON public.password_reset_otps
  FOR ALL
  USING (false);

-- rate_limits: Only accessed by edge functions for rate limiting
CREATE POLICY "Deny all access to rate_limits"
  ON public.rate_limits
  FOR ALL
  USING (false);