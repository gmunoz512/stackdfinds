-- Create vendor_profiles table for detailed vendor/experience information
CREATE TABLE public.vendor_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID REFERENCES public.vendors(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Basic info
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  about_experience TEXT, -- AI-generated description
  
  -- Instagram data
  instagram_url TEXT,
  photos TEXT[] DEFAULT '{}', -- Array of photo URLs scraped from Instagram
  
  -- Menu/documents
  menu_url TEXT, -- URL to uploaded menu in storage
  
  -- Pricing & logistics
  price_per_person NUMERIC,
  duration TEXT, -- e.g., "2 hours", "24 hours", "Flexible"
  max_guests INTEGER,
  included_items TEXT[] DEFAULT '{}', -- Array of what's included
  
  -- Google reviews integration
  google_place_id TEXT,
  google_rating NUMERIC,
  google_reviews_url TEXT,
  
  -- Status
  is_published BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vendor_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies - hosts can manage their own vendor profiles
CREATE POLICY "Users can view all published vendor profiles"
ON public.vendor_profiles
FOR SELECT
USING (is_published = true OR auth.uid() = user_id);

CREATE POLICY "Users can create their own vendor profiles"
ON public.vendor_profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vendor profiles"
ON public.vendor_profiles
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vendor profiles"
ON public.vendor_profiles
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_vendor_profiles_updated_at
BEFORE UPDATE ON public.vendor_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for menus
INSERT INTO storage.buckets (id, name, public)
VALUES ('vendor-menus', 'vendor-menus', true);

-- Storage policies for menu uploads
CREATE POLICY "Anyone can view vendor menus"
ON storage.objects
FOR SELECT
USING (bucket_id = 'vendor-menus');

CREATE POLICY "Authenticated users can upload menus"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'vendor-menus' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own menus"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'vendor-menus' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own menus"
ON storage.objects
FOR DELETE
USING (bucket_id = 'vendor-menus' AND auth.uid()::text = (storage.foldername(name))[1]);