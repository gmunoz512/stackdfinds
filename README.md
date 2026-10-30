# stackd

stackd is a guest-first booking app for local experiences and restaurants, starting with Tulum. Guests can browse listings and plan a trip without an account. Signing in is required to book, save, or pay. Hosts share a guide with their guests. Vendors publish experiences and restaurants and get paid through Stripe.

The web app is React, Vite, TypeScript, and Tailwind. Data and auth live in Supabase. An iOS build is a Capacitor wrapper around the same web bundle.

## Setup

You need Node.js 20+ and npm.

```sh
cp .env.example .env
npm install
npm run dev
```

The dev server runs at http://localhost:8080.

### Environment

| Variable | Where | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | Vite client | Supabase project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Vite client | Supabase anon key |
| `VITE_GOOGLE_MAPS_API_KEY` | Vite client | Optional Google Maps calls from the browser |
| `VITE_SITE_URL` | Vite client | Public origin for titles, Open Graph, and absolute links. No trailing slash. |

Edge functions read secrets from the Supabase project, not from the Vite bundle:

- `SITE_URL` — same public origin, used for CORS and password-reset redirects
- `AI_GATEWAY_URL`, `AI_GATEWAY_API_KEY`, `AI_GATEWAY_MODEL` — OpenAI-compatible chat endpoint for the trip planner, vendor descriptions, and price comparison. The model defaults to `gpt-4o-mini` when unset. Those features fail closed until the URL and key are set.
- Stripe, Mapbox, Resend, and Google Places keys stay in Supabase secrets (`STRIPE_SECRET_KEY`, `MAPBOX_ACCESS_TOKEN`, and the keys each function already reads).

Do not commit `.env` or service-role keys.

## Build

```sh
npm run build
npm run preview
```

`npm run build` writes a static site to `dist/`.

## Deploy

Vercel or Netlify can host the static build.

- Build command: `npm run build`
- Output directory: `dist`
- Set the `VITE_*` variables in the host's environment before building. Vite inlines them at build time.
- Add the SPA fallback so client routes serve `index.html`.

Deploy Supabase separately: link the project with the Supabase CLI, apply `supabase/migrations`, and deploy `supabase/functions`. The vetted badge reads `verification_status` and `verified_at` from the public vendor view. Apply `supabase/migrations/20261026060000_public_vetting_fields.sql` or the badge stays hidden.

Google and Apple sign-in are Supabase Auth providers (`signInWithOAuth`). Configure the providers, redirect URLs, and the site URL in the Supabase dashboard. They are not provided by Lovable.

## iOS

`capacitor.config.ts` uses app id `app.stackd.ios`, app name `stackd`, and bundles `dist` locally. There is no remote `server.url`.

```sh
npm run build
npx cap add ios   # first time only
npx cap sync ios
```

Open the Xcode project on a Mac, set the signing team there, and archive. This repo does not set a signing team or change payment configuration.

## Ratings and trust

A Google rating is shown only when it comes from live Google reviews, a place record marked `isFromApi`, or `vendor_profiles.google_rating`. Otherwise the UI says "No rating yet". The vetted badge appears only when a listing is admin-approved (`verification_status = approved`) and has a `verified_at` timestamp. Reviews are real guest, Google, or Airbnb comments. Empty sections say there are no reviews yet.

## What you own outside this repo

The Supabase project id is in `supabase/config.toml`. The database, auth providers, storage buckets, edge-function secrets, and Stripe account are not part of this git history. To run stackd without Lovable you need access to that Supabase project (or a dump you restore into your own project) plus the API keys above. Mapbox and Stripe stay in Supabase secrets. The published Lovable URLs are not used anymore; set `VITE_SITE_URL` to the domain you host.
