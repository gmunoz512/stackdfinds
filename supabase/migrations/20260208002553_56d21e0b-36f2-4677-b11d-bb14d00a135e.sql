
-- Fix security definer on the vendor_profiles_public view
ALTER VIEW public.vendor_profiles_public SET (security_invoker = on);
