
-- Remove dangerous direct INSERT policy for regular users
-- Bookings are created ONLY by the stripe-webhook edge function (service role)
DROP POLICY IF EXISTS "Users can create their own bookings" ON public.bookings;

-- Remove dangerous direct UPDATE policy for regular users
-- Bookings are updated ONLY by cancel-booking and stripe-webhook edge functions (service role)
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;
