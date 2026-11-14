/** Sharing a host guide by text. Opens the guest's messaging app; never sends anything itself. */

export const GUIDE_ORIGIN = 'https://stackdfinds.com';
export const GUEST_NAME_MAX = 40;

export function cleanGuestName(name: string | null | undefined): string {
  return (name ?? '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, GUEST_NAME_MAX);
}

/** Personalized guide link: /guide/<hostId>?host=<hostId>[&guest=<name>]. */
export function shareGuideUrl(hostId: string, guestName?: string, origin = GUIDE_ORIGIN): string {
  const params = new URLSearchParams({ host: hostId });
  const guest = cleanGuestName(guestName);
  if (guest) params.set('guest', guest);
  return `${origin}/guide/${encodeURIComponent(hostId)}?${params.toString()}`;
}

/** Host page link: /h/<slug>?host=<hostId>[&guest=<name>]. */
export function shareHostPageUrl(slug: string, hostId: string, guestName?: string, origin = GUIDE_ORIGIN): string {
  const params = new URLSearchParams({ host: hostId });
  const guest = cleanGuestName(guestName);
  if (guest) params.set('guest', guest);
  return `${origin}/h/${encodeURIComponent(slug)}?${params.toString()}`;
}

export function defaultShareMessage(opts: {
  guestName?: string;
  propertyName?: string;
  arrivalDate?: string;
}): string {
  const guest = cleanGuestName(opts.guestName);
  const hello = guest ? `Hey ${guest}!` : 'Hey!';
  const place = opts.propertyName?.trim() ? ` at ${opts.propertyName.trim()}` : '';
  const when = opts.arrivalDate ? ` before you arrive on ${formatArrival(opts.arrivalDate)}` : '';
  return `${hello} Welcome to Tulum. I put together my favorite local spots and experiences for your stay${place}. Have a look${when} and book anything right here:`;
}

function formatArrival(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}

export function shareText(message: string, url: string): string {
  return `${message.trim()} ${url}`.trim();
}

export function cleanPhone(phone: string | null | undefined): string {
  return (phone ?? '').replace(/[^\d+]/g, '');
}

/** sms: deep link. `?&body=` is read by both iOS Messages and Android. */
export function smsHref(body: string, phone?: string): string {
  return `sms:${cleanPhone(phone)}?&body=${encodeURIComponent(body)}`;
}
