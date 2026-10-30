BEGIN;

-- Keep payment state independent from booking and payout progress. The default
-- preserves existing inserts; the backfill maps the only historical terminal
-- values currently used by the application.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS payment_status text NOT NULL DEFAULT 'pending';

UPDATE public.bookings
SET payment_status = CASE
  WHEN status = 'refunded' THEN 'refunded'
  WHEN stripe_payment_intent_id IS NOT NULL AND status IN ('confirmed', 'completed') THEN 'paid'
  ELSE payment_status
END
WHERE payment_status = 'pending';

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_payment_status_check
  CHECK (payment_status IN ('pending', 'authorized', 'paid', 'failed', 'partially_refunded', 'refunded'));

COMMIT;
