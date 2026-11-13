# Project rules

- Restaurant reservation links must go through `buildReservationLink` (src/lib/reservations.ts) and open via `openExternalUrl` (src/lib/openExternalUrl.ts), never in an iframe — Resy and similar sites refuse embedding (blank page), and unvalidated links dead-end guests.
- External URLs on native open in the Capacitor in-app browser via `openExternalUrl`; web opens a new tab — keeps guests inside the app on phones.
- Read CONTRACT.md, FEATURES.md and STYLE_GUIDE.md before changing anything.
- Production deploys from `main` through GitHub Pages (`.github/workflows/pages.yml` → stackdfinds.com). Do not add another host config.
- Google/Apple sign-in must use `startOAuth` from src/lib/oauth.ts — providers refuse to load inside the phone-frame iframe.
