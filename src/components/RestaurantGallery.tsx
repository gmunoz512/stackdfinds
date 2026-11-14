import StackedPhotoGrid from "@/components/ui/stacked-photo-grid";
import { restaurantGallery } from "@/data/googleRestaurantPhotos";

type GalleryRestaurant = {
  id: string;
  name: string;
  photos: string[];
  googleFetchedAt?: string;
};

export function RestaurantGallery({ restaurant }: { restaurant: GalleryRestaurant }) {
  const gallery = restaurantGallery(restaurant);
  if (!gallery.photos.length) return null;

  return (
    <div className="px-4 lg:px-6 lg:pt-2">
      {!gallery.fromGoogleMaps && !restaurant.googleFetchedAt ? (
        <p className="text-[10px] text-muted-foreground mb-2">Illustrative photo</p>
      ) : null}
      <StackedPhotoGrid
        photos={gallery.photos}
        alt={restaurant.name}
        credit={gallery.fromGoogleMaps ? "Photos from Google Maps" : undefined}
      />
    </div>
  );
}
