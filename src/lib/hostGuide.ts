/**
 * Host guide data lives in `profiles.recommendations` (JSON array) so the
 * public guide keeps working through the existing `host-guide` edge function
 * with no schema change.
 *
 * Array items:
 *  - { type: 'property', id: 'property', name, area, photoUrl, addedAt }
 *  - { type: 'vendor' | 'experience' | 'restaurant', id, addedAt,
 *      note?, category?, position? }
 *
 * Older code only reads { id, type, addedAt } and ignores unknown types, so
 * the extra fields are backward compatible.
 */

export const GUIDE_CATEGORIES = [
  'Tours & adventures',
  'Water & beach',
  'Food & drink',
  'Wellness',
  'Culture',
  'Nightlife',
  'Getting around',
  'Other',
] as const;

export type GuideCategory = (typeof GUIDE_CATEGORIES)[number];

export type GuideEntryType = 'vendor' | 'experience' | 'restaurant';

export interface GuideEntry {
  id: string;
  type: GuideEntryType;
  addedAt: string;
  note?: string;
  category?: GuideCategory;
  position?: number;
}

export interface GuideProperty {
  name: string;
  area: string;
  photoUrl: string | null;
}

export interface ParsedGuide {
  property: GuideProperty | null;
  entries: GuideEntry[];
}

export const NOTE_MAX = 280;
const ENTRY_TYPES: GuideEntryType[] = ['vendor', 'experience', 'restaurant'];

const str = (v: unknown, max = 200): string =>
  typeof v === 'string' ? v.trim().slice(0, max) : '';

export function isGuideCategory(v: unknown): v is GuideCategory {
  return typeof v === 'string' && (GUIDE_CATEGORIES as readonly string[]).includes(v);
}

/** Map a vendor_profiles.category value onto a guide section. */
export function defaultGuideCategory(vendorCategory: string | null | undefined): GuideCategory {
  const c = (vendorCategory || '').toLowerCase();
  if (/(snorkel|dive|diving|boat|sail|surf|kayak|paddle|beach|cenote|fish|ocean|water)/.test(c)) return 'Water & beach';
  if (/(food|restaurant|chef|cook|taco|bar|drink|mezcal|wine|coffee|cafe)/.test(c)) return 'Food & drink';
  if (/(spa|massage|yoga|wellness|temazcal|retreat|healing)/.test(c)) return 'Wellness';
  if (/(ruin|museum|culture|art|history|mayan|ceremony)/.test(c)) return 'Culture';
  if (/(night|club|party|dj)/.test(c)) return 'Nightlife';
  if (/(transport|taxi|driver|bike|scooter|rental|car)/.test(c)) return 'Getting around';
  if (/(tour|adventure|atv|zip|jungle|excursion|experience|activity)/.test(c)) return 'Tours & adventures';
  return 'Other';
}

