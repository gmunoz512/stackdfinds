/**
 * Affiliate payout ledger helpers (Airbnb-style hold).
 * Read-only views over existing bookings rows. Amounts are dollars
 * (see stripe-webhook writing cents/100). No payouts are triggered here.
 *
 * Model: after a guest pays, the site holds the vendor payout and the host
 * commission until 24 hours after the reservation date (booking_date). Then
 * both show as Released. Money rules stay in sync with src/lib/commissions.ts
 * (vendor pays stackd's cut; host keeps the full commission).
 */

import { formatMoney } from '@/lib/commissions';

/** Guest/host/vendor-facing ledger statuses for payout dashboards. */
export type AffiliateLedgerStatus =
  | 'pending'
  | 'upcoming'
  | 'released'
  | 'refunded'
  | 'failed';

/** Primary filters shown on host/vendor payout pages. */
export const PRIMARY_LEDGER_STATUSES = ['upcoming', 'released'] as const;

export interface AffiliateBookingRow {
  id: string;
  experience_name: string;
  vendor_name: string | null;
  booking_date: string;
  created_at?: string | null;
  guests?: number | null;
  total_amount: number;
  host_payout_amount: number | null;
  vendor_payout_amount: number | null;
  platform_fee_amount: number | null;
  payment_status: string;
  payout_status: string | null;
  status: string;
  currency?: string | null;
  host_user_id?: string | null;
  vendor_profile_id?: string | null;
}

/** Parse a YYYY-MM-DD booking date as a local calendar day (avoids the UTC off-by-one). */
export function parseBookingDate(value: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(value);
}

/**
 * Release moment = reservation date (local midnight) + 24 hours.
 * Matches "held until 24 hours after the reservation is completed".
 */
export function releaseAtFromBookingDate(bookingDate: string): Date {
  const start = parseBookingDate(bookingDate);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000);
}

