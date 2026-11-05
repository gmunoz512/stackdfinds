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

## Phase 3 — host guides (branch `phase3-host-guides`)
- ✅ **Guide builder** `/host/guide` (new "Guide" tab in host bottom nav): property profile (name e.g. Casa Sol, area, photo uploaded to `vendor-photos/<user id>/property-*`), list of vendors the host added in `/host/marketplace`, move up/down to order, section per vendor (Tours & adventures, Water & beach, Food & drink, Wellness, Culture, Nightlife, Getting around, Other), optional tip per vendor (280 chars). Save writes `profiles.recommendations`.
- ✅ **Public guide** `/guide/:hostId`, no login: property photo/name/area, "Picked by <first name>", picks grouped by section in the host's order, photo, Google rating (or "New"), avg cost per person, host tip, heart to save (stored on the device), "See details" → vendor page.
- ✅ **Affiliate attribution**: every link out of the guide carries `?host=<host user id>` (`withHostRef`), which the vendor page/booking form already read.
- ✅ **No schema change**: guide data reuses `profiles.recommendations` (JSON array; property stored as a `type:"property"` item; entries gain optional `note`, `category`, `position`). Public read goes through the existing `host-guide` edge function. Older readers ignore the extra fields.
- ✅ **Fixes**: guest "add to guide" (ProfileContext) no longer wipes property/notes/order; host onboarding card no longer overwrites the guide array, no longer puts the property name into `full_name`, and only stores name + city publicly (address/Airbnb URL were being exposed through the public guide JSON).
- ⏳ Text sharing with guest names (Phase 4); guide hearts synced to an account (needs a wishlist decision); restaurants in the guide builder (guest-side add still works).

### Host commission visibility + Top 8 profile (Phase 3 update)
- /host/marketplace cards show "N% commission" and "You earn $X per $100" (from src/lib/commissions.ts); sort by commission (highest/lowest). Missing value shows "Commission not set".
- /host/guide rows show the same badge. First 8 picks are labelled "Top 8"; the rest are "More picks". Reorder with the arrows.
- /guide/:hostId is a picture-first host profile: property photo, name, area, "Picked by", then a Top 8 photo grid. Each tile goes straight to /vendor/:id/book?host=<hostId>. Picks past 8 show in a smaller "More picks" list.
- Commission is never shown on the public guide (guarded by a test).

### Phase 4: Share by text
- /host/guide has a "Share by text" button (after the guide is saved). It opens a form: guest name, optional phone, optional arrival date, editable message.
- "Share by text" is an `sms:` link with the message and the link prefilled. It only opens the messages app; nothing is sent by stackd.
- "More options" uses the phone's share sheet (Web Share API) when available. "Copy link" always works. A QR code is shown for in-person sharing. "Pick from contacts" appears only where the browser supports the Contact Picker, and only when the host taps it.
- Link format: https://stackdfinds.com/guide/<hostId>?host=<hostId>&guest=<name>. The guest page greets the guest by name.

### Phase 5: Guest booking (branch phase5-guest-booking, not merged)
- /vendor/<id>/book?host=<hostId>: pick date, time, party size; price summary shows subtotal, "Service fees $0" (guests pay no separate fee) and total. No sign-in needed to get this far.
- The host is remembered in localStorage/sessionStorage (`stackd_host_ref`, 30 days, latest host link wins) and carried through sign-in, payment and confirmation.
- Payment step: "Sign in or create an account", or "Continue as guest" with name + email. Payment uses the existing Stripe Checkout (test mode only). If guest checkout isn't available yet, the page says "Guest checkout is coming soon… Nothing was charged."
- Guest checkout needs migration 20261105020000_phase5_guest_bookings.sql plus redeploying create-booking-checkout and stripe-webhook. Neither is done yet.
- Sample listings are gone: old /experience/:id and /book/:id sample links show "This listing isn't available". Wishlists and guides no longer show mock experiences or restaurants.
