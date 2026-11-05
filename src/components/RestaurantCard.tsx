import { Link } from "react-router-dom";
import { Heart, MapPin, Navigation, Plus, Check, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { isRestaurantOpen, type Restaurant } from "@/data/mockRestaurants";
import { toast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { formatDistance } from "@/services/googleMapsService";
import { useProfile } from "@/contexts/ProfileContext";
import { useAuthContext } from "@/contexts/AuthContext";
import { BlurImage } from "@/components/BlurImage";
import { GoogleRating } from "@/components/GoogleRating";
import { useGoogleReviews } from "@/hooks/useGoogleReviews";
import { resolveGoogleRating } from "@/lib/googleRating";

interface RestaurantCardProps {
  restaurant: Restaurant;
  variant?: 'horizontal' | 'vertical' | 'grid';
  size?: 'default' | 'small';
  showAddButton?: boolean;
}

const RestaurantCard = ({ restaurant, variant = 'horizontal', size = 'default', showAddButton = false }: RestaurantCardProps) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const isOpen = isRestaurantOpen(restaurant);

  // Shared Google data (rating/photos) — one cache for the whole app
  const { data: googleData } = useGoogleReviews({
    id: restaurant.id,
    searchQuery: `${restaurant.name} restaurant ${restaurant.address || ''} ${restaurant.city}`,
    lat: restaurant.coordinates?.lat,
    lng: restaurant.coordinates?.lng,
    enabled: Boolean(restaurant.coordinates?.lat && restaurant.coordinates?.lng),
  });

  const coverPhoto = googleData?.photos?.[0] ?? restaurant.photos[0];
  const rating = resolveGoogleRating({
    google: googleData ? { rating: googleData.rating, totalReviews: googleData.totalReviews } : null,
    place: {
      rating: restaurant.rating,
      reviewCount: restaurant.reviewCount,
      isFromApi: restaurant.isFromApi,
    },
  });

  const isSmall = size === 'small';
  
  const { isAuthenticated, role } = useAuthContext();
  const { hasRecommendation, addRecommendation, removeRecommendation } = useProfile();
  
  const isHost = isAuthenticated && role === 'host';
  const isSaved = hasRecommendation(restaurant.id, 'restaurant');

  useEffect(() => {
    const favorites = JSON.parse(localStorage.getItem("restaurantFavorites") || "[]");
    setIsFavorite(favorites.includes(restaurant.id));
  }, [restaurant.id]);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const favorites = JSON.parse(localStorage.getItem("restaurantFavorites") || "[]");
    let newFavorites;
    if (isFavorite) {
      newFavorites = favorites.filter((fav: string) => fav !== restaurant.id);
      toast({ title: "Removed from favorites", duration: 2000 });
    } else {
      newFavorites = [...favorites, restaurant.id];
      // Always cache the restaurant data so it can be retrieved in wishlists
      localStorage.setItem(`restaurant_${restaurant.id}`, JSON.stringify(restaurant));
      toast({ title: "Added to favorites", duration: 2000 });
    }
    localStorage.setItem("restaurantFavorites", JSON.stringify(newFavorites));
    setIsFavorite(!isFavorite);
  };

  const handleAddToGuide = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isHost) return;
    
    setIsAdding(true);
    try {
      if (isSaved) {
        await removeRecommendation(restaurant.id, 'restaurant');
        toast({ title: "Removed from guest guide", duration: 2000 });
      } else {
        await addRecommendation({ id: restaurant.id, type: 'restaurant' });
        toast({ title: "Added to guest guide!", duration: 2000 });
      }
    } catch (error) {
      toast({ title: "Failed to update", variant: "destructive", duration: 2000 });
    } finally {
      setIsAdding(false);
    }
  };

  // Cache API restaurant data before navigating
  const handleClick = (e: React.MouseEvent) => {
    if (restaurant.isFromApi) {
      localStorage.setItem(`restaurant_${restaurant.id}`, JSON.stringify(restaurant));
    }
  };

  if (variant === 'vertical') {
    return (
      <Link
        to={`/restaurant/${restaurant.id}`}
        className="block group"
        onClick={handleClick}
      >
        <div className="flex gap-4 p-3 rounded-xl hover:bg-muted/50 transition-colors">
          {/* Image */}
          <div className="relative w-24 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
            <BlurImage
              src={coverPhoto}
              alt={restaurant.name}
              className="group-hover:scale-105 transition-transform duration-500"
            />
            <button aria-label="Toggle favorite"
              onClick={toggleFavorite}
              className="absolute top-1.5 right-1.5 p-1 rounded-full hover:scale-110 active:scale-95 transition-transform"
            >
              <Heart
                className={`h-4 w-4 drop-shadow-md ${
                  isFavorite
                    ? "fill-danger text-danger"
                    : "fill-ink/50 text-paper stroke-paper stroke-2"
                }`}
              />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-sm line-clamp-1">{restaurant.name}</h3>
              {Object.keys(restaurant.hours || {}).length > 0 && (
                <Badge 
                  variant={isOpen ? "default" : "secondary"} 
                  className="text-[10px] shrink-0 px-1.5 py-0"
                >
                  {isOpen ? "Open" : "Closed"}
                </Badge>
              )}
            </div>
            
            <p className="text-xs text-muted-foreground">
              {restaurant.cuisine}
              {restaurant.priceRange && ` • ${restaurant.priceRange}`}
            </p>
            
            <GoogleRating value={rating} className="text-xs" starClassName="h-3 w-3" />
            
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span className="line-clamp-1">{restaurant.neighborhood || restaurant.city}</span>
              {restaurant.distance && (
                <>
                  <span>•</span>
                  <Navigation className="h-3 w-3" />
                  <span>{formatDistance(restaurant.distance)}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Card for horizontal scroll or grid
  const cardWidth = variant === 'grid' ? 'w-full' : 'flex-shrink-0 w-[200px]';
  
  return (
    <Link
      to={`/restaurant/${restaurant.id}`}
      className={`${cardWidth} group`}
      onClick={handleClick}
    >
      <div className={isSmall ? "space-y-1" : "space-y-2"}>
        {/* Image with blur-up loading */}
        <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
          <BlurImage
            src={coverPhoto}
            alt={restaurant.name}
            className="group-hover:scale-105 transition-transform duration-500"
          />
          
          {/* Add to guide button (for hosts) - Top Left */}
          {showAddButton ? (
            <button aria-label="Add restaurant to guide"
              onClick={handleAddToGuide}
              disabled={isAdding}
              className={`absolute top-2 left-2 z-20 p-2 rounded-full shadow-lg transition-all duration-200 ${
                isSaved 
                  ? 'bg-success text-paper' 
                  : 'bg-paper/95 text-foreground dark:bg-primary dark:text-paper hover:bg-primary hover:text-paper'
              }`}
            >
              {isAdding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isSaved ? (
                <Check className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </button>
          ) : (
            /* Favorite button */
            <button
              onClick={toggleFavorite}
              className={`absolute top-1 right-1 z-10 ${isSmall ? 'p-0.5' : 'p-1.5'} rounded-full hover:scale-110 active:scale-95 transition-transform`}
            >
              <Heart
                className={`${isSmall ? 'h-3.5 w-3.5' : 'h-5 w-5'} drop-shadow-md ${
                  isFavorite
                    ? "fill-danger text-danger"
                    : "fill-ink/50 text-paper stroke-paper stroke-2"
                }`}
              />
            </button>
          )}

          {/* Open/Closed badge - only show if we have hours data and not small */}
          {!isSmall && Object.keys(restaurant.hours || {}).length > 0 && (
            <Badge 
              className={`absolute top-2 left-2 text-[10px] px-2 py-0.5 ${
                isOpen 
                  ? 'bg-success/90 text-paper border-0' 
                  : 'bg-ink/70 text-paper border-0'
              }`}
            >
              {isOpen ? "Open Now" : "Closed"}
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="space-y-0.5">
          <h3 className={`font-semibold leading-tight line-clamp-1 ${isSmall ? 'text-xs' : 'text-sm'}`}>
            {restaurant.name}
          </h3>
          {!isSmall && (
            <p className="text-xs text-muted-foreground line-clamp-1">
              {restaurant.cuisine} • {restaurant.neighborhood || restaurant.city}
            </p>
          )}
          <div className={`flex items-center ${isSmall ? 'gap-0.5' : 'justify-between pt-0.5'}`}>
            <GoogleRating
              value={rating}
              className={isSmall ? "text-[10px]" : "text-xs"}
              starClassName={isSmall ? "h-2.5 w-2.5" : "h-3.5 w-3.5"}
            />
            {!isSmall && (
              <div className="flex items-center gap-1">
                {restaurant.distance && (
                  <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                    <Navigation className="h-3 w-3" />
                    {formatDistance(restaurant.distance)}
                  </span>
                )}
                {restaurant.priceRange && (
                  <span className="text-xs font-medium">{restaurant.priceRange}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default RestaurantCard;
