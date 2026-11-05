import { describe, expect, it } from 'vitest';
import {
  HOST_COMMISSION_TIERS,
  formatMoney,
  isHostCommissionTier,
  marketplaceBucketFor,
  normalizeHostCommission,
  platformFeePercentFor,
  previewBookingSplit,
  tierLabel,
} from '@/lib/commissions';

describe('commission tiers', () => {
  it('lists the approved host tiers', () => {
    expect([...HOST_COMMISSION_TIERS]).toEqual([10, 11, 12, 15, 17]);
  });

  it('maps stackd fees correctly', () => {
    expect(platformFeePercentFor(10)).toBe(3);
    expect(platformFeePercentFor(11)).toBe(3);
    expect(platformFeePercentFor(12)).toBe(3);
    expect(platformFeePercentFor(15)).toBe(2.5);
    expect(platformFeePercentFor(17)).toBe(2);
    expect(platformFeePercentFor(9)).toBe(0);
  });

  it('normalizes valid and invalid values', () => {
    expect(normalizeHostCommission(15)).toBe(15);
    expect(normalizeHostCommission('12')).toBe(12);
    expect(normalizeHostCommission(14)).toBeNull();
    expect(isHostCommissionTier(17)).toBe(true);
    expect(isHostCommissionTier(13)).toBe(false);
  });

  it('previews a $100 booking split for the 10% tier', () => {
    const split = previewBookingSplit(100, 10);
    expect(split.hostEarns).toBe(10);
    expect(split.stackdEarns).toBe(3);
    expect(split.vendorKeeps).toBe(87);
  });

  it('previews a $100 booking split for the 17% tier', () => {
    const split = previewBookingSplit(100, 17);
    expect(split.hostEarns).toBe(17);
    expect(split.stackdEarns).toBe(2);
    expect(split.vendorKeeps).toBe(81);
  });

  it('formats money and tier labels', () => {
    expect(formatMoney(87)).toBe('$87.00');
    expect(tierLabel(15)).toContain('2.5%');
  });

  it('buckets vendor categories for marketplace filters', () => {
    expect(marketplaceBucketFor('Private Chef')).toBe('Food & Drinks');
    expect(marketplaceBucketFor('Yacht Charter')).toBe('Adventure');
    expect(marketplaceBucketFor('Massage & Spa')).toBe('Wellness');
    expect(marketplaceBucketFor('Transportation')).toBe('Transportation');
    expect(marketplaceBucketFor('Photography')).toBe('Experiences');
  });
});
