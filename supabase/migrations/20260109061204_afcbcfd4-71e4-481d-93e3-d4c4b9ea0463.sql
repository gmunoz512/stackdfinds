-- Add age_restriction column to vendor_profiles table
ALTER TABLE public.vendor_profiles 
ADD COLUMN age_restriction text NOT NULL DEFAULT 'family_friendly' 
CHECK (age_restriction IN ('family_friendly', 'adults_only'));