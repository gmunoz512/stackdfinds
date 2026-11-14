-- Phase 2: document / constrain vendor affiliate commission tiers.
-- Applied on Stackd (lryeshzwwhcdtzemeyzk) on 2026-11-14.

--
-- Live payout math (create-booking-checkout) already uses:
--   host 10/11/12% → stackd 3%
--   host 15%       → stackd 2.5%
--   host 17%       → stackd 2%
-- Source of truth in the web app: src/lib/commissions.ts

COMMENT ON COLUMN public.vendor_profiles.commission_percentage IS
  'Affiliate host commission % (10, 11, 12, 15, or 17). stackd fee is derived at checkout (3% for 10-12, 2.5% for 15, 2% for 17). Visible to hosts/vendors only.';

-- Soft-validate values when set. NULL remains allowed (vendor has not joined affiliate yet).
ALTER TABLE public.vendor_profiles
  DROP CONSTRAINT IF EXISTS vendor_profiles_commission_percentage_tier_check;

ALTER TABLE public.vendor_profiles
  ADD CONSTRAINT vendor_profiles_commission_percentage_tier_check
  CHECK (
    commission_percentage IS NULL
    OR commission_percentage IN (10, 11, 12, 15, 17)
  );

-- Note: host_commission_percentage is legacy. Checkout and UI use commission_percentage.
-- Do not drop host_commission_percentage here (Lovable / older rows may still reference it).
