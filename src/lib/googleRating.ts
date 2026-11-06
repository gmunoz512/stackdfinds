// Single source of truth for Google ratings shown anywhere in the app.
// Canonical fields:
//  - Restaurants: live Google Places data (useGoogleReviews → rating / totalReviews).
//    A place's own `rating` is its Google rating (live from the API, or copied from Google into the catalog).
//  - Vendors/experiences: vendor_profiles.google_rating is typed in by the vendor, so it is
//    NOT shown as a Google rating until it comes from a real Google source.
// Never invent a number: return null when there is no real rating.

export interface ResolvedGoogleRating {
  rating: number;
  reviewCount?: number;
}

const valid = (n: unknown): n is number =>
  typeof n === "number" && Number.isFinite(n) && n > 0 && n <= 5;

export function resolveGoogleRating(input: {
  google?: { rating?: number; totalReviews?: number } | null;
  place?: { rating?: number; reviewCount?: number; isFromApi?: boolean } | null;
  googleRating?: number | null;
  googleReviewCount?: number | null;
}): ResolvedGoogleRating | null {
  if (valid(input.google?.rating)) {
    return { rating: input.google!.rating!, reviewCount: input.google?.totalReviews ?? undefined };
  }
  if (valid(input.place?.rating)) {
    return { rating: input.place!.rating!, reviewCount: input.place!.reviewCount || undefined };
  }
  return null;
}
