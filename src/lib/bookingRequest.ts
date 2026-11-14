import { groupSizeMax, type AirbnbPrice } from "./airbnbListingFacts.ts";
import {
  hostCommissionLabel,
  normalizeHostCommission,
  platformFeePercentFor,
  previewBookingSplit,
} from "./commissions.ts";
import { listingPriceBreakdown } from "./experiencePrice.ts";
import { DEFAULT_TIME_SLOTS, isValidHostId, priceSummary } from "./guestBooking.ts";
import { normalizeUsername, usernameError } from "./vendorAccounts.ts";

/**
 * Booking requests for the static Airbnb experience catalog.
 * The edge function imports this module and recomputes the price here.
 * Guests never see commission fields. Those are added to the stored
 * snapshot only when a host ref is present.
 */

export const BOOKING_TIME_ZONE = "America/Cancun";
export const NOTES_MAX = 1000;
const GUEST_CAP_WHEN_UNSTATED = 10;

export interface CatalogListing {
  id: string;
  username: string;
  title: string;
  price: AirbnbPrice | null;
  groupSize: string | null;
  times?: readonly string[] | null;
  /** Absent on the Airbnb catalog. Do not invent one. */
  commissionPercentage?: number | null;
}

export interface GuestFacingBreakdown {
  guests: number;
  subtotal: string | null;
  fees: string | null;
  total: string | null;
  minimum: string | null;
}

export interface StoredPriceSnapshot extends GuestFacingBreakdown {
  priceOnRequest: boolean;
  currency: string | null;
  amountPerGuest: number | null;
  totalAmount: number | null;
  from: boolean;
  commissionPct?: number | null;
  commissionLabel?: string;
  platformFeePercent?: number | null;
  hostEarning?: number | null;
}

export interface BookingRequestRow {
  vendor_username: string;
  experience_id: string;
  experience_title: string;
  requested_date: string;
  time_slot: string;
  guests: number;
  guest_name: string;
  guest_email: string;
  guest_phone: string | null;
  notes: string | null;
  price_snapshot: StoredPriceSnapshot;
  host_ref: string | null;
  status: "pending";
}

export function calendarDate(now: Date, timeZone = BOOKING_TIME_ZONE): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Listing max when the page states one, otherwise the same cap the experience page already uses. */
export function guestLimit(groupSize: string | null): { min: number; max: number } {
  const stated = groupSizeMax(groupSize);
  const max = Math.min(50, stated ?? GUEST_CAP_WHEN_UNSTATED);
  return { min: 1, max: Math.max(1, max) };
}

export function timeSlotsFor(times: readonly string[] | null | undefined): string[] {
  const own = (times ?? [])
    .map((slot) => slot.trim())
    .filter((slot) => slot.length > 0 && slot.length <= 40);
  return own.length ? own : [...DEFAULT_TIME_SLOTS];
}

export function guestFacingBreakdown(snapshot: StoredPriceSnapshot): GuestFacingBreakdown {
  return {
    guests: snapshot.guests,
    subtotal: snapshot.subtotal,
    fees: snapshot.fees,
    total: snapshot.total,
    minimum: snapshot.minimum,
  };
}

export function hostEarningFor(tier: unknown, totalAmount: number | null): {
  commissionPct: number | null;
  commissionLabel: string;
  platformFeePercent: number | null;
  hostEarning: number | null;
} {
  const pct = normalizeHostCommission(tier);
  if (pct == null) {
    return { commissionPct: null, commissionLabel: "not set", platformFeePercent: null, hostEarning: null };
  }
  const platformFeePercent = platformFeePercentFor(pct);
  if (totalAmount == null || !Number.isFinite(totalAmount)) {
    return { commissionPct: pct, commissionLabel: hostCommissionLabel(pct), platformFeePercent, hostEarning: null };
  }
  return {
    commissionPct: pct,
    commissionLabel: hostCommissionLabel(pct),
    platformFeePercent,
    hostEarning: previewBookingSplit(totalAmount, pct).hostEarns,
  };
}

