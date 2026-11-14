import snapshot from "../../data/google-restaurant-photos.json";

const byId = snapshot as Record<string, string[]>;

export function googleRestaurantPhotos(id: string | undefined | null): string[] | null {
  if (!id) return null;
  const photos = byId[id];
  return photos?.length ? photos : null;
}

type GallerySource = {
  id: string;
  photos: string[];
  googleFetchedAt?: string;
} | null | undefined;

/** Snapshot galleries stay whole. Other restaurants keep the shorter fallback. */
export function restaurantGallery(restaurant: GallerySource): { photos: string[]; fromGoogleMaps: boolean } {
  if (!restaurant) return { photos: [], fromGoogleMaps: false };
  const saved = googleRestaurantPhotos(restaurant.id);
  if (saved) return { photos: saved, fromGoogleMaps: true };
  const current = restaurant.googleFetchedAt ? restaurant.photos.slice(0, 1) : restaurant.photos;
  return { photos: current.slice(0, 6), fromGoogleMaps: false };
}
