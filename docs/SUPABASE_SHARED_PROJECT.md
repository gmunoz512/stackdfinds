# Shared Supabase project `ilityngsjxknvxtqrgav`

Nothing in this branch was applied to that project. No migration was run, and no edge function was deployed.

The live Lovable app and this repo can point at the same database and the same function URLs. Treat a migration or a function deploy as a change to the Lovable app, not only to this branch.

## `20261026060000_public_vetting_fields.sql`

Effect on readers: additive.

The statement drops and recreates `public.vendor_profiles_public`. It does not alter `vendor_profiles`. `verification_status` and `verified_at` already exist on the table; the previous view already filters on `verification_status = 'approved'`. The new view keeps that filter and every column from `20260308180135_6b1f026b-1cc8-4e20-ab80-f37afb088d2d.sql`, and appends `verification_status` and `verified_at`. `verified_by` stays off the view. `GRANT SELECT` is repeated for `anon` and `authenticated`.

The Lovable client selects the old column list (or `*`). Extra columns in the response do not remove fields it already reads, and the set of rows stays the same. A client that does not know the two new columns ignores them.

It is not a pure `ADD COLUMN`. `DROP VIEW` fails if another object depends on the view. Recreating the view also clears grants other than the two this file sets. The recreated view does not set `security_invoker`, which matches the last recreation of this view.

Do not apply it to `ilityngsjxknvxtqrgav` until you accept that drop-and-recreate on the shared database. This branch's vetted badge stays hidden until the view exposes those two columns.

## Edge functions and `AI_GATEWAY_*`

Not compatible with the live Lovable app if deployed onto this project.

`trip-planner-chat`, `generate-vendor-description`, and `price-comparison` no longer call `https://ai.gateway.lovable.dev` or read `LOVABLE_API_KEY`. They require `AI_GATEWAY_URL` and `AI_GATEWAY_API_KEY`, and the model defaults to `gpt-4o-mini` instead of `google/gemini-2.5-flash`. Deploying them without those secrets makes the trip planner, vendor descriptions, and price comparison return a configuration error for the Lovable site as well.

`trip-planner-chat`, `host-guide`, `tripadvisor-search`, `scrape-instagram`, `send-reset-otp`, and `verify-reset-otp` no longer allow `*.lovable.app`, `*.lovableproject.com`, or `https://stackbnb-60920.lovable.app`. CORS is localhost plus `SITE_URL` only. A browser on the Lovable origin would be blocked. Password-reset redirects fall back to `SITE_URL` or `http://localhost:8080` instead of `https://stackbnb-60920.lovable.app`.

Leave the deployed functions on the shared project as they are while Lovable is the fallback. Run the rewritten functions only from a Supabase project this site owns.
