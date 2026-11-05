# stackd features (cream UI)

Status legend: ✅ working in code · 🟡 needs setup outside code · ⏳ later phase

## Phase 1 — navigation & registration (branch `phase1-nav-registration`)
- ✅ **Join stackd dropdown** in the header: For Vendors (List your business), For Hosts (Create your local guide), For Guests (Explore experiences). Compact "Join" pill under 600px; the same three links head the hamburger menu.
- ✅ **Vendor landing** `/for-vendors`: "Your business. More guests. More bookings." + 4 steps (profile → listings → host commission → bookings). CTA → `/auth?role=vendor`.
- ✅ **Host landing** `/for-hosts`: "Your local favorites. Your guests. Your earnings." CTA → `/auth?role=host`.
- ✅ **Role-based sign-up** `/auth?role=…`; after sign-in: host → `/host/dashboard`, vendor → `/vendor/dashboard` (or `/vendor/create-profile` if no profile yet), guest → `/appview`.
- ✅ **No fake host**: `/storefront/:hostId` now redirects to the real guide `/guide/:hostId`; the guide loads published `vendor_profiles` instead of `mockData`. Unused guest `Storefront.tsx` (fake "Beach House Paradise") removed.
- ✅ **Google / Apple sign-in from the phone frame**: `src/lib/oauth.ts#startOAuth` uses `skipBrowserRedirect` and navigates the top window; `main.tsx` passes `/auth?code=` / `#access_token=` into the frame.
- ✅ **Pre-fill** name + email from Google/Apple on guest Profile and host Edit Profile (`getOAuthPrefill`).
- 🟡 Google/Apple provider client IDs + secrets in Supabase Auth (currently `missing OAuth secret`).
- 🟡 Supabase URL config: Site URL `https://stackdfinds.com`, redirects `https://stackdfinds.com/**`, `https://www.stackdfinds.com/**`.
- ⏳ "Are you a local business or property host?" homepage band; host guide builder + text share; native (Capacitor) OAuth deep link.

## Phase 2 — vendor marketplace (branch `phase2-vendor-marketplace`)
- ✅ **Commission tiers** centralized in `src/lib/commissions.ts`: host 10/11/12% → stackd 3%; 15% → 2.5%; 17% → 2%. Guests always pay listed price.
- ✅ **Vendor onboarding affiliate step**: create-profile commission select uses shared tiers; sample $100 booking split preview on the form.
- ✅ **Vendor dashboard affiliate card**: shows current split (or prompts to set a tier) with link to edit profile.
- ✅ **Host marketplace** `/host/marketplace`: browse published vendors who set a commission; category chips; search; add/remove from guide; rating + avg cost; hearts/saves kept on guest explore.
- ✅ **Host bottom nav** "Marketplace" → `/host/marketplace`; saved list stays at `/host/vendors`.
- ✅ **Active vendors fix**: reads `commission_percentage` (was wrongly using `host_commission_percentage`).
- ✅ **Vendor management** restyled cream/pine (no gradient header); links to marketplace; graceful empty states if link tables are missing.
- ✅ **og meta** in `index.html` points at `https://stackdfinds.com` (was chatgpt.site).
- 🟡 Migration `supabase/migrations/20261105010000_phase2_commission_tiers.sql` — CHECK constraint + comment; **German must review/apply** (Lovable-controlled Supabase). UI works without it.
- ⏳ Host guide builder (Phase 3) + text share (Phase 4); guest booking polish (Phase 5); affiliate ledger (Phase 6).
