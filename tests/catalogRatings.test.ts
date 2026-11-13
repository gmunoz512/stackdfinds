import assert from "node:assert/strict";
import { test } from "vitest";
import { mockRestaurants } from "../src/data/mockRestaurants.ts";
import googlePlaces from "../src/data/googlePlaces.json";
import reviews from "../data/google-restaurant-reviews.json";

test("catalog only shows ratings from a Google Maps snapshot", () => {
  for (const closed of ["Noma Tulum", "Kitchen Table", "Raw Love", "Rosa del Viento", "Cenzontle", "La Nave Pizzeria", "Trattoria Romana"]) {
    assert.equal(mockRestaurants.some((r) => r.name === closed), false, closed);
  }
  const byId = new Map(reviews.map((row) => [row.id, row]));
  for (const r of mockRestaurants) {
    const snap = byId.get(r.id);
    const place = (googlePlaces.places as Record<string, { rating: number; mapsUrl: string }>)[r.name];
    if (snap) {
      assert.equal(r.rating, Number(snap.rating), r.name);
      assert.equal(r.reviewCount, Number(snap.reviewCount.replace(/,/g, "")), r.name);
      assert.equal(r.googleMapsUrl, snap.mapsUrl, r.name);
    } else {
      assert.equal(r.rating, place?.rating, r.name);
      assert.equal(r.reviewCount, undefined, r.name);
      assert.equal(r.googleMapsUrl, place?.mapsUrl, r.name);
    }
  }
});