export function buildPriceSnapshot(listing: CatalogListing, guests: number, hostRef: string | null): StoredPriceSnapshot {
  const price = listing.price;
  let base: StoredPriceSnapshot;
  if (!price) {
    base = {
      priceOnRequest: true,
      guests,
      subtotal: null,
      fees: null,
      total: null,
      minimum: null,
      currency: null,
      amountPerGuest: null,
      totalAmount: null,
      from: false,
    };
  } else {
    const view = listingPriceBreakdown(price, guests);
    const summary = priceSummary(price.amount, guests);
    const minimumApplies = price.minimumAmount != null && price.minimumAmount > summary.total;
    const totalAmount = minimumApplies ? (price.minimumAmount as number) : summary.total;
    base = {
      priceOnRequest: false,
      guests: view.guests,
      subtotal: view.subtotal,
      fees: view.fees,
      total: view.total,
      minimum: view.minimum,
      currency: price.currency,
      amountPerGuest: price.amount,
      totalAmount,
      from: price.from,
    };
  }
  if (!hostRef) return base;
  return { ...base, ...hostEarningFor(listing.commissionPercentage ?? null, base.totalAmount) };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isRealDate(iso: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function cleanPhone(value: unknown): { phone: string | null; error?: string } {
  if (value == null || value === "") return { phone: null };
  const phone = String(value).trim();
  if (phone.length < 7 || phone.length > 30 || !/^[0-9+().\-\s]+$/.test(phone)) {
    return { phone: null, error: "That phone number doesn't look right." };
  }
  return { phone };
}

export function prepareBookingRequest(
  raw: unknown,
  listing: CatalogListing | null,
  now = new Date(),
): { ok: true; row: BookingRequestRow } | { ok: false; error: string } {
  if (!isRecord(raw)) return { ok: false, error: "That request couldn't be read." };
  if (!listing) return { ok: false, error: "That experience isn't in the catalog." };

  const username = normalizeUsername(String(raw.vendorUsername ?? raw.vendor_username ?? ""));
  if (usernameError(username) || username !== listing.username) {
    return { ok: false, error: "That experience isn't in the catalog." };
  }
  const experienceId = String(raw.experienceId ?? raw.experience_id ?? "").trim();
  const normalizedId = experienceId.startsWith("airbnb-") ? experienceId : `airbnb-${experienceId}`;
  if (normalizedId !== listing.id) return { ok: false, error: "That experience isn't in the catalog." };

  const requestedDate = String(raw.requestedDate ?? raw.requested_date ?? "").trim();
  if (!isRealDate(requestedDate) || requestedDate < calendarDate(now)) {
    return { ok: false, error: "Choose a date that hasn't passed." };
  }

  const slots = timeSlotsFor(listing.times);
  const timeSlot = String(raw.timeSlot ?? raw.time_slot ?? "").trim();
  if (!slots.includes(timeSlot)) return { ok: false, error: "Choose one of the available times." };

  const limits = guestLimit(listing.groupSize);
  const guests = raw.guests;
  if (typeof guests !== "number" || !Number.isInteger(guests) || guests < limits.min || guests > limits.max) {
    return { ok: false, error: `Guest count has to be between ${limits.min} and ${limits.max}.` };
  }

  const guestName = String(raw.guestName ?? raw.guest_name ?? "").trim();
  if (guestName.length < 2 || guestName.length > 80) {
    return { ok: false, error: "Add your name so the vendor knows who's coming." };
  }
  const guestEmail = String(raw.guestEmail ?? raw.guest_email ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail) || guestEmail.length > 200) {
    return { ok: false, error: "Add an email for your confirmation." };
  }
  const phone = cleanPhone(raw.guestPhone ?? raw.guest_phone);
  if (phone.error) return { ok: false, error: phone.error };

  const notesRaw = raw.notes == null ? "" : String(raw.notes).trim();
  if (notesRaw.length > NOTES_MAX) return { ok: false, error: "Keep the note under 1,000 characters." };

  const hostRaw = raw.hostRef ?? raw.host_ref;
  const hostRef = hostRaw == null || hostRaw === "" ? null : String(hostRaw).trim();
  if (hostRef && !isValidHostId(hostRef)) return { ok: false, error: "That host link isn't valid." };

  return {
    ok: true,
    row: {
      vendor_username: listing.username,
      experience_id: listing.id,
      experience_title: listing.title.slice(0, 200),
      requested_date: requestedDate,
      time_slot: timeSlot,
      guests,
      guest_name: guestName,
      guest_email: guestEmail,
      guest_phone: phone.phone,
      notes: notesRaw || null,
      price_snapshot: buildPriceSnapshot(listing, guests, hostRef),
      host_ref: hostRef,
      status: "pending",
    },
  };
}
