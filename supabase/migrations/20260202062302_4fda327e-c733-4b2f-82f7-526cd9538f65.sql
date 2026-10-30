-- Add explicit anonymous deny policies for critical tables
-- These prevent anon users from even attempting to read these tables

-- Deny anonymous access to profiles table
CREATE POLICY "Deny anon access to profiles"
ON public.profiles
FOR SELECT
TO anon
USING (false);

-- Deny anonymous access to bookings table  
CREATE POLICY "Deny anon access to bookings"
ON public.bookings
FOR SELECT
TO anon
USING (false);

-- Deny anonymous access to itinerary_collaborators table
CREATE POLICY "Deny anon access to itinerary_collaborators"
ON public.itinerary_collaborators
FOR SELECT
TO anon
USING (false);

-- Deny anonymous access to itinerary_items table
CREATE POLICY "Deny anon access to itinerary_items"
ON public.itinerary_items
FOR SELECT
TO anon
USING (false);

-- Deny anonymous access to shared_itineraries table
CREATE POLICY "Deny anon access to shared_itineraries"
ON public.shared_itineraries
FOR SELECT
TO anon
USING (false);

-- Deny anonymous access to itineraries table (except public ones)
CREATE POLICY "Deny anon access to private itineraries"
ON public.itineraries
FOR SELECT
TO anon
USING (is_public = true);