import { isValidHostId } from "./guestBooking.ts";
import { withHostRef } from "./hostGuide.ts";
import { hostCommissionLabel, normalizeHostCommission } from "./commissions.ts";
import { hostEarningFor } from "./bookingRequest.ts";

export type HostPageItemType = "experience" | "restaurant";

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isHostPageItemType(value: unknown): value is HostPageItemType {
  return value === "experience" || value === "restaurant";
}

export function normalizeSlug(input: string): string {
  return input.trim().toLowerCase();
}

export function slugError(slug: string): string | null {
  if (slug.length < 3) return "At least 3 characters";
  if (slug.length > 40) return "At most 40 characters";
  if (!SLUG_RE.test(slug)) return "Only lowercase letters, numbers and single dashes";
  return null;
}

/** https photo links only. Empty stays empty. */
export function httpsPhotoUrl(value: string): string | null {
  const photo = value.trim();
  if (!photo) return null;
  if (!/^https:\/\//i.test(photo) || photo.length > 500) return null;
  return photo;
}

export function canOfferHostPage(
  appRole: string | null | undefined,
  stackdMeta: Record<string, unknown> | null | undefined,
): boolean {
  if (appRole === "host") return true;
  return stackdMeta?.role === "host";
}

/** Experience tiles go to the listing with ?host=. Restaurants are recommendations. */
export function hostPageItemPath(
  item: { itemType: HostPageItemType; itemRef: string; vendorUsername?: string | null },
  hostId: string,
): string | null {
  if (!isValidHostId(hostId)) return null;
  if (item.itemType === "experience") {
    if (!item.vendorUsername) return null;
    return withHostRef(`/experiences/${item.vendorUsername}/${item.itemRef}`, hostId);
  }
  return withHostRef(`/restaurant/${item.itemRef}`, hostId);
}

/**
 * What the host sees while editing. The Airbnb catalog has no commission tier,
 * so this is "not set" until a real tier exists. Guests never see this.
 */
export function hostEditorCommission(tier: unknown, totalAmount: number | null): {
  label: string;
  earning: number | null;
} {
  const pct = normalizeHostCommission(tier);
  if (pct == null) return { label: "not set", earning: null };
  const earning = hostEarningFor(pct, totalAmount);
  return { label: hostCommissionLabel(pct), earning: earning.hostEarning };
}
