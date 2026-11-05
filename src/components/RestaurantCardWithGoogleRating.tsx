import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { BlurImage } from "@/components/BlurImage";
import { GoogleRating } from "@/components/GoogleRating";
import { useGoogleReviews } from "@/hooks/useGoogleReviews";
import { resolveGoogleRating } from "@/lib/googleRating";
import type { Restaurant } from "@/data/mockRestaurants";

interface RestaurantCardWithGoogleRatingProps {
  restaurant: Restaurant;
  index: number;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  showFavoriteButton?: boolean;
}

export const RestaurantCardWithGoogleRating = ({
  restaurant,
  index,
  isFavorite = false,
  onToggleFavorite,
  showFavoriteButton = false,
}: RestaurantCardWithGoogleRatingProps) => {
  const { data: googleData } = useGoogleReviews({
    id: restaurant.id,
    searchQuery: `${restaurant.name} restaurant ${restaurant.address} ${restaurant.city}`,
    lat: restaurant.coordinates?.lat,
    lng: restaurant.coordinates?.lng,
  });

  const rating = resolveGoogleRating({
    google: googleData ? { rating: googleData.rating, totalReviews: googleData.totalReviews } : null,
    place: {
      rating: restaurant.rating,
      reviewCount: restaurant.reviewCount,
      isFromApi: restaurant.isFromApi,
    },
  });
  const displayPhoto = googleData?.photos?.[0] ?? restaurant.photos[0];

  return (
    <Link
      to={`/restaurant/${restaurant.id}`}
      className="flex-shrink-0 w-36 animate-fade-in group"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="aspect-square rounded-xl overflow-hidden relative transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-[0_10px_30px_-5px_rgba(0,0,0,0.3)]">
        <BlurImage
          src={displayPhoto}
          alt={restaurant.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        {showFavoriteButton && onToggleFavorite && (
          <button
            type="button"
            aria-label={isFavorite ? `Remove ${restaurant.name} from saved` : `Save ${restaurant.name}`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite(restaurant.id);
            }}
            className="absolute top-2 right-2 z-10"
          >
            <Heart
              className={`h-5 w-5 drop-shadow-md ${
                isFavorite
                  ? "fill-danger text-danger"
                  : "fill-ink/40 text-paper"
              }`}
            />
          </button>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-ink/70 to-transparent p-2">
          <p className="text-paper text-xs font-medium line-clamp-1">{restaurant.name}</p>
          <div className="flex items-center gap-1 text-paper/80 text-[10px]">
            <GoogleRating value={rating} showCount={false} className="text-[10px] text-inherit" starClassName="h-2.5 w-2.5" />
            <span>•</span>
            <span>{restaurant.priceRange}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default RestaurantCardWithGoogleRating;
