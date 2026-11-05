# Tulum catalog integration

The home page consumes the existing Supabase `vendor_profiles_public` view and the curated restaurant catalog. No scraper, provider credentials, database migrations, or automated publication is introduced by this UI change.

## Publish imported listings through the existing backend

Stage scraped records on a trusted server and review them before publishing through the existing vendor workflow. Do not write service keys into the Vite app. Preserve stable provider IDs in your import system so refreshes update a record instead of duplicating it.

The home page currently reads these public fields:

| Field              | Expected value                                                                               |
| ------------------ | -------------------------------------------------------------------------------------------- |
| `id`               | Existing vendor profile identifier; used for detail routes and saved places                  |
| `name`             | Display name                                                                                 |
| `listing_type`     | `restaurant` or `experience`                                                                 |
| `category`         | Display category                                                                             |
| `description`      | Optional description                                                                         |
| `photos`           | Optional array of permitted public image URLs                                                |
| `google_rating`    | Optional verified Google rating, 0–5; unknown stays null                                     |
| `price_per_person` | Optional numeric value; currency must be defined before the redesigned home displays a price |
| `is_published`     | Only published records are shown                                                             |

Store source URL, provider record ID, retrieval time, review count, photo attribution/permission, currency, and destination in the import system. Never map another provider's score into `google_rating`. Existing detail pages own reservations and bookings; keep using `buildReservationLink` and `openExternalUrl`.

The current public view does not include destination. This release is intentionally Tulum only. Before adding another destination, expose and enforce a destination filter on the public catalog; do not mix worldwide inventory into the Tulum feed. Future destination palettes and illustrations should be configuration-driven around `DestinationShell` and `DestinationHero`.

## Display behavior

Published listings automatically populate Local Favorite Eats and Local Favorite Experiences. Missing or broken images show a placeholder. Existing curated restaurant art is labeled illustrative until a live Google photo is available. The new home does not show curated mock ratings. Missing reviews stay unknown. Empty searches, loading inventory, and empty experiences have explicit states.

## Entrance and responsive layout

The border and background sketch animate on the first visit in a tab, without preventing interaction or waiting for catalog requests. Reduced-motion preferences disable animation. Main, join, and planner share one theme. Mobile uses a four-item navigation bar with safe-area spacing; desktop uses the header.
