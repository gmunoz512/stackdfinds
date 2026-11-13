import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { test } from "vitest";
import { GoogleRestaurantReviews } from "../src/components/GoogleRestaurantReviews.tsx";
import {
  googleRestaurantSnapshot,
  snapshotRatingNumber,
  snapshotReviewTotal,
  starCount,
} from "../src/data/googleRestaurantReviews.ts";

const saved = JSON.parse(readFileSync(new URL("../data/google-restaurant-reviews.json", import.meta.url), "utf8")) as Array<{
  id: string;
  rating: string;
  reviewCount: string;
  mapsUrl: string;
  reviews: { author: string; stars: string; when: string; text: string }[];
}>;

test("restaurant reviews stay the saved Google snapshot", () => {
  assert.equal(saved.length, 16);
  for (const row of saved) {
    const loaded = googleRestaurantSnapshot(row.id);
    assert.ok(loaded);
    assert.equal(loaded.rating, row.rating);
    assert.equal(loaded.reviewCount, row.reviewCount);
    assert.deepEqual(loaded.reviews, row.reviews);
    assert.equal(loaded.reviews.length, 3);
    assert.equal(snapshotRatingNumber(row.rating), Number(row.rating));
    assert.equal(snapshotReviewTotal(row.reviewCount), Number(row.reviewCount.replace(/,/g, "")));
    for (const review of row.reviews) assert.notEqual(starCount(review.stars), null, review.stars);
  }
  assert.equal(googleRestaurantSnapshot("r7"), null);
  assert.equal(googleRestaurantSnapshot("geo_123"), null);
  assert.equal(starCount("5 stars"), 5);
  assert.equal(starCount("5/5"), 5);
  assert.equal(starCount("2 stars"), 2);
  assert.equal(starCount("loved it"), null);
});

test("the detail section prints the saved review and hides a missing snapshot", () => {
  const arca = saved.find((row) => row.id === "r1");
  assert.ok(arca);
  const html = renderToStaticMarkup(createElement(GoogleRestaurantReviews, { id: "r1" }));
  assert.ok(html.includes(`${arca.rating} out of 5`));
  assert.ok(html.includes(`${arca.reviewCount} Google reviews`));
  assert.ok(html.includes("See all reviews on Google"));
  assert.ok(html.includes("Reviews from Google Maps, as of Nov 2026"));
  assert.ok(html.includes('target="_blank"'));
  assert.ok(html.includes('rel="noopener noreferrer"'));
  assert.ok(html.includes(arca.mapsUrl.replace(/&/g, "&amp;")));
  for (const review of arca.reviews) {
    assert.ok(html.includes(review.author));
    assert.ok(html.includes(review.text));
    assert.ok(html.includes(review.when));
  }
  assert.equal(html.includes("profile_photo"), false);
  assert.equal(renderToStaticMarkup(createElement(GoogleRestaurantReviews, { id: "r7" })), "");
});