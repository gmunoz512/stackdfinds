-- Security Fix: Revoke direct update access for users on bookings table
-- Users should use the cancel-booking Edge Function instead of directly modifying the table
-- This prevents users from altering prices, statuses, or other sensitive fields

DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;
