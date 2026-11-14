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
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Vite client | Supabase anon (publishable) key. Public in the browser bundle. |
| `VITE_SITE_URL` | Vite client | Public origin for titles, Open Graph, and absolute links. No trailing slash. |

Edge functions read secrets from the Supabase project, not from the Vite bundle:

- `SITE_URL` — same public origin, used for CORS and password-reset redirects
- `AI_GATEWAY_URL`, `AI_GATEWAY_API_KEY`, `AI_GATEWAY_MODEL` — OpenAI-compatible chat endpoint for the trip planner, vendor descriptions, and price comparison. The model defaults to `gpt-4o-mini` when unset. Those features fail closed until the URL and key are set.
- Stripe, Mapbox, and Resend keys stay in Supabase secrets (`STRIPE_SECRET_KEY`, `MAPBOX_PUBLIC_TOKEN`, and the keys each function already reads). The browser does not call Google Maps or Places. Listing maps use Mapbox. A "open in Google Maps" link is a normal maps.google.com URL and does not use an API key.

Do not commit `.env` or service-role keys.

## Build

```sh
npm run build
npm run preview
```

`npm run build` writes a static site to `dist/`.

## Deploy

`main` deploys to GitHub Pages at https://stackdfinds.com. The workflow is `.github/workflows/pages.yml`.

- Build command: `npm run build`
- Output directory: `dist`
- The workflow sets `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from the repository variables `VITE_STACKD_SUPABASE_URL` and `VITE_STACKD_SUPABASE_ANON_KEY`, and `VITE_SITE_URL` to `https://stackdfinds.com`.
- It copies `dist/index.html` to `dist/404.html` so client routes load the app.

The top-level page shows the app inside a phone frame. The frame loads the same bundle. Do not embed Resy or other reservation sites in that frame; those links go through `openExternalUrl`.

Supabase project `lryeshzwwhcdtzemeyzk` (Stackd) is the live database. Schema changes are migration files in `supabase/migrations/`. The vetted badge reads `verification_status` and `verified_at` from the public vendor view.

Google and Apple sign-in are Supabase Auth providers. The app starts them with `startOAuth` in `src/lib/oauth.ts`. Configure the providers, redirect URLs, and the site URL in the Supabase dashboard.

## iOS

`capacitor.config.ts` uses app id `app.stackd.ios`, app name `stackd`, and bundles `dist` locally. There is no remote `server.url`.

```sh
npm run build
npx cap add ios   # first time only
npx cap sync ios
```

Open the Xcode project on a Mac, set the signing team there, and archive. This repo does not set a signing team or change payment configuration.

## Ratings and trust

A Google rating is shown only when `resolveGoogleRating` (`src/lib/googleRating.ts`) has a catalog rating or a place record. The browser and the app do not call the Google Places API. Otherwise the UI says "No rating yet". The vetted badge appears only when a listing is admin-approved (`verification_status = approved`) and has a `verified_at` timestamp. Reviews are real guest comments or text already stored with the listing. Empty sections say there are no reviews yet.

## What you own outside this repo

The Supabase project id is in `supabase/config.toml` (`lryeshzwwhcdtzemeyzk`). The database, auth providers, storage buckets, edge-function secrets, and Stripe account are not part of this git history. Mapbox and Stripe stay in Supabase secrets. Set `VITE_SITE_URL` to the domain you host.
