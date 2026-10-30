-- Create bookings table to store completed bookings
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  vendor_profile_id UUID REFERENCES public.vendor_profiles(id),
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  experience_name TEXT NOT NULL,
  vendor_name TEXT,
  booking_date TEXT NOT NULL,
  booking_time TEXT NOT NULL,
  guests INTEGER NOT NULL DEFAULT 1,
  total_amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Users can view their own bookings
CREATE POLICY "Users can view their own bookings"
ON public.bookings
FOR SELECT
USING (auth.uid() = user_id);

-- Service role can insert bookings (for webhook)
CREATE POLICY "Service role can insert bookings"
ON public.bookings
FOR INSERT
WITH CHECK (true);

-- Users can view bookings for their vendor profiles (for vendors)
CREATE POLICY "Vendors can view bookings for their profiles"
ON public.bookings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.vendor_profiles
    WHERE vendor_profiles.id = bookings.vendor_profile_id
    AND vendor_profiles.user_id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_bookings_updated_at
BEFORE UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();