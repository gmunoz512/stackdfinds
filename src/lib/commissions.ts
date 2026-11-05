/**
 * Single source of truth for vendor → host affiliate commission tiers.
 * Keep supabase/functions/create-booking-checkout/index.ts in sync with
 * `platformFeePercentFor` / `HOST_COMMISSION_TIERS`.
 *
 * Guests always pay the listed price. Host commission + stackd fee come
 * out of the vendor's payout.
 */

export const HOST_COMMISSION_TIERS = [10, 11, 12, 15, 17] as const;

export type HostCommissionTier = (typeof HOST_COMMISSION_TIERS)[number];

export function isHostCommissionTier(value: unknown): value is HostCommissionTier {
  return typeof value === 'number' && (HOST_COMMISSION_TIERS as readonly number[]).includes(value);
}

/** stackd platform fee % for a chosen host commission tier */
export function platformFeePercentFor(hostCommissionPercent: number): number {
  if (hostCommissionPercent === 17) return 2;
  if (hostCommissionPercent === 15) return 2.5;
  if ([10, 11, 12].includes(hostCommissionPercent)) return 3;
  return 0;
}

export function normalizeHostCommission(value: unknown): HostCommissionTier | null {
  const n = typeof value === 'string' ? Number(value) : typeof value === 'number' ? value : NaN;
  return isHostCommissionTier(n) ? n : null;
}

export interface BookingSplitPreview {
  bookingTotal: number;
  hostCommissionPercent: number;
  platformFeePercent: number;
  hostEarns: number;
  stackdEarns: number;
  vendorKeeps: number;
}

/** Preview how a sample booking splits. Amounts rounded to cents. */
export function previewBookingSplit(
  bookingTotal: number,
  hostCommissionPercent: number,
): BookingSplitPreview {
  const hostPct = normalizeHostCommission(hostCommissionPercent) ?? 0;
  const platformPct = platformFeePercentFor(hostPct);
  const hostEarns = roundCents(bookingTotal * (hostPct / 100));
  const stackdEarns = roundCents(bookingTotal * (platformPct / 100));
  const vendorKeeps = roundCents(bookingTotal - hostEarns - stackdEarns);
  return {
    bookingTotal,
    hostCommissionPercent: hostPct,
    platformFeePercent: platformPct,
    hostEarns,
    stackdEarns,
    vendorKeeps,
  };
}

function roundCents(n: number): number {
  return Math.round(n * 100) / 100;
}

export function formatMoney(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function tierLabel(hostCommissionPercent: number): string {
  const fee = platformFeePercentFor(hostCommissionPercent);
  if (!fee && !isHostCommissionTier(hostCommissionPercent)) {
    return 'Choose a commission';
  }
  return `${hostCommissionPercent}% host commission · ${fee}% stackd fee`;
}

/** Marketplace category chips for host discover. Maps onto vendor_profiles.category. */
export const MARKETPLACE_CATEGORY_FILTERS = [
  'All',
  'Food & Drinks',
  'Experiences',
  'Adventure',
  'Wellness',
  'Transportation',
  'Shopping',
  'Hidden Gems',
] as const;

export type MarketplaceCategoryFilter = (typeof MARKETPLACE_CATEGORY_FILTERS)[number];

/** Map free-form vendor.category strings onto marketplace filter buckets. */
export function marketplaceBucketFor(category: string | null | undefined): MarketplaceCategoryFilter {
  const c = (category || '').toLowerCase();
  if (!c) return 'Experiences';
  if (
    c.includes('chef') ||
    c.includes('cook') ||
    c.includes('wine') ||
    c.includes('food') ||
    c.includes('drink') ||
    c.includes('restaurant')
  ) {
    return 'Food & Drinks';
  }
  if (
    c.includes('yacht') ||
    c.includes('fish') ||
    c.includes('water') ||
    c.includes('surf') ||
    c.includes('dive') ||
    c.includes('adventure') ||
    c.includes('tour')
  ) {
    return 'Adventure';
  }
  if (
    c.includes('massage') ||
    c.includes('spa') ||
    c.includes('yoga') ||
    c.includes('fitness') ||
    c.includes('wellness')
  ) {
    return 'Wellness';
  }
  if (c.includes('transport') || c.includes('transfer') || c.includes('driver')) {
    return 'Transportation';
  }
  if (c.includes('shop') || c.includes('retail') || c.includes('boutique')) {
    return 'Shopping';
  }
  if (c.includes('hidden') || c.includes('gem') || c.includes('other')) {
    return 'Hidden Gems';
  }
  return 'Experiences';
}
