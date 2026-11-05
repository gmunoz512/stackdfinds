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
- ⏳ "Are you a local business or property host?" homepage band; vendor dashboard commission preview; host guide builder + text share; native (Capacitor) OAuth deep link.
