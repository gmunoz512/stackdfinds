import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { test } from "vitest";
import { RestaurantGallery } from "../src/components/RestaurantGallery.tsx";
import { mockRestaurants } from "../src/data/mockRestaurants.ts";
import { googleRestaurantPhotos, restaurantGallery } from "../src/data/googleRestaurantPhotos.ts";

const root = join(import.meta.dirname, "..");
const saved = JSON.parse(readFileSync(new URL("../data/google-restaurant-photos.json", import.meta.url), "utf8")) as Record<string, string[]>;

test("each saved restaurant has 6 to 8 local Google photos", () => {
  const ids = Object.keys(saved).sort();
  assert.equal(ids.length, 16);
  for (const id of ids) {
    const photos = googleRestaurantPhotos(id);
    assert.ok(photos);
    assert.ok(photos.length >= 6 && photos.length <= 8, id);
    assert.deepEqual(photos, saved[id]);
    photos.forEach((photo, index) => {
      assert.equal(photo, `/restaurant-photos/${id}/${index + 1}.jpg`);
      assert.equal(existsSync(join(root, "public", photo.slice(1))), true, photo);
    });
  }
  assert.equal(googleRestaurantPhotos("r7"), null);
  assert.equal(googleRestaurantPhotos("geo_123"), null);
});

test("photo 1 is the card cover and the gallery keeps the full snapshot", () => {
  const home = mockRestaurants.filter((r) => r.city.toLowerCase() === "tulum").slice(0, 8);
  for (const restaurant of mockRestaurants) {
    const shots = googleRestaurantPhotos(restaurant.id);
    const gallery = restaurantGallery(restaurant);
    if (shots) {
      assert.deepEqual(restaurant.photos, shots, restaurant.name);
      assert.equal(restaurant.photos[0], `/restaurant-photos/${restaurant.id}/1.jpg`);
      assert.deepEqual(gallery.photos, shots);
      assert.equal(gallery.fromGoogleMaps, true);
      assert.ok(gallery.photos.length >= 6);
    }
  }
  for (const restaurant of home) {
    assert.equal(restaurant.photos[0], restaurantGallery(restaurant).photos[0], restaurant.name);
  }
  const single = restaurantGallery({ id: "r7", photos: ["a", "b", "c", "d", "e", "f", "g"], googleFetchedAt: "2026-11-05" });
  assert.deepEqual(single.photos, ["a"]);
  assert.equal(single.fromGoogleMaps, false);
  const plain = restaurantGallery({ id: "r7", photos: ["a", "b", "c", "d", "e", "f", "g"] });
  assert.deepEqual(plain.photos, ["a", "b", "c", "d", "e", "f"]);
});

test("the gallery names each photo and credits Google Maps", () => {
  const arca = mockRestaurants.find((restaurant) => restaurant.id === "r1");
  assert.ok(arca);
  const html = renderToStaticMarkup(createElement(RestaurantGallery, { restaurant: arca }));
  assert.ok(html.includes("Photos from Google Maps"));
  assert.ok(html.includes('aria-label="Show all 8 photos"'));
  assert.ok(html.includes('alt="ARCA photo 1"'));
  assert.ok(html.includes('alt="ARCA photo 5"'));
  assert.ok(html.includes('width="1200"'));
  assert.ok(html.includes('height="900"'));
  assert.ok(html.includes('loading="lazy"'));
  assert.equal(html.includes("Illustrative photo"), false);
  const fallback = renderToStaticMarkup(createElement(RestaurantGallery, {
    restaurant: { id: "r7", name: "Sample", photos: ["/assets/sample.jpg"], googleFetchedAt: undefined },
  }));
  assert.ok(fallback.includes("Illustrative photo"));
  assert.equal(fallback.includes("Photos from Google Maps"), false);
  assert.ok(fallback.includes('alt="Sample photo 1"'));
});
