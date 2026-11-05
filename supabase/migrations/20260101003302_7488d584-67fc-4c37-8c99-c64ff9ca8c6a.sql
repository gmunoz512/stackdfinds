-- Add recommendations jsonb column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN recommendations jsonb DEFAULT '[]'::jsonb;