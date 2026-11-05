import assert from 'node:assert/strict';
import { test } from 'vitest';
import { buildReservationLink, normalizeResyVenueUrl } from '../../src/lib/reservations.ts';
import { mockRestaurants } from '@/data/mockRestaurants';

test('reservation links resolve to real Resy venues', () => {

const resy = (reservationUrl: string) => ({ reservationPlatform: 'resy' as const, reservationUrl });

// Valid venue URL keeps venue path and adds date + party size
assert.equal(
  buildReservationLink(resy('https://resy.com/cities/tlm/venues/restaurante-gitano-tulum'), { date: new Date(2026, 10, 3), partySize: 4 })?.url,
  'https://resy.com/cities/tlm/venues/restaurante-gitano-tulum?date=2026-11-03&seats=4'
);
// Legacy /cities/{city}/{slug} form is normalized to the /venues/ form
assert.equal(normalizeResyVenueUrl('https://resy.com/cities/ny/carbone')?.toString(), 'https://resy.com/cities/ny/venues/carbone');
// City pages, other hosts, junk and missing links are rejected -> fallback
assert.equal(buildReservationLink(resy('https://resy.com/cities/tlm')), null);
assert.equal(buildReservationLink(resy('https://evil.com/cities/tlm/venues/x')), null);
assert.equal(buildReservationLink(resy('javascript:alert(1)')), null);
assert.equal(buildReservationLink({ reservationPlatform: 'resy' }), null);
assert.equal(buildReservationLink({ reservationPlatform: null, reservationUrl: 'https://resy.com/cities/ny/venues/carbone' }), null);
// Invalid party sizes are ignored
assert.equal(buildReservationLink(resy('https://resy.com/cities/ny/venues/carbone'), { partySize: 0 })?.url, 'https://resy.com/cities/ny/venues/carbone');
// Every Resy restaurant in the app data resolves to a valid venue link
for (const r of mockRestaurants.filter(r => r.reservationPlatform === 'resy')) {
  assert.ok(buildReservationLink(r), `${r.name} has an invalid Resy link`);
}
});
