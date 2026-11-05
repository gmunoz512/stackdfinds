# Findings 6–8: implementation and rollout

Baseline: tradingbanksy/stackbnb-60920 main, b07545e9388ffd595e443449b8e174cceaf1e7a7.
Findings 1–5 and their existing implementations are out of scope.

## Change A: host system fields and vendor trust scores

Migration 20260910120000 adds SECURITY INVOKER BEFORE INSERT/UPDATE guards.
Ordinary callers cannot set or change host stripe_account_id,
stripe_onboarding_complete, host_trust_score, first_booking_completed_at,
is_banned, or vendor trust_score. Inserts must use safe defaults.
Existing ownership, verification, commission and other RLS policies are retained.
No existing row values are rewritten.

Database postgres/supabase_admin/service_role operations and users with the
existing admin role may perform trusted updates. Existing SECURITY DEFINER
score functions owned by a trusted database role remain able to update scores,
even when invoked during an authenticated user's operation. This depends on
live function ownership: verify it before deployment. Do not convert the guard
to SECURITY DEFINER, and do not use client-controlled user metadata for bypasses.

This patch closes the identified system-field gaps, not every possible profile
or vendor workflow issue. It does not redesign existing verification policies.

## Change B: paid endpoint controls

Migration 20260910121000 adds a separate service-role-only quota RPC and table.
The existing rateLimit.ts helper and its callers remain unchanged.

| Endpoint | User sign-in | Global/min | Global/hour | User/min |
|---|---|---:|---:|---:|
| scrape-airbnb-reviews | Required, non-anonymous Auth user | 20 | 100 | 5 |
| generate-vendor-description | Required, non-anonymous Auth user | 20 | 100 | 5 |
| price-comparison | Guest access retained | 30 | 300 | — |
| vendor-directions | Guest access retained | 60 | 1000 | — |
| mapbox-directions | Existing gateway configuration retained | 60 | 1000 | — |
| google-places | Guest access retained | 120 | 3000 | — |

These are initial conservative request budgets, not dollar spending caps.
Provider fan-out and billing differ by endpoint. Confirm expected traffic before
production. Public budgets are shared: an attacker can exhaust them and deny
service for the remaining window. They bound provider usage without trusting
spoofable IP headers, but do not replace an edge WAF, bot controls or provider
budget alerts. Fixed windows can permit a burst at the boundary.

Quota counters use atomic ON CONFLICT updates, saturate at the limit plus one,
and expire. RPC errors/timeouts/malformed responses return 503 before provider
work. Quota rejection returns 429 with Retry-After. Denied requests may consume
earlier global buckets conservatively. No caller can directly edit the counters.

Requests are POST-only (OPTIONS preserved), capped at 16 KiB. The two AI calls
have an 800-token output cap. Auth-required endpoints validate the supplied
bearer token with Supabase Auth. Existing SUPABASE_URL and service-role secret
are used server-side; no new secret is needed and none is returned to clients.

Airbnb scraping accepts only canonical HTTPS airbnb.com/www.airbnb.com
/rooms/<digits> or /experiences/<digits> URLs. Query/fragment data is stripped.
Short links, other country domains, custom ports, credentials, and arbitrary
paths are rejected; users can paste a canonical .com link or add reviews manually.
The external scraping provider's redirect/network controls still matter; this
is not a claim of control over Firecrawl's internal networking.

mapbox-token is intentionally unchanged: it returns a public browser token.
Confirm provider-side URL restrictions, scopes and billing caps separately.

## Required staging / production checks

1. Compare live main and open PRs again before applying; do not overwrite newer work.
2. Read live pg_policies, table/column grants, triggers, and SECURITY DEFINER
   ownership for profiles/vendor_profiles. Confirm app_role admin membership
   checks are protected and no unexpected RPC can set arbitrary protected values.
3. Apply Change A to staging. Exercise signup; profile creation/editing;
   host verification; vendor submission/approval; Stripe Connect create/status;
   trust refresh on bookings/reviews; admin ban and blocked owner unban.
   Include real trigger chains and two independent sessions. Compare any
   failures with baseline to distinguish existing policy problems.
4. Apply Change B's migration before deploying the six changed Edge Functions
   and their shared guard. Verify the deployed gateway settings rather than
   inferring them from config.toml alone. No broad config replacement is needed.
5. Verify logged-out scraping/AI generation gets 401, invalid/expired/anonymous
   user tokens fail, and logged-in vendor flows work. Verify public map/search/
   price comparison remains usable. Test URLs and body-size failures without
   calling paid providers. Load-test quota boundaries concurrently in staging.
6. Confirm migration/RPC absence or database failure causes 503 and zero paid
   provider calls. Confirm retry headers/CORS, hourly exhaustion, and expiry.
7. After staging passes, deploy Change A first; observe profile/backend flows.
   Deploy Change B separately, migration first, functions second. Observe 401,
   429, 503 rates and provider usage; adjust quotas with a reviewed migration.

No production migration, function deployment, or live verification has been
performed by preparing these files.

## Rollback

Prefer rolling forward. Reverting reopens the original gaps.

For Change A only, in a reviewed transaction:

```sql
BEGIN;
DROP TRIGGER guard_profile_system_fields ON public.profiles;
DROP TRIGGER guard_vendor_trust_score ON public.vendor_profiles;
DROP FUNCTION public.guard_profile_system_fields();
COMMIT;
```

For Change B, restore the previous versions of the six handlers first. Leave
the new quota table/RPC in place initially; they are inert without callers.
Do not remove the RPC while the protected handlers still depend on it, since
that correctly makes them fail closed. No legacy limiter rollback is needed.

## Vendor review workflow repair

Deploy `vendor-review` before releasing the two updated vendor review screens.
The new function verifies the signed-in user, checks profile ownership for
submissions and the database admin role for reviews. Existing RLS and the
service-only email function are unchanged. Email recipients come from Auth,
not caller input. Conditional status updates reject concurrent conflicts.
Email failure is reported separately from a successfully saved review; no
automatic email retry is provided. Suspension has no email template and sends
no misleading changes-requested message.

Run `node tests/security/vendor-review.mjs` for mocked authorization and workflow
checks. Verify submission, approval/rejection, suspension, and email delivery
in the deployed environment before calling the workflow production-verified.
