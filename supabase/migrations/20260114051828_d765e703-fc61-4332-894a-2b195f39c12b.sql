-- Add sort_order for drag-and-drop reordering
ALTER TABLE public.itinerary_items 
ADD COLUMN sort_order INTEGER DEFAULT 0;

-- Add sharing functionality
ALTER TABLE public.itinerary_items 
ADD COLUMN share_token UUID DEFAULT gen_random_uuid();

-- Create a shared_itineraries table to group items for sharing
CREATE TABLE public.shared_itineraries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  title TEXT DEFAULT 'My Tulum Itinerary',
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on shared_itineraries
ALTER TABLE public.shared_itineraries ENABLE ROW LEVEL SECURITY;

-- Users can view their own shared itineraries
CREATE POLICY "Users can view their own shared itineraries"
ON public.shared_itineraries
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own shared itineraries
CREATE POLICY "Users can create their own shared itineraries"
ON public.shared_itineraries
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own shared itineraries
CREATE POLICY "Users can update their own shared itineraries"
ON public.shared_itineraries
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own shared itineraries
CREATE POLICY "Users can delete their own shared itineraries"
ON public.shared_itineraries
FOR DELETE
USING (auth.uid() = user_id);

-- Anyone can view public shared itineraries by token
CREATE POLICY "Anyone can view public shared itineraries"
ON public.shared_itineraries
FOR SELECT
USING (is_public = true);

-- Anyone can view itinerary items for public shared itineraries
CREATE POLICY "Anyone can view items from public itineraries"
ON public.itinerary_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.shared_itineraries si
    WHERE si.user_id = itinerary_items.user_id
    AND si.is_public = true
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_shared_itineraries_updated_at
BEFORE UPDATE ON public.shared_itineraries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();