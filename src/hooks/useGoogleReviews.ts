import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

const writeCache = (id: string, data: GoogleReviewsData) => {
  try {
    localStorage.setItem(
      googleReviewsCacheKey(id),
      JSON.stringify({ ...data, timestamp: Date.now() })
    );
  } catch {
    /* storage full or unavailable — ignore */
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
 * Single source of truth for Google Places ratings/photos/reviews.
 * Replaces the per-screen localStorage caching that used to drift apart.
 */
export function useGoogleReviews({
  id,
  placeId,
  searchQuery,
  lat,
  lng,
  enabled = true,
}: UseGoogleReviewsOptions) {
  const cacheId = id ?? placeId ?? searchQuery ?? "";

  return useQuery<GoogleReviewsData | null>({
    queryKey: ["google-reviews", cacheId],
    enabled: Boolean(enabled && cacheId && (placeId || searchQuery)),
    staleTime: CACHE_DURATION_MS,
    gcTime: CACHE_DURATION_MS,
    retry: false,
    initialData: () => (cacheId ? readCache(cacheId) ?? undefined : undefined),
    queryFn: async () => {
      const cached = readCache(cacheId);
      if (cached) return cached;

      const { data, error } = await supabase.functions.invoke("google-reviews", {
        body: placeId ? { placeId } : { searchQuery, lat, lng },
      });

      if (error) throw error;
      if (!data || data.error) return null;

      writeCache(cacheId, data as GoogleReviewsData);
      return data as GoogleReviewsData;
    },
  });
}
