# Supabase project `lryeshzwwhcdtzemeyzk` (Stackd)

stackdfinds.com runs on German's Stackd project. The repo's `supabase/config.toml` points at it, and the Pages build reads the Stackd URL and anon key from repository variables.

## Applied migrations

Everything in `supabase/migrations/` is applied on Stackd except `20260913160000_demo_vendor_seed.sql` (demo rows with sample photos; not for the live site).

## Edge functions

All functions in `supabase/functions/` are deployed on Stackd. `verify_jwt` follows `supabase/config.toml`.

`trip-planner-chat`, `generate-vendor-description`, and `price-comparison` require `AI_GATEWAY_URL` and `AI_GATEWAY_API_KEY`. The model defaults to `gpt-4o-mini`. Without those secrets the trip planner, vendor descriptions, and price comparison return a configuration error.

CORS for `trip-planner-chat`, `host-guide`, `tripadvisor-search`, `scrape-instagram`, `send-reset-otp`, and `verify-reset-otp` allows localhost, https://stackdfinds.com, and `SITE_URL` when set. Password-reset redirects fall back to https://stackdfinds.com.

`google-places`, `google-reviews`, and `vendor-directions` were removed and are not deployed.
