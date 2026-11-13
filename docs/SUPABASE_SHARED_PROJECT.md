# Shared Supabase project `ilityngsjxknvxtqrgav`

Nothing in this branch was applied to that project. No migration was run, and no edge function was deployed.

This repo and https://stackdfinds.com use the same database and the same function URLs. Treat a migration or a function deploy as a change to the live site, not only to this branch.

## `20261026060000_public_vetting_fields.sql`

Effect on readers: additive.

The statement drops and recreates `public.vendor_profiles_public`. It does not alter `vendor_profiles`. `verification_status` and `verified_at` already exist on the table; the previous view already filters on `verification_status = 'approved'`. The new view keeps that filter and every column from `20260308180135_6b1f026b-1cc8-4e20-ab80-f37afb088d2d.sql`, and appends `verification_status` and `verified_at`. `verified_by` stays off the view. `GRANT SELECT` is repeated for `anon` and `authenticated`.

Clients that select the previous column list (or `*`) still work. Extra columns in the response do not remove fields they already read, and the set of rows stays the same. A client that does not know the two new columns ignores them.

It is not a pure `ADD COLUMN`. `DROP VIEW` fails if another object depends on the view. Recreating the view also clears grants other than the two this file sets. The recreated view does not set `security_invoker`, which matches the last recreation of this view.

Do not apply it to `ilityngsjxknvxtqrgav` until you accept that drop-and-recreate on the shared database. This branch's vetted badge stays hidden until the view exposes those two columns.

## Edge functions and `AI_GATEWAY_*`

Deploying these functions onto `ilityngsjxknvxtqrgav` changes the live site.

`trip-planner-chat`, `generate-vendor-description`, and `price-comparison` require `AI_GATEWAY_URL` and `AI_GATEWAY_API_KEY`. The model defaults to `gpt-4o-mini`. Deploying them without those secrets makes the trip planner, vendor descriptions, and price comparison return a configuration error.

CORS for `trip-planner-chat`, `host-guide`, `tripadvisor-search`, `scrape-instagram`, `send-reset-otp`, and `verify-reset-otp` is localhost plus `SITE_URL` only. Password-reset redirects fall back to `SITE_URL` or `http://localhost:8080`.

Leave the functions that are already deployed on this project in place unless you intend to replace them. `google-places`, `google-reviews`, and `vendor-directions` are not in this repo.
