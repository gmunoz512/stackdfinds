import { describe, expect, it } from 'vitest';
import {
  classifyAffiliateStatus,
  countsTowardEarnings,
  parseBookingDate,
  releaseAtFromBookingDate,
  summarizeHostEarnings,
  summarizeStackd,
  summarizeVendorPayouts,
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

/** Fixed "now" for release-date tests: Nov 5, 2026 noon local. */
const NOW = new Date(2026, 10, 5, 12, 0, 0);

describe('parseBookingDate / releaseAtFromBookingDate', () => {
  it('keeps the calendar day for YYYY-MM-DD', () => {
    const d = parseBookingDate('2026-12-12');
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 11, 12]);
  });

  it('releases 24 hours after the reservation date', () => {
    const release = releaseAtFromBookingDate('2026-11-04');
    expect([release.getFullYear(), release.getMonth(), release.getDate(), release.getHours()]).toEqual([
      2026, 10, 5, 0,
    ]);
  });
});

describe('classifyAffiliateStatus', () => {
  it('maps unpaid to pending', () => {
    expect(
      classifyAffiliateStatus(
        { payment_status: 'unpaid', payout_status: null, status: 'pending', booking_date: '2026-12-12' },
        NOW,
      ),
    ).toBe('pending');
  });

  it('holds paid bookings as upcoming until booking_date + 24h', () => {
    expect(
      classifyAffiliateStatus(
        {
          payment_status: 'paid',
          payout_status: 'held',
          status: 'confirmed',
          booking_date: '2026-12-12',
        },
        NOW,
      ),
    ).toBe('upcoming');
  });

  it('releases once now is at or after booking_date + 24h', () => {
    // Reservation Nov 4 → release Nov 5 00:00; NOW is Nov 5 noon → released
    expect(
      classifyAffiliateStatus(
        {
          payment_status: 'paid',
          payout_status: 'held',
          status: 'confirmed',
          booking_date: '2026-11-04',
        },
        NOW,
      ),
    ).toBe('released');
  });

  it('treats payout_status paid as released even before the clock', () => {
    expect(
      classifyAffiliateStatus(
        {
          payment_status: 'paid',
          payout_status: 'paid',
          status: 'completed',
          booking_date: '2026-12-20',
        },
        NOW,
      ),
    ).toBe('released');
  });

  it('maps refunds and failures', () => {
    expect(
      classifyAffiliateStatus(
        {
          payment_status: 'refunded',
          payout_status: 'refunded',
          status: 'cancelled',
          booking_date: '2026-11-01',
        },
        NOW,
      ),
    ).toBe('refunded');
    expect(
      classifyAffiliateStatus(
        {
          payment_status: 'paid',
          payout_status: 'failed',
          status: 'confirmed',
          booking_date: '2026-11-01',
        },
        NOW,
      ),
    ).toBe('failed');
  });
});

describe('summarizeHostEarnings', () => {
  it('totals upcoming vs released and excludes refunds from totalEarned', () => {
    const rows = [
      base({ id: '1', booking_date: '2026-12-12', payout_status: 'held', host_payout_amount: 15 }),
      base({
        id: '2',
        booking_date: '2026-11-01',
        payout_status: 'held',
        status: 'completed',
        host_payout_amount: 17,
      }),
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
    const summary = summarizeHostEarnings(rows, NOW);
    expect(summary.byStatus.upcoming).toBe(15);
    expect(summary.byStatus.released).toBe(17);
    expect(summary.byStatus.pending).toBe(10);
    expect(summary.byStatus.refunded).toBe(12);
    expect(summary.totalUpcoming).toBe(15);
    expect(summary.totalReleased).toBe(17);
    expect(summary.totalEarned).toBe(15 + 17 + 10);
    expect(summary.bookingCount).toBe(3);
    expect(summary.lines[0].status).toBe('upcoming');
    expect(summary.lines[0].releaseDate).toContain('2026');
  });
});

describe('summarizeVendorPayouts', () => {
  it('shows net vendor receives and splits host / stackd from stored amounts', () => {
    const split15 = previewBookingSplit(100, 15);
    const rows = [
      base({
        id: '1',
        booking_date: '2026-12-12',
        total_amount: 100,
        host_payout_amount: split15.hostEarns,
        platform_fee_amount: split15.stackdEarns,
        vendor_payout_amount: split15.vendorKeeps,
      }),
      base({
        id: '2',
        booking_date: '2026-11-01',
        total_amount: 100,
        host_payout_amount: 0,
        platform_fee_amount: 3,
        vendor_payout_amount: 97,
        host_user_id: null,
      }),
    ];
    const summary = summarizeVendorPayouts(rows, NOW);
    expect(summary.totalUpcoming).toBe(82.5);
    expect(summary.totalReleased).toBe(97);
    expect(summary.totalHostCommissions).toBe(15);
    expect(summary.totalStackdFees).toBe(2.5 + 3);
    expect(summary.lines[0].hasHost).toBe(true);
    expect(summary.lines[1].hasHost).toBe(false);
    expect(summary.lines[0].vendorReceives).toBe(82.5);
  });

  it('matches commissions.ts math for every supported tier on a $100 booking', () => {
    for (const tier of [10, 11, 12, 15, 17] as const) {
      const split = previewBookingSplit(100, tier);
      const summary = summarizeVendorPayouts(
        [
          base({
            id: String(tier),
            booking_date: '2026-12-12',
            total_amount: 100,
            host_payout_amount: split.hostEarns,
            platform_fee_amount: split.stackdEarns,
            vendor_payout_amount: split.vendorKeeps,
          }),
        ],
        NOW,
      );
      expect(summary.totalHostCommissions).toBe(split.hostEarns);
      expect(summary.totalStackdFees).toBe(split.stackdEarns);
      expect(summary.totalUpcoming).toBe(split.vendorKeeps);
      expect(split.hostEarns + split.stackdEarns + split.vendorKeeps).toBe(100);
    }
  });
});

describe('summarizeStackd', () => {
  it('aggregates platform fees and attributed bookings with upcoming/released', () => {
    const rows = [
      base({ id: '1', booking_date: '2026-12-12', platform_fee_amount: 2.5, host_payout_amount: 15 }),
      base({
        id: '2',
        booking_date: '2026-11-01',
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
    const summary = summarizeStackd(rows, NOW);
    expect(summary.bookingCount).toBe(2);
    expect(summary.attributedBookingCount).toBe(1);
    expect(summary.totalStackdFees).toBe(5.5);
    expect(summary.totalHostCommissions).toBe(15);
    expect(summary.totalUpcomingVendor).toBe(82.5);
    expect(summary.totalReleasedVendor).toBe(97);
    expect(countsTowardEarnings('refunded')).toBe(false);
  });
});
