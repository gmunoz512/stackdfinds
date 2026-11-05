# Contract for agents working on this repo

1. `main` = old dark site (deploys to GitHub Pages). Never push cream code to `main` without the owner's OK. Cream base branch: `cream-main`.
2. Never commit secrets: `.env*`, Google `GOCSPX-…` secrets, Supabase service-role keys, Stripe keys, Apple `.p8` keys. Client uses `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY` from the environment only.
3. Supabase project `ilityngsjxknvxtqrgav` is Lovable-controlled: write migration files only; never apply, delete, or change schema directly.
4. Before merging: `npx tsc -p tsconfig.app.json --noEmit`, `npm run build`, `npm test` pass; phone (390px) + desktop screenshots checked; FEATURES.md updated.
5. OAuth must go through `startOAuth` (src/lib/oauth.ts) — never a plain in-frame redirect.
6. No hardcoded sample hosts/vendors in production paths; `src/data/mockData.ts` is for demos only.
