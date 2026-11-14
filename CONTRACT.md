# Contract for agents working on this repo

1. `main` = live cream site (GitHub Pages → stackdfinds.com). Feature work goes on a branch (e.g. `phase2-vendor-marketplace`); do **not** merge to `main` until German reviews. Never force-push `main`.
2. Never commit secrets: `.env*`, Google `GOCSPX-…` secrets, Supabase service-role keys, Stripe keys, Apple `.p8` keys. Client uses `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY` from the environment only.
3. Supabase project `ilityngsjxknvxtqrgav` is the live database: write migration files only; never apply, delete, or change schema directly. Do not point the app at a different project.
4. Before merging: `npx tsc -p tsconfig.app.json --noEmit`, `npm run build`, `npm test` pass; phone (390px) + desktop screenshots checked; FEATURES.md updated.
5. OAuth must go through `startOAuth` (src/lib/oauth.ts) — never a plain in-frame redirect.
6. No hardcoded sample hosts/vendors in production paths; `src/data/mockData.ts` is for demos only.
7. Host guide JSON (`profiles.recommendations`) is public via `host-guide`: only write name/area/photo + vendor ids/notes/sections/positions there, through `serializeGuide` (src/lib/hostGuide.ts). Never write addresses, phone numbers or URLs other than https photo links.
8. Links leaving a guide must go through `withHostRef` so the `host` param is kept for commission.

- Host-facing commission reads `vendor_profiles.commission_percentage`; guest pages must not render it.
- Guide entry order (`position`) defines the Top 8: positions 0-7 are the Top 8. Tiles link to `/vendor/:id/book?host=<hostUserId>`.

- Share links: `/guide/<hostId>?host=<hostId>[&guest=<name>]` (src/lib/shareGuide.ts). `guest` is display-only (max 40 chars, no markup) and is never stored. No SMS service is called.

## Stackd project (booking requests, payout details, host pages)
- These features use Supabase project `lryeshzwwhcdtzemeyzk` through `src/integrations/stackd/client.ts` (`VITE_STACKD_SUPABASE_URL`, `VITE_STACKD_SUPABASE_ANON_KEY`). Do not point `src/integrations/supabase/client.ts` at that project.
- Do not read or write project `ilityngsjxknvxtqrgav` for these features, and do not apply migrations `20261114120000_stackd_booking_requests.sql`, `20261114121000_stackd_vendor_payout_details.sql`, or `20261114122000_stackd_host_pages.sql` there.
- `create-booking-request` deploys only to Stackd. It inserts with the service role after recomputing the price. Guests have no select policy.
- Vendor rows are matched with `app_metadata.vendor_username`. `user_metadata.username` is display only.
- Host pages use the Stackd auth user id as `host_id`. They do not write `profiles.recommendations` or `host_vendor_links`.

## Booking & attribution (Phase 5)
- Host attribution: `src/lib/guestBooking.ts` is the only reader and writer of `stackd_host_ref`. A `?host=` in the URL beats the stored value.
- Pricing is computed server-side in create-booking-checkout (the tier is priced there). The client summary is only for display. Guests pay $0 in fees. The vendor pays stackd's cut, and the host keeps the full commission.
- Stripe stays in test mode. No live charges until the owner configures them.
- Schema changes ship as migration files only. Never apply them to the shared Supabase project from an agent.

## Affiliate accounting / payouts (Phase 6)
- Ledger status comes from `classifyAffiliateStatus` in `src/lib/affiliateAccounting.ts` (pending / upcoming / released / refunded / failed). Release time is `parseBookingDate(booking_date) + 24h` via `releaseAtFromBookingDate`. Do not invent a second status map in pages.
- Host, vendor, and admin earnings views are read-only over `bookings`. They never create transfers, call release-payouts, or write payout_status.
- Amounts on `bookings` are dollars (webhook stores cents/100). Never divide by 100 again in UI formatters.
- Money rules stay in `src/lib/commissions.ts`. Vendor pays stackd's cut; host keeps the full commission; guests pay listed price.
- Vendor-facing copy is "Upcoming / Released payouts" (net of commission), not "fees owed".
- Admin affiliate summary requires the existing admin role check (`has_role` / ProtectedAdminRoute).

## Vendor accounts (usernames)
- Vendor usernames: 3–30 chars, lowercase letters/numbers/single dashes. Rules live in `src/lib/vendorAccounts.ts` and `supabase/functions/_shared/vendorUsernames.ts`; keep them identical.
- A username's login email is `<username>@vendors.stackdfinds.com`. Never show it to vendors (use `preferredEmail`). Never send mail to it.
- The source of truth for who owns a username is `app_metadata.vendor_username` (server-only). `user_metadata.username` is display only.
- Sign-in goes through `signInWithIdentifier` (src/lib/vendorSignIn.ts). `vendor-username-sign-in` must never return an email, and returns the same error for unknown username and wrong password.
- Generated passwords are returned once by create-vendor-account and never logged or stored in plain text.
- Email changes use `supabase.auth.updateUser({ email })`. Needs Supabase Auth "Secure email change" OFF, because the hidden address can't receive the second confirmation.
- No schema changes for this feature.
