import { readFileSync } from 'fs';
import { describe, expect, it } from 'vitest';
import { hostCommissionLabel, hostEarningsOn, sortByCommission } from '@/lib/commissions';

describe('host commission display', () => {
  it('labels set and missing commissions', () => {
    expect(hostCommissionLabel(15)).toBe('15% commission');
    expect(hostCommissionLabel(null)).toBe('Commission not set');
    expect(hostCommissionLabel(0)).toBe('Commission not set');
  });
  it('estimates host earnings per $100', () => {
    expect(hostEarningsOn(15)).toBe(15);
    expect(hostEarningsOn(17)).toBe(17);
    expect(hostEarningsOn(null)).toBeNull();
    expect(hostEarningsOn(20)).toBeNull();
  });
  it('sorts with missing commissions last', () => {
    const rows = [{ commission_percentage: 12 }, { commission_percentage: null }, { commission_percentage: 17 }];
    expect(sortByCommission(rows, 'highest').map((r) => r.commission_percentage)).toEqual([17, 12, null]);
    expect(sortByCommission(rows, 'lowest').map((r) => r.commission_percentage)).toEqual([12, 17, null]);
  });
  it('never shows commission on the public guest guide', () => {
    for (const f of ['src/components/guide/PublicGuideView.tsx', 'src/pages/guest/GuestGuide.tsx']) {
      const src = readFileSync(f, 'utf8');
      expect(src).not.toMatch(/commission/i);
    }
  });
});
