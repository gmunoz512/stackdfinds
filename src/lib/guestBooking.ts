/**
 * Phase 5 guest booking helpers: host attribution persistence, price
 * summary, and guest-details validation. Pure functions where possible so
 * they can be unit tested in node.
 */

export const HOST_ATTRIBUTION_KEY = "stackd_host_ref";
export const HOST_ATTRIBUTION_DAYS = 30;

type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

interface StoredRef {
  hostId: string;
  savedAt: number;
}

function stores(): StorageLike[] {
  const out: StorageLike[] = [];
  try {
    if (typeof localStorage !== "undefined") out.push(localStorage);
  } catch {
    /* storage blocked */
  }
  try {
    if (typeof sessionStorage !== "undefined") out.push(sessionStorage);
  } catch {
    /* storage blocked */
  }
  return out;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidHostId(value: unknown): value is string {
  return typeof value === "string" && UUID_RE.test(value.trim());
}

/** Remember the host who referred this guest (last click wins). */
export function rememberHost(hostId: string | null | undefined, now = Date.now(), targets = stores()): void {
  if (!isValidHostId(hostId)) return;
  const payload = JSON.stringify({ hostId: hostId.trim(), savedAt: now } satisfies StoredRef);
  for (const s of targets) {
    try {
      s.setItem(HOST_ATTRIBUTION_KEY, payload);
    } catch {
      /* quota or privacy mode */
    }
  }
}

/** The remembered host, or null if none or older than 30 days. */
export function getRememberedHost(now = Date.now(), targets = stores()): string | null {
  for (const s of targets) {
    try {
      const raw = s.getItem(HOST_ATTRIBUTION_KEY);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as Partial<StoredRef>;
      if (!isValidHostId(parsed.hostId) || typeof parsed.savedAt !== "number") continue;
      if (now - parsed.savedAt > HOST_ATTRIBUTION_DAYS * 86_400_000) {
        s.removeItem(HOST_ATTRIBUTION_KEY);
        continue;
      }
      return parsed.hostId;
    } catch {
      /* bad JSON */
    }
  }
  return null;
}

/** URL param wins over the remembered host; a valid URL param is also saved. */
export function resolveHostAttribution(urlHost: string | null | undefined, now = Date.now(), targets = stores()): string | null {
  if (isValidHostId(urlHost)) {
    rememberHost(urlHost, now, targets);
    return urlHost.trim();
  }
  return getRememberedHost(now, targets);
}

export interface PriceSummary {
  pricePerPerson: number;
  guests: number;
  subtotal: number;
  discount: number;
  total: number;
}

/**
 * What the guest pays. Guests pay the listed price only: the host commission
 * and the stackd fee both come out of the vendor's side, never added on top.
 */
export function priceSummary(pricePerPerson: number, guests: number, discount = 0): PriceSummary {
  const p = Number.isFinite(pricePerPerson) && pricePerPerson > 0 ? pricePerPerson : 0;
  const g = Number.isInteger(guests) && guests > 0 ? guests : 1;
  const subtotal = Math.round(p * g * 100) / 100;
  const d = Math.min(Math.max(0, discount || 0), subtotal);
  return { pricePerPerson: p, guests: g, subtotal, discount: d, total: Math.round((subtotal - d) * 100) / 100 };
}

export function formatUsd(amount: number): string {
  return `$${amount.toFixed(Number.isInteger(amount) ? 0 : 2)}`;
}

export interface GuestDetails {
  fullName: string;
  email: string;
}

export function validateGuestDetails(d: GuestDetails): Partial<Record<keyof GuestDetails, string>> {
  const errors: Partial<Record<keyof GuestDetails, string>> = {};
  if (d.fullName.trim().length < 2) errors.fullName = "Add your name so the vendor knows who's coming.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email.trim())) errors.email = "Add an email for your confirmation.";
  return errors;
}

/** Time slots offered until vendors can set their own availability. */
export const DEFAULT_TIME_SLOTS = ["9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "6:00 PM"];
