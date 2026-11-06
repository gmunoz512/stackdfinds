import { useQuery } from "@tanstack/react-query";

export interface GoogleReview {
  author_name: string;
  profile_photo_url?: string;
  rating: number;
  relative_time_description: string;
  text: string;
}

export interface GoogleReviewsData {
  placeId?: string;
  name?: string;
  rating?: number;
  totalReviews?: number;
  reviews?: GoogleReview[];
  photos?: string[];
  googleMapsUrl?: string;
}

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

/** Shared cache key used by every screen so one place never shows two ratings. */
export const googleReviewsCacheKey = (id: string) => `google_reviews_detail_${id}`;

const readCache = (id: string): GoogleReviewsData | null => {
  try {
    const raw = localStorage.getItem(googleReviewsCacheKey(id));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.timestamp || Date.now() - parsed.timestamp > CACHE_DURATION_MS) {
      localStorage.removeItem(googleReviewsCacheKey(id));
      return null;
    }
    const { timestamp, ...data } = parsed;
    return data as GoogleReviewsData;
  } catch {
    return null;
  }
};

interface UseGoogleReviewsOptions {
  /** Stable id used as the shared cache key (e.g. restaurant id). */
  id?: string | null;
  placeId?: string | null;
  searchQuery?: string | null;
  lat?: number;
  lng?: number;
  enabled?: boolean;
}

/**
 * Google Places ratings/photos/reviews.
 * Paid Places lookups are turned off — catalog data comes from
 * src/data/googlePlaces.json. This hook only returns a short-lived
 * localStorage cache from earlier sessions and never calls Google.
 */
export function useGoogleReviews({
  id,
  placeId,
  searchQuery,
  enabled = true,
}: UseGoogleReviewsOptions) {
  const cacheId = id ?? placeId ?? searchQuery ?? "";

  return useQuery<GoogleReviewsData | null>({
    queryKey: ["google-reviews", cacheId],
    enabled: Boolean(enabled && cacheId),
    staleTime: CACHE_DURATION_MS,
    gcTime: CACHE_DURATION_MS,
    retry: false,
    initialData: () => (cacheId ? readCache(cacheId) ?? undefined : undefined),
    queryFn: async () => {
      // Never invoke the google-reviews edge function (billed Places API).
      return readCache(cacheId);
    },
  });
}