export function formatReleaseDate(bookingDate: string): string {
  return releaseAtFromBookingDate(bookingDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Map booking fields onto the Airbnb-style payout ledger.
 *
 * - unpaid / awaiting checkout → pending
 * - paid, before booking_date + 24h → upcoming (held)
 * - paid, at/after booking_date + 24h, or payout already marked paid → released
 * - refunded / cancelled → refunded
 * - payout failed → failed
 *
 * Pass `now` in tests for deterministic release checks.
 */
export function classifyAffiliateStatus(
  booking: {
    payment_status: string | null | undefined;
    payout_status: string | null | undefined;
    status: string | null | undefined;
    booking_date?: string | null | undefined;
  },
  now: Date = new Date(),
): AffiliateLedgerStatus {
  const pay = (booking.payment_status || '').toLowerCase();
  const pout = (booking.payout_status || '').toLowerCase();
  const st = (booking.status || '').toLowerCase();

  if (
    pay === 'refunded' ||
    pout === 'refunded' ||
    st === 'cancelled' ||
    st === 'canceled' ||
    st === 'refunded'
  ) {
    return 'refunded';
  }
  if (pout === 'failed') return 'failed';

  const paidLike =
    pay === 'paid' ||
    pout === 'held' ||
    pout === 'processing' ||
    pout === 'paid' ||
    pout === 'completed' ||
    st === 'confirmed' ||
    st === 'completed';

  if (!paidLike) return 'pending';

  // Explicit release on the payout worker wins even if the clock has not reached +24h.
  if (pout === 'paid' || pout === 'completed') return 'released';

  if (booking.booking_date) {
    const releaseAt = releaseAtFromBookingDate(booking.booking_date);
    if (now.getTime() >= releaseAt.getTime()) return 'released';
  }

  return 'upcoming';
}

export function ledgerStatusLabel(status: AffiliateLedgerStatus): string {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'upcoming':
      return 'Upcoming';
    case 'released':
      return 'Released';
    case 'refunded':
      return 'Refunded';
    case 'failed':
      return 'Failed';
  }
}

/** Counts toward host/vendor/stackd earning totals (excludes refunds/failures). */
export function countsTowardEarnings(status: AffiliateLedgerStatus): boolean {
  return status === 'pending' || status === 'upcoming' || status === 'released';
}

export interface StatusTotals {
  pending: number;
  upcoming: number;
  released: number;
  refunded: number;
  failed: number;
}

export function emptyStatusTotals(): StatusTotals {
  return { pending: 0, upcoming: 0, released: 0, refunded: 0, failed: 0 };
}

export interface HostEarningsLine {
  id: string;
  experienceName: string;
  vendorName: string;
  bookingDate: string;
  releaseDate: string;
  guests: number;
  bookingTotal: number;
  commissionEarned: number;
  status: AffiliateLedgerStatus;
  currency: string;
}

export interface HostEarningsSummary {
  lines: HostEarningsLine[];
  bookingCount: number;
  totalEarned: number;
  totalUpcoming: number;
  totalReleased: number;
  byStatus: StatusTotals;
}

export function summarizeHostEarnings(
  rows: AffiliateBookingRow[],
  now: Date = new Date(),
): HostEarningsSummary {
  const byStatus = emptyStatusTotals();
  const lines: HostEarningsLine[] = rows.map((row) => {
    const status = classifyAffiliateStatus(row, now);
    const commission = Number(row.host_payout_amount || 0);
    byStatus[status] += commission;
    return {
      id: row.id,
      experienceName: row.experience_name,
      vendorName: row.vendor_name || 'Vendor',
      bookingDate: row.booking_date,
      releaseDate: formatReleaseDate(row.booking_date),
      guests: row.guests || 1,
      bookingTotal: Number(row.total_amount || 0),
      commissionEarned: commission,
      status,
      currency: (row.currency || 'USD').toUpperCase(),
    };
  });

  const earning = lines.filter((l) => countsTowardEarnings(l.status));
  const totalEarned = earning.reduce((sum, l) => sum + l.commissionEarned, 0);

  return {
    lines,
    bookingCount: earning.length,
    totalEarned,
    totalUpcoming: byStatus.upcoming,
    totalReleased: byStatus.released,
    byStatus,
  };
}

export interface VendorPayoutLine {
  id: string;
  experienceName: string;
  bookingDate: string;
  releaseDate: string;
  bookingTotal: number;
  /** Net to vendor after host commission + stackd fee. */
  vendorReceives: number;
  hostCommission: number;
  stackdFee: number;
  hasHost: boolean;
  status: AffiliateLedgerStatus;
  currency: string;
}

export interface VendorPayoutSummary {
  lines: VendorPayoutLine[];
  bookingCount: number;
  totalUpcoming: number;
  totalReleased: number;
  totalHostCommissions: number;
  totalStackdFees: number;
  byStatus: StatusTotals;
}

export function summarizeVendorPayouts(
  rows: AffiliateBookingRow[],
  now: Date = new Date(),
): VendorPayoutSummary {
  const byStatus = emptyStatusTotals();
  const lines: VendorPayoutLine[] = rows.map((row) => {
    const status = classifyAffiliateStatus(row, now);
    const bookingTotal = Number(row.total_amount || 0);
    const hostCommission = Number(row.host_payout_amount || 0);
    const stackdFee = Number(row.platform_fee_amount || 0);
    const storedVendor = row.vendor_payout_amount;
    const vendorReceives =
      storedVendor != null
        ? Number(storedVendor)
        : Math.round((bookingTotal - hostCommission - stackdFee) * 100) / 100;
    byStatus[status] += vendorReceives;
    return {
      id: row.id,
      experienceName: row.experience_name,
      bookingDate: row.booking_date,
      releaseDate: formatReleaseDate(row.booking_date),
      bookingTotal,
      vendorReceives,
      hostCommission,
      stackdFee,
      hasHost: Boolean(row.host_user_id) && hostCommission > 0,
      status,
      currency: (row.currency || 'USD').toUpperCase(),
    };
  });

  const earning = lines.filter((l) => countsTowardEarnings(l.status));
  return {
    lines,
    bookingCount: earning.length,
    totalUpcoming: byStatus.upcoming,
    totalReleased: byStatus.released,
    totalHostCommissions: earning.reduce((s, l) => s + l.hostCommission, 0),
    totalStackdFees: earning.reduce((s, l) => s + l.stackdFee, 0),
    byStatus,
  };
}

/** @deprecated Use summarizeVendorPayouts — kept as a thin alias for older imports. */
export function summarizeVendorOwed(
  rows: AffiliateBookingRow[],
  now: Date = new Date(),
): VendorPayoutSummary {
  return summarizeVendorPayouts(rows, now);
}

export interface StackdSummary {
  bookingCount: number;
  attributedBookingCount: number;
  totalBookingVolume: number;
  totalHostCommissions: number;
  totalStackdFees: number;
  totalVendorPayouts: number;
  totalUpcomingVendor: number;
  totalReleasedVendor: number;
  byStatusFees: StatusTotals;
  byStatusHost: StatusTotals;
  byStatusVendor: StatusTotals;
}

export function summarizeStackd(
  rows: AffiliateBookingRow[],
  now: Date = new Date(),
): StackdSummary {
  const byStatusFees = emptyStatusTotals();
  const byStatusHost = emptyStatusTotals();
  const byStatusVendor = emptyStatusTotals();
  let attributedBookingCount = 0;
  let totalBookingVolume = 0;
  let totalHostCommissions = 0;
  let totalStackdFees = 0;
  let totalVendorPayouts = 0;
  let bookingCount = 0;

  for (const row of rows) {
    const status = classifyAffiliateStatus(row, now);
    const hostAmt = Number(row.host_payout_amount || 0);
    const feeAmt = Number(row.platform_fee_amount || 0);
    const vendorAmt = Number(
      row.vendor_payout_amount != null
        ? row.vendor_payout_amount
        : Number(row.total_amount || 0) - hostAmt - feeAmt,
    );
    byStatusFees[status] += feeAmt;
    byStatusHost[status] += hostAmt;
    byStatusVendor[status] += vendorAmt;
    if (!countsTowardEarnings(status)) continue;
    bookingCount += 1;
    totalBookingVolume += Number(row.total_amount || 0);
    totalHostCommissions += hostAmt;
    totalStackdFees += feeAmt;
    totalVendorPayouts += vendorAmt;
    if (row.host_user_id && hostAmt > 0) attributedBookingCount += 1;
  }

  return {
    bookingCount,
    attributedBookingCount,
    totalBookingVolume,
    totalHostCommissions,
    totalStackdFees,
    totalVendorPayouts,
    totalUpcomingVendor: byStatusVendor.upcoming,
    totalReleasedVendor: byStatusVendor.released,
    byStatusFees,
    byStatusHost,
    byStatusVendor,
  };
}

export function formatLedgerMoney(amount: number, currency = 'USD'): string {
  return formatMoney(amount, currency);
}

/** Badge tone classes for cream UI (pine-friendly, no gradients). */
export function ledgerStatusTone(status: AffiliateLedgerStatus): string {
  switch (status) {
    case 'released':
      return 'bg-success/10 text-success-strong border-success/20';
    case 'upcoming':
      return 'bg-info/10 text-info-strong border-info/20';
    case 'pending':
      return 'bg-rating/10 text-rating-strong border-rating/20';
    case 'refunded':
      return 'bg-muted text-muted-foreground border-border';
    case 'failed':
      return 'bg-danger/10 text-danger-strong border-danger/20';
  }
}
