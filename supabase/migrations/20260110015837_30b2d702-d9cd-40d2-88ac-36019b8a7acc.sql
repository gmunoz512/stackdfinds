-- Add column to track reminder sent status
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_bookings_reminder_lookup 
ON public.bookings (booking_date, reminder_sent_at, status);