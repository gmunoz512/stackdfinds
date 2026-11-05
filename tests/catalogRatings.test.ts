import assert from "node:assert/strict";
import { test } from "vitest";
import { mockRestaurants } from "../src/data/mockRestaurants.ts";
import googlePlaces from "../src/data/googlePlaces.json";

test("catalog only shows ratings from the Google Maps snapshot", () => {
  assert.equal(mockRestaurants.some((r) => r.name === "Noma Tulum"), false);
  for (const r of mockRestaurants) {
    const g = (googlePlaces.places as Record<string, { rating: number }>)[r.name];
    assert.equal(r.rating, g?.rating, r.name);
    assert.equal(r.reviewCount, undefined);
  }
});
