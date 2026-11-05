-- Create itinerary_items table to store saved vendor recommendations
CREATE TABLE public.itinerary_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_name TEXT NOT NULL,
  vendor_address TEXT,
  place_id TEXT,
  travel_distance TEXT,
  travel_duration TEXT,
  travel_duration_seconds INTEGER,
  arrival_tips TEXT[],
  notes TEXT,
  planned_date DATE,
  planned_time TIME,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.itinerary_items ENABLE ROW LEVEL SECURITY;

-- Users can only view their own itinerary items
CREATE POLICY "Users can view their own itinerary items"
ON public.itinerary_items
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own itinerary items
CREATE POLICY "Users can create their own itinerary items"
ON public.itinerary_items
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own itinerary items
CREATE POLICY "Users can update their own itinerary items"
ON public.itinerary_items
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own itinerary items
CREATE POLICY "Users can delete their own itinerary items"
ON public.itinerary_items
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_itinerary_items_updated_at
BEFORE UPDATE ON public.itinerary_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();