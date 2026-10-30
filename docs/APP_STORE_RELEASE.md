# Stackd Finds — iOS release readiness

This document is a release checklist, not evidence that the app is approved or submission-ready. The existing web UI has been preserved.

## Identity
- Current Capacitor bundle ID: `app.stackd.ios`.
- Current app display name: `stackd`.
- **Do not change the bundle ID** until you confirm whether an Apple Developer / App Store Connect record already exists for this identifier. Changing it creates a different app identity.
- Finalize app name, icon, splash screens, support URL, privacy policy URL and marketing screenshots before submission.

## Build and TestFlight
1. Set up the Supabase project, database migrations, storage, OAuth redirect URLs, Stripe and edge-function secrets. Do not put server secrets in Vite variables.
2. Configure client `VITE_*` variables from `.env.example` in the intended build environment.
3. Run `npm ci`, `npm run build`, `npm test -- --run` and fix failures.
4. On a Mac with Xcode and an Apple Developer team, run `npx cap add ios` if the iOS platform folder does not exist, then `npx cap sync ios`.
5. In Xcode set the signing team, bundle ID and deployment target; build an archive and upload to App Store Connect.
6. Distribute through TestFlight and test on physical devices.

## Manual acceptance tests
- Guest browsing, filters, high-resolution images and responsive layouts.
- Navigation, deep links, offline/loading states, light/dark glass styling, accessibility and safe areas.
- Authentication (Apple and Google), account deletion, password recovery and privacy disclosures.
- Listing details, wishlists, bookings, payment success/failure, cancellation and refunds.
- Host and vendor onboarding, permissions, verification, commissions and payouts.
- Map permissions and the correct location-use disclosures.
- No placeholder listings, unsupported ratings, broken links or debug-only features in production.

## App Store requirements to check
- Confirm Apple's current App Review Guidelines and privacy-manifest / required-reason API rules at submission time.
- Submit accurate App Privacy answers based on actual data collected by Supabase, payment providers and analytics.
- Provide reviewer credentials or demo mode for login-gated functionality and explain the booking/payment workflow.
- Confirm whether real-world services / experiences use outside payment methods permitted under Apple's rules.
- Provide functional privacy policy, support and account deletion instructions.

## Outstanding blockers
- CI outcome, native archive and TestFlight validation have not yet been verified.
- Production credentials, Apple team, App Store Connect configuration, legal/privacy information and live back-end data require owner verification.
- This repository is independent; do not sync future work from the old repo automatically.
