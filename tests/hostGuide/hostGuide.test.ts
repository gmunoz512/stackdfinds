import { describe, expect, it } from 'vitest';
import {
  addEntryRaw,
  defaultGuideCategory,
  groupByCategory,
  moveEntry,
  parseGuide,
  readGuideSaves,
  removeEntryRaw,
  serializeGuide,
  toggleGuideSave,
  withHostRef,
} from '@/lib/hostGuide';

const HOST = '11111111-1111-4111-8111-111111111111';

describe('hostGuide', () => {
  it('parses property + entries and sorts by position', () => {
    const g = parseGuide([
      { type: 'vendor', id: 'b', addedAt: '2026-01-02', position: 1, note: ' Ask for Luis ' },
      { type: 'property', id: 'property', name: 'Casa Sol', area: 'Aldea Zama', photoUrl: 'https://x/y.jpg' },
      { type: 'vendor', id: 'a', addedAt: '2026-01-01', position: 0, category: 'Water & beach' },
      { type: 'bogus', id: 'z' },
      { type: 'vendor', id: 'a', addedAt: 'dup' },
    ]);
    expect(g.property).toEqual({ name: 'Casa Sol', area: 'Aldea Zama', photoUrl: 'https://x/y.jpg' });
    expect(g.entries.map((e) => e.id)).toEqual(['a', 'b']);
    expect(g.entries[1].note).toBe('Ask for Luis');
    expect(g.entries[0].category).toBe('Water & beach');
  });

  it('rejects non-https property photos and junk categories', () => {
    const g = parseGuide([
      { type: 'property', name: 'X', photoUrl: 'javascript:alert(1)' },
      { type: 'vendor', id: 'a', addedAt: 'x', category: 'Hacks' },
    ]);
    expect(g.property?.photoUrl).toBeNull();
    expect(g.entries[0].category).toBeUndefined();
  });

  it('handles legacy object/null shapes', () => {
    expect(parseGuide(null)).toEqual({ property: null, entries: [] });
    expect(parseGuide({ property: {} })).toEqual({ property: null, entries: [] });
    expect(parseGuide({ property: { name: 'Casa Sol', city: 'Tulum', address: '1 Calle' } }).property).toEqual({
      name: 'Casa Sol', area: 'Tulum', photoUrl: null,
    });
  });

  it('round-trips through serialize with positions renumbered', () => {
    const g = parseGuide([
      { type: 'vendor', id: 'a', addedAt: 't' },
      { type: 'restaurant', id: 'r1', addedAt: 't' },
    ]);
    g.entries = moveEntry(g.entries, 1, 0);
    const again = parseGuide(serializeGuide(g));
    expect(again.entries.map((e) => [e.id, e.position])).toEqual([['r1', 0], ['a', 1]]);
  });

  it('add/remove keep property and notes', () => {
    const raw = [
      { type: 'property', name: 'Casa Sol', area: '', photoUrl: null },
      { type: 'vendor', id: 'a', addedAt: 't', note: 'go early' },
    ];
    const added = addEntryRaw(raw, { id: 'b', type: 'vendor' });
    const g = parseGuide(added);
    expect(g.property?.name).toBe('Casa Sol');
    expect(g.entries.find((e) => e.id === 'a')?.note).toBe('go early');
    expect(g.entries.map((e) => e.id)).toEqual(['a', 'b']);
    expect(parseGuide(removeEntryRaw(added, { id: 'a', type: 'vendor' })).entries.map((e) => e.id)).toEqual(['b']);
  });

  it('moveEntry ignores out-of-range moves', () => {
    expect(moveEntry([1, 2, 3], 0, 5)).toEqual([1, 2, 3]);
    expect(moveEntry([1, 2, 3], 2, 0)).toEqual([3, 1, 2]);
  });

  it('adds the host ref param once', () => {
    expect(withHostRef('/vendor/abc', HOST)).toBe(`/vendor/abc?host=${HOST}`);
    expect(withHostRef('/vendor/abc?mode=x', HOST)).toBe(`/vendor/abc?mode=x&host=${HOST}`);
    expect(withHostRef(`/vendor/abc?host=${HOST}`, HOST)).toBe(`/vendor/abc?host=${HOST}`);
    expect(withHostRef('/vendor/abc#book', HOST)).toBe(`/vendor/abc?host=${HOST}#book`);
  });

  it('groups by category in canonical order', () => {
    const groups = groupByCategory(
      [{ id: 1, category: 'Food & drink' as const }, { id: 2 }, { id: 3, category: 'Water & beach' as const }],
      () => 'Other',
    );
    expect(groups.map((g) => g.category)).toEqual(['Water & beach', 'Food & drink', 'Other']);
  });

  it('maps vendor categories', () => {
    expect(defaultGuideCategory('Snorkeling')).toBe('Water & beach');
    expect(defaultGuideCategory('Cooking class')).toBe('Food & drink');
    expect(defaultGuideCategory(null)).toBe('Other');
  });

  it('stores guest hearts on the device', () => {
    const mem: Record<string, string> = {};
    const s = { getItem: (k: string) => mem[k] ?? null, setItem: (k: string, v: string) => { mem[k] = v; } };
    expect(toggleGuideSave(s, 'a').has('a')).toBe(true);
    expect(readGuideSaves(s).has('a')).toBe(true);
    expect(toggleGuideSave(s, 'a').has('a')).toBe(false);
    expect(readGuideSaves(null).size).toBe(0);
  });
});

import { bookingHrefFor, splitTopPicks } from '@/lib/hostGuide';
describe('top 8 profile', () => {
  it('splits first 8 from the rest', () => {
    const { top, more } = splitTopPicks(Array.from({ length: 11 }, (_, i) => i));
    expect(top).toHaveLength(8);
    expect(more).toEqual([8, 9, 10]);
  });
  it('tiles go straight to booking with the host ref', () => {
    expect(bookingHrefFor({ id: 'v1', type: 'vendor' }, 'h1')).toBe('/vendor/v1/book?host=h1');
  });
});
