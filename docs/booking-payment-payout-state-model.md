# Booking, payment, and payout state model

Stackd must treat booking progress, payment collection, and vendor/host payout
as separate state machines. A single booking can be completed while its payout
is still held, or its payment can later be refunded.

## Current compatibility model

The existing schema uses `bookings.status` for booking and some payment/refund
outcomes, and `bookings.payout_status` for payout progress. Migration
`20260910122000_add_payment_state.sql` adds `bookings.payment_status` with a
backfill, while preserving the legacy `status` values for compatibility.

## Target state machines

### Booking

```text
requested -> confirmed
requested -> cancelled
confirmed -> completed
confirmed -> cancelled
confirmed -> no_show
```

### Payment

```text
pending -> authorized
authorized -> paid
authorized -> failed
paid -> partially_refunded
paid -> refunded
```

### Payout

```text
held -> processing
processing -> paid
processing -> failed
failed -> processing
```

The payout worker remains scheduler-only. It must claim `held` rows atomically,
use deterministic Stripe idempotency keys, and never become a browser command.

## Actor rules

| Actor | Allowed responsibility |
| --- | --- |
| Guest | Create a booking, pay through checkout, request cancellation/refund where eligible |
| Host | Manage owned listings and host-side booking actions allowed by policy |
| Vendor | View owned bookings and manage vendor data; no direct payout release |
| Admin | Review vendors, refunds, and moderation decisions |
| Stripe webhook | Record verified payment/refund events |
| Scheduler | Run payout processing with the private scheduler secret |
| Service role | Execute narrowly scoped trusted backend writes |

## Implementation rules

1. Backend validation is mandatory even when the frontend validates first.
2. Every transition must check the current state in the same write.
3. External calls need idempotency keys or a durable retry record.
4. Failed external calls must leave an explicit recoverable state.
5. Do not add database CHECK constraints until all existing values have been
   inventoried in production and a compatibility migration is prepared.
6. Add integration tests for anonymous, guest, host, vendor, admin, service-role,
   webhook, and scheduler actors independently.

## Safe migration sequence

1. Inventory every current value and caller for `status`, `payout_status`, and
   `refund_requests.status`.
2. Add explicit payment columns only if the existing overloaded values cannot
   be represented safely.
3. Backfill new columns without changing current behavior.
4. Update backend writers to perform transition checks atomically.
5. Update readers and dashboards to use the new columns.
6. Add constraints after the backfill and dual-read period passes.
7. Remove legacy interpretation only after production usage confirms it is safe.
