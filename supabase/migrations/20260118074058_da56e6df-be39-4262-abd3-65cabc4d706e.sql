-- Add itinerary_data column to store full itinerary JSON
ALTER TABLE public.shared_itineraries 
ADD COLUMN IF NOT EXISTS itinerary_data JSONB;

-- Add destination and date range for display
ALTER TABLE public.shared_itineraries 
ADD COLUMN IF NOT EXISTS destination TEXT,
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_shared_itineraries_share_token ON public.shared_itineraries(share_token);