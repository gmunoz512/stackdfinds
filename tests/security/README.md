# Security regression tests: Findings 6–8

From the repository root (Node 22 recommended):

```sh
npm ci --prefix tests/security
npm test --prefix tests/security
```

Tests use an isolated PGlite PostgreSQL engine and mocked HTTP calls. They never
connect to Supabase, Stripe, Firecrawl, Google, Mapbox, or Lovable.

The database fixture includes the existing ownership and verification policies
from the repository, then applies the new migrations. It checks host protected
fields and vendor trust-score inserts/updates, owner edits, cross-user access,
admin access, service-role Stripe writes, SECURITY DEFINER score updates,
quota enforcement/expiry, and RPC/table privileges.

The fixture is intentionally focused, not a full production schema replay.
PGlite serializes requests: run a genuine multi-session concurrency test in
staging before production. Tests do not establish live deployment state or
verify every existing trigger, RLS policy, grant, or custom database role.

HTTP tests cover authentication, anonymous-session rejection, guest access,
quota rejection, outages, request-size bounds, URL validation, and all six actual
handlers returning before paid API calls when the guard blocks the request.
