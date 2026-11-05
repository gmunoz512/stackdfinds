import { describe, expect, it } from 'vitest';
import {
  classifyAffiliateStatus,
  countsTowardEarnings,
  summarizeHostEarnings,
  summarizeStackd,
  summarizeVendorOwed,
  type AffiliateBookingRow,
} from '@/lib/affiliateAccounting';
import { previewBookingSplit } from '@/lib/commissions';

const base = (over: Partial<AffiliateBookingRow>): AffiliateBookingRow => ({
  id: over.id || 'b1',
  experience_name: over.experience_name || 'Cenote Swim',
  vendor_name: 'vendor_name' in over ? over.vendor_name ?? null : 'Tulum Ocean Adventures',
  booking_date: over.booking_date || '2026-12-12',
  guests: over.guests ?? 2,
  total_amount: over.total_amount ?? 100,
  host_payout_amount: 'host_payout_amount' in over ? over.host_payout_amount ?? null : 15,
  vendor_payout_amount: 'vendor_payout_amount' in over ? over.vendor_payout_amount ?? null : 82.5,
  platform_fee_amount: 'platform_fee_amount' in over ? over.platform_fee_amount ?? null : 2.5,
  payment_status: over.payment_status ?? 'paid',
  payout_status: 'payout_status' in over ? over.payout_status ?? null : 'held',
  status: over.status ?? 'confirmed',
  currency: over.currency ?? 'USD',
  host_user_id: 'host_user_id' in over ? over.host_user_id ?? null : 'host-1',
  vendor_profile_id: over.vendor_profile_id ?? 'vendor-1',
});

describe('classifyAffiliateStatus', () => {
  it('maps escrow states to pending / confirmed / paid', () => {
    expect(
      classifyAffiliateStatus({ payment_status: 'unpaid', payout_status: null, status: 'pending' }),
    ).toBe('pending');
    expect(
      classifyAffiliateStatus({ payment_status: 'paid', payout_status: 'held', status: 'confirmed' }),
    ).toBe('confirmed');
    expect(
      classifyAffiliateStatus({
        payment_status: 'paid',
        payout_status: 'processing',
        status: 'confirmed',
      }),
    ).toBe('confirmed');
    expect(
      classifyAffiliateStatus({ payment_status: 'paid', payout_status: 'paid', status: 'completed' }),
    ).toBe('paid');
  });

  it('maps refunds and failures', () => {
    expect(
      classifyAffiliateStatus({
        payment_status: 'refunded',
        payout_status: 'refunded',
        status: 'cancelled',
      }),
    ).toBe('refunded');
    expect(
      classifyAffiliateStatus({ payment_status: 'paid', payout_status: 'failed', status: 'confirmed' }),
    ).toBe('failed');
  });
});

describe('summarizeHostEarnings', () => {
  it('totals commission by status and excludes refunds from totalEarned', () => {
    const rows = [
      base({ id: '1', payout_status: 'held', host_payout_amount: 15 }),
      base({ id: '2', payout_status: 'paid', status: 'completed', host_payout_amount: 17 }),
      base({
        id: '3',
        payment_status: 'refunded',
        payout_status: 'refunded',
        status: 'cancelled',
        host_payout_amount: 12,
      }),
      base({
        id: '4',
        payment_status: 'unpaid',
        payout_status: null,
        status: 'pending',
        host_payout_amount: 10,
      }),
    ];
    const summary = summarizeHostEarnings(rows);
    expect(summary.byStatus.confirmed).toBe(15);
    expect(summary.byStatus.paid).toBe(17);
    expect(summary.byStatus.pending).toBe(10);
    expect(summary.byStatus.refunded).toBe(12);
    // refunded excluded
    expect(summary.totalEarned).toBe(15 + 17 + 10);
    expect(summary.bookingCount).toBe(3);
    expect(summary.lines[0].status).toBe('confirmed');
  });
});

describe('summarizeVendorOwed', () => {
  it('splits host / stackd / vendor keeps from stored booking amounts', () => {
    const split15 = previewBookingSplit(100, 15);
    const rows = [
      base({
        id: '1',
        total_amount: 100,
        host_payout_amount: split15.hostEarns,
        platform_fee_amount: split15.stackdEarns,
        vendor_payout_amount: split15.vendorKeeps,
      }),
      base({
        id: '2',
        total_amount: 100,
        host_payout_amount: 0,
        platform_fee_amount: 3,
        vendor_payout_amount: 97,
        host_user_id: null,
      }),
    ];
    const summary = summarizeVendorOwed(rows);
    expect(summary.totalOwedToHosts).toBe(15);
    expect(summary.totalOwedToStackd).toBe(2.5 + 3);
    expect(summary.totalVendorKeeps).toBe(82.5 + 97);
    expect(summary.lines[0].hasHost).toBe(true);
    expect(summary.lines[1].hasHost).toBe(false);
  });

  it('matches commissions.ts math for every supported tier on a $100 booking', () => {
    for (const tier of [10, 11, 12, 15, 17] as const) {
      const split = previewBookingSplit(100, tier);
      const summary = summarizeVendorOwed([
        base({
          id: String(tier),
          total_amount: 100,
          host_payout_amount: split.hostEarns,
          platform_fee_amount: split.stackdEarns,
          vendor_payout_amount: split.vendorKeeps,
        }),
      ]);
      expect(summary.totalOwedToHosts).toBe(split.hostEarns);
      expect(summary.totalOwedToStackd).toBe(split.stackdEarns);
      expect(summary.totalVendorKeeps).toBe(split.vendorKeeps);
      // Host keeps the full commission; vendor pays stackd's cut
      expect(split.hostEarns + split.stackdEarns + split.vendorKeeps).toBe(100);
    }
  });
});

describe('summarizeStackd', () => {
  it('aggregates platform fees and attributed bookings', () => {
    const rows = [
      base({ id: '1', platform_fee_amount: 2.5, host_payout_amount: 15 }),
      base({
        id: '2',
        platform_fee_amount: 3,
        host_payout_amount: 0,
        host_user_id: null,
        vendor_payout_amount: 97,
      }),
      base({
        id: '3',
        payment_status: 'refunded',
        payout_status: 'refunded',
        status: 'cancelled',
        platform_fee_amount: 2,
        host_payout_amount: 17,
      }),
    ];
    const summary = summarizeStackd(rows);
    expect(summary.bookingCount).toBe(2);
    expect(summary.attributedBookingCount).toBe(1);
    expect(summary.totalStackdFees).toBe(5.5);
    expect(summary.totalHostCommissions).toBe(15);
    expect(countsTowardEarnings('refunded')).toBe(false);
  });
});

import { parseBookingDate } from '@/lib/affiliateAccounting';
describe('parseBookingDate', () => {
  it('keeps the calendar day for YYYY-MM-DD', () => {
    const d = parseBookingDate('2026-12-12');
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 11, 12]);
  });
});
