/**
 * Phase 6 — affiliate accounting helpers.
 * Read-only views over existing bookings rows. Amounts are dollars
 * (see stripe-webhook writing cents/100). No payouts are triggered here.
 *
 * Money rules (vendor pays stackd's cut; host keeps the full commission):
 * keep in sync with src/lib/commissions.ts.
 */

import { formatMoney } from '@/lib/commissions';

/** Guest/host/vendor-facing ledger statuses for Phase 6 dashboards. */
export type AffiliateLedgerStatus = 'pending' | 'confirmed' | 'paid' | 'refunded' | 'failed';

export const PRIMARY_LEDGER_STATUSES = ['pending', 'confirmed', 'paid'] as const;

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

/**
 * Map booking payment/payout/status fields onto the Phase 6 ledger.
 *
 * Escrow flow today:
 * - unpaid / awaiting checkout → pending
 * - paid + payout held/processing (or booking confirmed) → confirmed
 * - payout released → paid
 * - refunded / cancelled → refunded
 */
export function classifyAffiliateStatus(booking: {
  payment_status: string | null | undefined;
  payout_status: string | null | undefined;
  status: string | null | undefined;
}): AffiliateLedgerStatus {
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
  if (pout === 'paid' || pout === 'completed') return 'paid';
  if (
    pay === 'paid' ||
    pout === 'held' ||
    pout === 'processing' ||
    st === 'confirmed' ||
    st === 'completed'
  ) {
    return 'confirmed';
  }
  return 'pending';
}

export function ledgerStatusLabel(status: AffiliateLedgerStatus): string {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'confirmed':
      return 'Confirmed';
    case 'paid':
      return 'Paid';
    case 'refunded':
      return 'Refunded';
    case 'failed':
      return 'Failed';
  }
}

/** Counts toward host/vendor/stackd earning totals (excludes refunds/failures). */
export function countsTowardEarnings(status: AffiliateLedgerStatus): boolean {
  return status === 'pending' || status === 'confirmed' || status === 'paid';
}

export interface StatusTotals {
  pending: number;
  confirmed: number;
  paid: number;
  refunded: number;
  failed: number;
}

export function emptyStatusTotals(): StatusTotals {
  return { pending: 0, confirmed: 0, paid: 0, refunded: 0, failed: 0 };
}

export interface HostEarningsLine {
  id: string;
  experienceName: string;
  vendorName: string;
  bookingDate: string;
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
  byStatus: StatusTotals;
}

export function summarizeHostEarnings(rows: AffiliateBookingRow[]): HostEarningsSummary {
  const byStatus = emptyStatusTotals();
  const lines: HostEarningsLine[] = rows.map((row) => {
    const status = classifyAffiliateStatus(row);
    const commission = Number(row.host_payout_amount || 0);
    byStatus[status] += commission;
    return {
      id: row.id,
      experienceName: row.experience_name,
      vendorName: row.vendor_name || 'Vendor',
      bookingDate: row.booking_date,
      guests: row.guests || 1,
      bookingTotal: Number(row.total_amount || 0),
      commissionEarned: commission,
      status,
      currency: (row.currency || 'USD').toUpperCase(),
    };
  });

  const totalEarned = lines
    .filter((l) => countsTowardEarnings(l.status))
    .reduce((sum, l) => sum + l.commissionEarned, 0);

  return {
    lines,
    bookingCount: lines.filter((l) => countsTowardEarnings(l.status)).length,
    totalEarned,
    byStatus,
  };
}

export interface VendorOwedLine {
  id: string;
  experienceName: string;
  bookingDate: string;
  bookingTotal: number;
  owedToHost: number;
  owedToStackd: number;
  vendorKeeps: number;
  hasHost: boolean;
  status: AffiliateLedgerStatus;
  currency: string;
}

export interface VendorOwedSummary {
  lines: VendorOwedLine[];
  bookingCount: number;
  totalOwedToHosts: number;
  totalOwedToStackd: number;
  totalVendorKeeps: number;
  byStatusHost: StatusTotals;
  byStatusStackd: StatusTotals;
}

export function summarizeVendorOwed(rows: AffiliateBookingRow[]): VendorOwedSummary {
  const byStatusHost = emptyStatusTotals();
  const byStatusStackd = emptyStatusTotals();
  const lines: VendorOwedLine[] = rows.map((row) => {
    const status = classifyAffiliateStatus(row);
    const bookingTotal = Number(row.total_amount || 0);
    const owedToHost = Number(row.host_payout_amount || 0);
    const owedToStackd = Number(row.platform_fee_amount || 0);
    const storedVendor = row.vendor_payout_amount;
    const vendorKeeps =
      storedVendor != null
        ? Number(storedVendor)
        : Math.round((bookingTotal - owedToHost - owedToStackd) * 100) / 100;
    byStatusHost[status] += owedToHost;
    byStatusStackd[status] += owedToStackd;
    return {
      id: row.id,
      experienceName: row.experience_name,
      bookingDate: row.booking_date,
      bookingTotal,
      owedToHost,
      owedToStackd,
      vendorKeeps,
      hasHost: Boolean(row.host_user_id) && owedToHost > 0,
      status,
      currency: (row.currency || 'USD').toUpperCase(),
    };
  });

  const earning = lines.filter((l) => countsTowardEarnings(l.status));
  return {
    lines,
    bookingCount: earning.length,
    totalOwedToHosts: earning.reduce((s, l) => s + l.owedToHost, 0),
    totalOwedToStackd: earning.reduce((s, l) => s + l.owedToStackd, 0),
    totalVendorKeeps: earning.reduce((s, l) => s + l.vendorKeeps, 0),
    byStatusHost,
    byStatusStackd,
  };
}

export interface StackdSummary {
  bookingCount: number;
  attributedBookingCount: number;
  totalBookingVolume: number;
  totalHostCommissions: number;
  totalStackdFees: number;
  totalVendorPayouts: number;
  byStatusFees: StatusTotals;
  byStatusHost: StatusTotals;
}

export function summarizeStackd(rows: AffiliateBookingRow[]): StackdSummary {
  const byStatusFees = emptyStatusTotals();
  const byStatusHost = emptyStatusTotals();
  let attributedBookingCount = 0;
  let totalBookingVolume = 0;
  let totalHostCommissions = 0;
  let totalStackdFees = 0;
  let totalVendorPayouts = 0;
  let bookingCount = 0;

  for (const row of rows) {
    const status = classifyAffiliateStatus(row);
    const hostAmt = Number(row.host_payout_amount || 0);
    const feeAmt = Number(row.platform_fee_amount || 0);
    const vendorAmt = Number(
      row.vendor_payout_amount != null
        ? row.vendor_payout_amount
        : Number(row.total_amount || 0) - hostAmt - feeAmt,
    );
    byStatusFees[status] += feeAmt;
    byStatusHost[status] += hostAmt;
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
    byStatusFees,
    byStatusHost,
  };
}

export function formatLedgerMoney(amount: number, currency = 'USD'): string {
  return formatMoney(amount, currency);
}

/** Badge tone classes for cream UI (pine-friendly, no gradients). */
export function ledgerStatusTone(status: AffiliateLedgerStatus): string {
  switch (status) {
    case 'paid':
      return 'bg-success/10 text-success-strong border-success/20';
    case 'confirmed':
      return 'bg-info/10 text-info-strong border-info/20';
    case 'pending':
      return 'bg-rating/10 text-rating-strong border-rating/20';
    case 'refunded':
      return 'bg-muted text-muted-foreground border-border';
    case 'failed':
      return 'bg-danger/10 text-danger-strong border-danger/20';
  }
}
