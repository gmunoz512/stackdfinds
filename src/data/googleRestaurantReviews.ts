import snapshot from "../../data/google-restaurant-reviews.json";

export interface GoogleSnapshotReview {
  author: string;
  stars: string;
  when: string;
  text: string;
}

export interface GoogleRestaurantReviewSnapshot {
  id: string;
  name: string;
  rating: string;
  reviewCount: string;
  mapsUrl: string;
  reviews: GoogleSnapshotReview[];
}

const rows = snapshot as GoogleRestaurantReviewSnapshot[];
const byId = new Map(rows.map((row) => [row.id, row]));

export function googleRestaurantSnapshot(id: string | undefined | null): GoogleRestaurantReviewSnapshot | null {
  if (!id) return null;
  return byId.get(id) ?? null;
}

export function snapshotRatingNumber(rating: string): number | undefined {
  const value = Number(rating);
  return Number.isFinite(value) && value > 0 && value <= 5 ? value : undefined;
}

export function snapshotReviewTotal(reviewCount: string): number | undefined {
  if (!/^\d{1,3}(,\d{3})*$/.test(reviewCount)) return undefined;
  const value = Number(reviewCount.replace(/,/g, ""));
  return Number.isSafeInteger(value) && value > 0 ? value : undefined;
}

export function starCount(stars: string): number | null {
  const match = stars.trim().match(/^([1-5])(?:\s+stars?|\s*\/\s*5)$/i);
  return match ? Number(match[1]) : null;
}
