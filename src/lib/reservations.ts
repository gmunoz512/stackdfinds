// Builds safe, valid restaurant reservation links.
// Resy blocks being embedded (X-Frame-Options: DENY), so links must always open
// in a new tab (web) or the in-app browser (native) — never in an iframe.

export type ReservationPlatform = 'opentable' | 'resy' | 'yelp';

export interface ReservationLink {
  url: string;
  platform: ReservationPlatform;
}

export interface ReservationOptions {
  date?: Date;
  partySize?: number;
}

const RESY_HOSTS = new Set(['resy.com', 'www.resy.com']);
const SLUG = /^[a-z0-9][a-z0-9-]*$/i;

const toIsoDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/**
 * Normalizes a Resy URL to the canonical venue form
 * `https://resy.com/cities/{city}/venues/{slug}`. Accepts the legacy
 * `/cities/{city}/{slug}` form. Returns null for anything that is not a venue
 * page (city pages, search pages, other hosts, malformed URLs).
 */
export function normalizeResyVenueUrl(raw: string | undefined | null): URL | null {
  if (!raw) return null;
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  if (!RESY_HOSTS.has(url.hostname.toLowerCase())) return null;

  const parts = url.pathname.split('/').filter(Boolean);
  let city: string | undefined;
  let slug: string | undefined;
  if (parts.length === 4 && parts[0] === 'cities' && parts[2] === 'venues') {
    [, city, , slug] = parts;
  } else if (parts.length === 3 && parts[0] === 'cities' && parts[2] !== 'venues') {
    [, city, slug] = parts;
  }
  if (!city || !slug || !SLUG.test(city) || !SLUG.test(slug)) return null;

  return new URL(`https://resy.com/cities/${city.toLowerCase()}/venues/${slug.toLowerCase()}`);
}

/** Returns a bookable link for a restaurant, or null when none is valid. */
export function buildReservationLink(
  restaurant: { reservationUrl?: string | null; reservationPlatform?: ReservationPlatform | null },
  { date, partySize }: ReservationOptions = {}
): ReservationLink | null {
  const platform = restaurant.reservationPlatform;
  if (!platform || !restaurant.reservationUrl) return null;

  if (platform === 'resy') {
    const url = normalizeResyVenueUrl(restaurant.reservationUrl);
    if (!url) return null;
    if (date && !Number.isNaN(date.getTime())) url.searchParams.set('date', toIsoDate(date));
    if (partySize && Number.isInteger(partySize) && partySize > 0 && partySize <= 20) {
      url.searchParams.set('seats', String(partySize));
    }
    return { url: url.toString(), platform };
  }

  // Other platforms: only accept well-formed http(s) URLs.
  try {
    const url = new URL(restaurant.reservationUrl);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    if (date && !Number.isNaN(date.getTime())) url.searchParams.set('date', toIsoDate(date));
    return { url: url.toString(), platform };
  } catch {
    return null;
  }
}

/** Google Maps search link used as the fallback when online booking isn't available. */
export function googleMapsSearchUrl(restaurant: { name: string; address?: string; city?: string }) {
  const query = [restaurant.name, restaurant.address, restaurant.city].filter(Boolean).join(', ');
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
