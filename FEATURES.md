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
- 🟡 Migration `supabase/migrations/20261105010000_phase2_commission_tiers.sql` — CHECK constraint + comment; **German must review/apply** on shared project `ilityngsjxknvxtqrgav`. UI works without it.
- ✅ Host guide builder, text share, guest booking, and affiliate ledger land in later phase sections below.

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

## Phase 6 — affiliate accounting / Airbnb-style payouts (branch `payout-model`)
- ✅ **Commission math** stays in `src/lib/commissions.ts` (host 10/11/12% → stackd 3%; 15% → 2.5%; 17% → 2%). Vendor pays stackd's cut; host keeps the full commission. Guests pay listed price.
- ✅ **Airbnb-style hold**: after a guest pays, vendor payout and host commission are held until **24 hours after the reservation date** (`booking_date` via `parseBookingDate` + 24h). Then both show as Released. Status comes from `classifyAffiliateStatus` (pending / upcoming / released / refunded / failed).
- ✅ **Ledger helpers** in `src/lib/affiliateAccounting.ts`: `releaseAtFromBookingDate`, `summarizeVendorPayouts`, `summarizeHostEarnings`, `summarizeStackd`. Read-only — no money movement from these screens.
- ✅ **Vendor payouts** `/vendor/affiliate` ("Your payouts"): Upcoming vs Released totals; per booking shows net you receive, host commission, stackd fee, and release date. Linked from vendor dashboard + profile. `/vendor/revenue` still shows by-service revenue.
- ✅ **Host earnings** `/host/earnings`: Upcoming vs Released commission on the same 24h timeline. Linked from host dashboard + profile.
- ✅ **Admin affiliate summary** `/admin/affiliate`: booking volume, stackd fees, host commissions, vendor payouts split upcoming/released. Admin role via `has_role`.
- ✅ **Payout history** host + vendor: same classifier; dollar amounts (no /100). No fake sample rows.
- ✅ Cream ledger styling (`src/styles/ledger.css`): Georgia serif light headings, pine `#153d30` on cream.
- ✅ Tests: `tests/affiliate/affiliateAccounting.test.ts` + existing `tests/commissions/*`.
- ⏳ Phase 7 QA / end-to-end Alex–Casa Sol–Sarah run; real payout release remains behind Stripe connect + release-payouts (unchanged).

- ⏳ Real payout transfer still needs Stripe Connect (or similar) + the scheduler `release-payouts` worker. UI only classifies held vs released; it does not move money.
- ⏳ Phase 7 QA / end-to-end Alex–Casa Sol–Sarah run.

### Vendor accounts (site live; functions not deployed yet)
- /admin/vendors/new (admins only): enter the business name and category. A username is suggested (`tacos-numero-uno`: lowercase letters, numbers and single dashes, 3–30 chars) and the admin can edit it. On create, the server checks it's free, generates a 20-character random password, adds the vendor role and a draft (unpublished) Tulum vendor profile.
- Username and password are shown once with Copy buttons. The password is never stored in plain text or logged.
- No mailbox is created. Supabase Auth needs an email, so the login uses a hidden address `<username>@vendors.stackdfinds.com` (email_confirm true, never shown to vendors, nothing receives mail there). The username is kept in `app_metadata.vendor_username` (only the server can set it) and copied to `user_metadata.username` for display. No schema change.
- Sign in (/auth, sign-in mode): the field is "Email or username". No `@` means a username: we try the hidden address first, then the `vendor-username-sign-in` function (for vendors who later switched to their own email). Errors say "Wrong username/email or password".
- First login: `user_metadata.must_change_password = true` sends every page to /set-password (New + Confirm password, 6–72 chars, breach check). No skip. After saving, an optional "Add your email" step (Skip for now) then /vendor/edit-profile.
- Preferred email: /vendor/account-email (linked from vendor Settings) and the step above. Uses `supabase.auth.updateUser({ email })`, so Supabase sends a confirmation link to the new address. Until it's confirmed, the hidden address stays the login. Once confirmed, the vendor can sign in with the email or the username.
- Edge functions `create-vendor-account` and `vendor-username-sign-in` are NOT deployed and Supabase Auth "Secure email change" is still on: both need a Supabase access token for project ilityngsjxknvxtqrgav. Until then the admin page says "Couldn't create the account. Is the function deployed?".
- Email forwarding (docs/email-routing-plan.md) is no longer needed.

### Airbnb experiences (branch `airbnb-experiences`)
- ✅ Static catalog from `data/airbnb-experiences.csv` (208 experiences, 107 businesses). `scripts/build-airbnb-experiences.mjs` writes `src/data/airbnbExperiences.generated.ts` and downloads listing photos into `public/experience-photos/<username>/<id>-N.jpg` (max 1200px, JPEG). No hotlinking. Listing URLs stay in the CSV and are not shown to guests.
- ✅ `/experiences` lists those experiences plus the 4 existing preview listings. One card per experience: title, business name (the name in parentheses, e.g. La Xolita), category, and rating/reviews only when the CSV has them. No invented prices or descriptions. “Show more” loads 24 at a time. A Businesses view groups the 107 vendors.
- ✅ `/experiences/:username` is the business page. `username` is the slug. The hero photo is the top experience’s main photo, the same file used on that business’s tile. Each experience links to its detail page and shows its price per person, or “Price on request” when the listing page had no per-guest price. A missing photo is a cream initials tile, never an emoji.
- ✅ `/experiences/:username/:experienceId` is the experience detail page. It reuses the Taco Tour preview layout: photo gallery, wishlist heart, category, price per person, essentials, about, what’s included, the same guest price summary (subtotal, service fees $0, total), price comparison for USD prices, a business block back to the vendor, and “Plan with this experience”. Share copies the stackd page. Empty facts are hidden. Guest pages do not link to Airbnb.
- ✅ Listing facts (price, duration, what’s offered, meeting area, city, languages, group size, description) are read from each public listing page by `scripts/build-airbnb-experiences.mjs` and stored in `src/data/airbnbExperiences.generated.ts`. Missing facts stay empty. Prices stay in the currency the page shows. A US “$” amount is stored as USD. No price is invented.
- ✅ Home section titles (“Local Favorite Eats”, “Local Favorite Experiences”, and “My Wishlists”) share one light Georgia size, `clamp(20px, 6.15vw, 28px)`, and stay on one line from 360px up.
- ✅ Categories are inferred from the title (Water Sports, Food & Drink, Tours & Culture, Wellness, Adventure, Workshops) and otherwise “Tour Guide”.
- ✅ The home explore list and saved-item lookup use the same catalog. The homepage rail still shows the 4 preview experiences.

### UI polish (branch `ui-polish`)
- ✅ Vendor and experience photos, plus host-guide Top 8 tiles, keep a cream placeholder and fade in. Broken vendor photos still fall back to initials, never emoji.
- ✅ Keyboard focus uses one pine ring. Listing cards, guide tiles, and marketplace cards press in slightly. Motion turns off when the device asks for less motion.
- ✅ Sign-in ("Email or username"), set-password, and add-email show an inline error or success message with the field, not only a toast.
- ✅ Vendor first login shows a two-step progress track: password, then optional email.
- ✅ Booking cancel dialogs use a cream panel, a light Georgia title, and a quiet confirm. The confirmation page no longer rains confetti.
- ✅ Vendor payouts (`/vendor/affiliate`) and host earnings (`/host/earnings`) lead with Released, and keep Upcoming as the smaller held amount.
