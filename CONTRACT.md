# Contract for agents working on this repo

1. `main` = live cream site (GitHub Pages → stackdfinds.com). Feature work goes on a branch (e.g. `phase2-vendor-marketplace`); do **not** merge to `main` until German reviews. Never force-push `main`.
2. Never commit secrets: `.env*`, Google `GOCSPX-…` secrets, Supabase service-role keys, Stripe keys, Apple `.p8` keys. Client uses `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY` from the environment only.
3. Supabase project `ilityngsjxknvxtqrgav` is Lovable-controlled: write migration files only; never apply, delete, or change schema directly.
4. Before merging: `npx tsc -p tsconfig.app.json --noEmit`, `npm run build`, `npm test` pass; phone (390px) + desktop screenshots checked; FEATURES.md updated.
5. OAuth must go through `startOAuth` (src/lib/oauth.ts) — never a plain in-frame redirect.
6. No hardcoded sample hosts/vendors in production paths; `src/data/mockData.ts` is for demos only.
7. Host guide JSON (`profiles.recommendations`) is public via `host-guide`: only write name/area/photo + vendor ids/notes/sections/positions there, through `serializeGuide` (src/lib/hostGuide.ts). Never write addresses, phone numbers or URLs other than https photo links.
8. Links leaving a guide must go through `withHostRef` so the `host` param is kept for commission.

- Host-facing commission reads `vendor_profiles.commission_percentage`; guest pages must not render it.
- Guide entry order (`position`) defines the Top 8: positions 0-7 are the Top 8. Tiles link to `/vendor/:id/book?host=<hostUserId>`.

- Share links: `/guide/<hostId>?host=<hostId>[&guest=<name>]` (src/lib/shareGuide.ts). `guest` is display-only (max 40 chars, no markup) and is never stored. No SMS service is called.
