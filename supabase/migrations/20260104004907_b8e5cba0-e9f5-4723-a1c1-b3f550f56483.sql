-- Add price tiers column to vendor_profiles for flexible pricing
-- Format: [{ "name": "Breakfast", "price": 75 }, { "name": "Dinner", "price": 150 }]
ALTER TABLE public.vendor_profiles
ADD COLUMN price_tiers jsonb DEFAULT '[]'::jsonb;

-- Add a comment for clarity
COMMENT ON COLUMN public.vendor_profiles.price_tiers IS 'Array of pricing options with name and price, e.g. breakfast/lunch/dinner tiers';