export function parseGuide(data: unknown): ParsedGuide {
  // Legacy onboarding wrote { property: { name, city, ... } } as an object.
  if (data && typeof data === 'object' && !Array.isArray(data)) {
    const legacy = (data as Record<string, unknown>).property as Record<string, unknown> | undefined;
    const name = legacy ? str(legacy.name, 80) : '';
    return { property: name ? { name, area: str(legacy?.city, 80), photoUrl: null } : null, entries: [] };
  }
  if (!Array.isArray(data)) return { property: null, entries: [] };
  let property: GuideProperty | null = null;
  const entries: GuideEntry[] = [];
  const seen = new Set<string>();

  for (const raw of data) {
    if (!raw || typeof raw !== 'object') continue;
    const obj = raw as Record<string, unknown>;
    if (obj.type === 'property') {
      const name = str(obj.name, 80);
      if (name) {
        const photo = str(obj.photoUrl, 500);
        property = {
          name,
          area: str(obj.area, 80),
          photoUrl: /^https:\/\//.test(photo) ? photo : null,
        };
      }
      continue;
    }
    if (typeof obj.id !== 'string' || !ENTRY_TYPES.includes(obj.type as GuideEntryType)) continue;
    const key = `${obj.type}:${obj.id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const entry: GuideEntry = {
      id: obj.id,
      type: obj.type as GuideEntryType,
      addedAt: typeof obj.addedAt === 'string' ? obj.addedAt : new Date(0).toISOString(),
    };
    const note = str(obj.note, NOTE_MAX);
    if (note) entry.note = note;
    if (isGuideCategory(obj.category)) entry.category = obj.category;
    if (typeof obj.position === 'number' && Number.isFinite(obj.position)) entry.position = obj.position;
    entries.push(entry);
  }

  return { property, entries: sortEntries(entries) };
}

/** Explicit positions first (ascending), then by the order they were added. */
export function sortEntries(entries: GuideEntry[]): GuideEntry[] {
  return entries
    .map((e, i) => ({ e, i }))
    .sort((a, b) => {
      const pa = a.e.position ?? Number.POSITIVE_INFINITY;
      const pb = b.e.position ?? Number.POSITIVE_INFINITY;
      if (pa !== pb) return pa - pb;
      return a.i - b.i;
    })
    .map(({ e }) => e);
}

export function serializeGuide(guide: ParsedGuide): Record<string, unknown>[] {
  const out: Record<string, unknown>[] = [];
  if (guide.property && guide.property.name.trim()) {
    out.push({
      type: 'property',
      id: 'property',
      addedAt: new Date().toISOString(),
      name: guide.property.name.trim().slice(0, 80),
      area: guide.property.area.trim().slice(0, 80),
      photoUrl: guide.property.photoUrl,
    });
  }
  guide.entries.forEach((e, index) => {
    const item: Record<string, unknown> = { id: e.id, type: e.type, addedAt: e.addedAt, position: index };
    if (e.note?.trim()) item.note = e.note.trim().slice(0, NOTE_MAX);
    if (e.category) item.category = e.category;
    out.push(item);
  });
  return out;
}

export function moveEntry<T>(list: T[], from: number, to: number): T[] {
  if (from < 0 || from >= list.length || to < 0 || to >= list.length || from === to) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** Group entries into guide sections, keeping entry order inside each section. */
export function groupByCategory<T extends { category?: GuideCategory }>(
  items: T[],
  fallback: (item: T) => GuideCategory,
): { category: GuideCategory; items: T[] }[] {
  const map = new Map<GuideCategory, T[]>();
  for (const item of items) {
    const cat = item.category ?? fallback(item);
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(item);
  }
  return GUIDE_CATEGORIES.filter((c) => map.has(c)).map((c) => ({ category: c, items: map.get(c)! }));
}

/** Affiliate attribution: every link out of a guide carries ?host=<hostUserId>. */
export function withHostRef(path: string, hostId: string): string {
  const [base, hash] = path.split('#');
  const sep = base.includes('?') ? '&' : '?';
  const out = /[?&]host=/.test(base) ? base : `${base}${sep}host=${encodeURIComponent(hostId)}`;
  return hash !== undefined ? `${out}#${hash}` : out;
}

export function guidePath(hostId: string): string {
  return `/guide/${hostId}`;
}

/** Add/remove a simple entry on the raw JSON array without dropping guide extras. */
export function addEntryRaw(raw: unknown, entry: { id: string; type: GuideEntryType }): Record<string, unknown>[] {
  const guide = parseGuide(raw);
  if (guide.entries.some((e) => e.id === entry.id && e.type === entry.type)) return serializeGuide(guide);
  guide.entries.push({ ...entry, addedAt: new Date().toISOString() });
  return serializeGuide(guide);
}

export function removeEntryRaw(raw: unknown, entry: { id: string; type: GuideEntryType }): Record<string, unknown>[] {
  const guide = parseGuide(raw);
  guide.entries = guide.entries.filter((e) => !(e.id === entry.id && e.type === entry.type));
  return serializeGuide(guide);
}

const SAVES_KEY = 'stackd:guide-saves';

/** Guest hearts on a public guide. Stored on the device so no login is needed. */
export function readGuideSaves(storage: Pick<Storage, 'getItem'> | null): Set<string> {
  try {
    const raw = storage?.getItem(SAVES_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr.filter((x) => typeof x === 'string') : []);
  } catch {
    return new Set();
  }
}

export function toggleGuideSave(
  storage: Pick<Storage, 'getItem' | 'setItem'> | null,
  id: string,
): Set<string> {
  const saves = readGuideSaves(storage);
  if (saves.has(id)) saves.delete(id);
  else saves.add(id);
  try {
    storage?.setItem(SAVES_KEY, JSON.stringify([...saves]));
  } catch {
    /* storage full or blocked; keep in memory */
  }
  return saves;
}

export const TOP_PICKS = 8;

/** Host profile layout: the first 8 picks are the "Top 8", the rest are "More picks". */
export function splitTopPicks<T>(items: T[], size = TOP_PICKS): { top: T[]; more: T[] } {
  return { top: items.slice(0, size), more: items.slice(size) };
}

/** Where a guide tile leads: straight to booking for vendors, always with the host ref. */
export function bookingHrefFor(entry: { id: string; type: GuideEntryType }, hostId: string): string {
  const base = entry.type === 'restaurant' ? `/restaurant/${entry.id}` : `/vendor/${entry.id}/book`;
  return withHostRef(base, hostId);
}
