import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, Star, MapPin, Phone, Clock, ExternalLink,
  Navigation, Heart, Share, Globe, MessageSquare, Loader2, Map as MapIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { mockRestaurants, isRestaurantOpen, type Restaurant } from "@/data/mockRestaurants";
import { formatDistance } from "@/services/googleMapsService";
import StackedPhotoGrid from "@/components/ui/stacked-photo-grid";
import { supabase } from "@/integrations/supabase/client";
import { GuestGuideButton } from "@/components/GuestGuideButton";
import { useSearch } from "@/contexts/SearchContext";
import { buildReservationLink, googleMapsSearchUrl } from "@/lib/reservations";
import { GoogleRating } from "@/components/GoogleRating";
import { resolveGoogleRating } from "@/lib/googleRating";
import { RefundPolicy } from "@/components/listing/RefundPolicy";
import { useRequireSignIn } from "@/hooks/useRequireSignIn";
import { openExternalUrl } from "@/lib/openExternalUrl";

interface GoogleReview {
  author_name: string;
  author_url?: string;
  profile_photo_url?: string;
  rating: number;
  relative_time_description: string;
  text: string;
}

interface GoogleReviewsData {
  placeId?: string;
  rating?: number;
  totalReviews?: number;
  reviews: GoogleReview[];
  photos?: string[];
  googleMapsUrl?: string;
  error?: string;
}

interface CachedGoogleReviews extends GoogleReviewsData {
  timestamp: number;
}

const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

const getDetailCacheKey = (restaurantId: string) => `google_reviews_detail_${restaurantId}`;

const getCachedReviews = (restaurantId: string): GoogleReviewsData | null => {
  try {
    const cached = localStorage.getItem(getDetailCacheKey(restaurantId));
    if (!cached) return null;
    const parsed: CachedGoogleReviews = JSON.parse(cached);
    if (Date.now() - parsed.timestamp > CACHE_DURATION_MS) {
      localStorage.removeItem(getDetailCacheKey(restaurantId));
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { timestamp, ...reviewData } = parsed;
    return reviewData;
  } catch {
    return null;
  }
};

const setCachedReviews = (restaurantId: string, data: GoogleReviewsData) => {
  try {
    const cacheData: CachedGoogleReviews = { ...data, timestamp: Date.now() };
    localStorage.setItem(getDetailCacheKey(restaurantId), JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error caching Google reviews:', error);
  }
};


const getDayName = (index: number): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[index];
};

const getCurrentDayIndex = (): number => new Date().getDay();

const RestaurantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedDate } = useSearch();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [googleReviews, setGoogleReviews] = useState<GoogleReviewsData | null>(null);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [displayPhotos, setDisplayPhotos] = useState<string[]>([]);
  const { requireSignIn } = useRequireSignIn();
  const placeRating = resolveGoogleRating({
    google: googleReviews ? { rating: googleReviews.rating, totalReviews: googleReviews.totalReviews } : null,
    place: restaurant
      ? { rating: restaurant.rating, reviewCount: restaurant.reviewCount, isFromApi: restaurant.isFromApi }
      : null,
  });
  useEffect(() => {
    if (!restaurant) return;
    const data = { "@context": "https://schema.org", "@type": "Restaurant", name: restaurant.name, description: restaurant.description, image: displayPhotos, servesCuisine: restaurant.cuisine, address: { "@type": "PostalAddress", streetAddress: restaurant.address, addressLocality: restaurant.city }, aggregateRating: placeRating ? { "@type": "AggregateRating", ratingValue: placeRating.rating, reviewCount: placeRating.reviewCount, bestRating: 5 } : undefined };
    const script = document.createElement("script"); script.type = "application/ld+json"; script.textContent = JSON.stringify(data); document.head.appendChild(script);
    return () => script.remove();
  }, [restaurant, displayPhotos, placeRating?.rating, placeRating?.reviewCount]);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/appview');
    }
  };

  useEffect(() => {
    let found = mockRestaurants.find(r => r.id === id);
    if (!found && id?.startsWith('geo_')) {
      const cachedRestaurant = localStorage.getItem(`restaurant_${id}`);
      if (cachedRestaurant) {
        found = JSON.parse(cachedRestaurant);
      }
    }
    setRestaurant(found || null);
    if (found && id) {
      const cached = getCachedReviews(id);
      if (cached) {
        setGoogleReviews(cached);
        setDisplayPhotos(cached.photos && cached.photos.length > 0 ? cached.photos : []);
      } else {
        setDisplayPhotos([]);
      }
    } else if (found) {
      setDisplayPhotos([]);
    }
    const favorites = JSON.parse(localStorage.getItem("restaurantFavorites") || "[]");
    setIsFavorite(favorites.includes(id));
  }, [id]);

  useEffect(() => {
    const fetchGoogleReviews = async () => {
      if (!restaurant || !id) return;
      const hasCachedData = googleReviews !== null;
      if (!hasCachedData) {
        setIsLoadingReviews(true);
      }
      try {
        const searchQuery = `${restaurant.name} ${restaurant.city}`;
        const { data, error } = await supabase.functions.invoke('google-reviews', {
          body: { searchQuery, lat: restaurant.coordinates?.lat, lng: restaurant.coordinates?.lng }
        });
        if (error) { console.error('Error fetching Google reviews:', error); return; }
        setGoogleReviews(data);
        setCachedReviews(id, data);
        setDisplayPhotos(data.photos && data.photos.length > 0 ? data.photos : []);
      } catch (error) {
        console.error('Error fetching Google reviews:', error);
      } finally {
        setIsLoadingReviews(false);
      }
    };
    fetchGoogleReviews();
  }, [restaurant, id]);

  const toggleFavorite = () => {
    if (!requireSignIn("save")) return;
    const favorites = JSON.parse(localStorage.getItem("restaurantFavorites") || "[]");
    let newFavorites;
    if (isFavorite) {
      newFavorites = favorites.filter((fav: string) => fav !== id);
      toast({ title: "Removed from favorites", duration: 2000 });
    } else {
      newFavorites = [...favorites, id];
      toast({ title: "Added to favorites", duration: 2000 });
    }
    localStorage.setItem("restaurantFavorites", JSON.stringify(newFavorites));
    setIsFavorite(!isFavorite);
  };

  const handleShare = async () => {
    if (navigator.share && restaurant) {
      try {
        await navigator.share({
          title: restaurant.name,
          text: `Check out ${restaurant.name} - ${restaurant.cuisine}`,
          url: window.location.href,
        });
      } catch {
        toast({ title: "Link copied to clipboard", duration: 2000 });
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied to clipboard", duration: 2000 });
    }
  };

  const handleGetDirections = () => {
    if (restaurant) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
        `${restaurant.address}, ${restaurant.city}`
      )}`;
      void openExternalUrl(url);
    }
  };

  const reservationLink = restaurant
    ? buildReservationLink(restaurant, { date: selectedDate })
    : null;

  const handleReservation = () => {
    if (!restaurant) return;
    if (!requireSignIn("book")) return;
    if (reservationLink) {
      void openExternalUrl(reservationLink.url);
    } else {
      handleViewOnMaps();
    }
  };

  const handleCall = () => {
    if (restaurant?.phone) {
      window.location.href = `tel:${restaurant.phone.replace(/[^\d+]/g, '')}`;
    }
  };

  const handleViewOnMaps = () => {
    if (!restaurant) return;
    void openExternalUrl(googleReviews?.googleMapsUrl || googleMapsSearchUrl(restaurant));
  };

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Restaurant not found</p>
      </div>
    );
  }

  const isOpen = isRestaurantOpen(restaurant);
  const photos = displayPhotos.slice(0, 6);
  const platformLabel = reservationLink
    ? { resy: 'Resy', opentable: 'OpenTable', yelp: 'Yelp' }[reservationLink.platform]
    : null;

  return (
    <div className="min-h-screen bg-background pb-[100px]">
      <div className="max-w-[375px] md:max-w-3xl lg:max-w-5xl mx-auto">

        {/* Floating header bar */}
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
          <div className="px-4 py-3 flex items-center justify-between">
            <button aria-label="Go back"
              onClick={handleBack}
              className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-1">
              <button aria-label="Share this restaurant" onClick={handleShare} className="p-2 rounded-full hover:bg-muted transition-colors">
                <Share className="h-5 w-5" />
              </button>
              <button aria-label="Toggle favorite"
                onClick={toggleFavorite}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <Heart className={`h-5 w-5 ${isFavorite ? 'fill-danger text-danger' : ''}`} />
              </button>
            </div>
          </div>
        </header>

        <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start">
        {photos.length > 0 ? (
          <div className="px-4 lg:px-6 lg:pt-2">
            <StackedPhotoGrid photos={photos} alt={restaurant.name} />
          </div>
        ) : isLoadingReviews ? (
          <div className="px-4 lg:px-6 lg:pt-2">
            <div className="aspect-[4/3] rounded-xl bg-muted animate-pulse flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          </div>
        ) : (
          <div className="hidden lg:block" />
        )}

        {/* Content sections */}
        <div className="px-4 lg:px-6">

          {/* Section: Title + Rating */}
          <div className="py-6 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-2xl font-semibold leading-tight">{restaurant.name}</h1>
              <Badge variant={isOpen ? "default" : "secondary"} className="shrink-0 mt-1">
                {isOpen ? "Open" : "Closed"}
              </Badge>
            </div>
            
            <div className="flex items-center gap-1.5 flex-wrap">
              <GoogleRating value={placeRating} className="text-[15px]" starClassName="h-4 w-4" />
              <span className="text-muted-foreground text-[15px]">·</span>
              <span className="text-[15px] text-muted-foreground">{restaurant.cuisine}</span>
              <span className="text-muted-foreground text-[15px]">·</span>
              <span className="text-[15px] text-muted-foreground">{restaurant.priceRange}</span>
            </div>
          </div>

          <Separator />

          {/* Features */}
          {restaurant.features && restaurant.features.length > 0 && (
            <>
              <div className="py-6 flex flex-wrap gap-2">
                {restaurant.features.map((feature, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
              <Separator />
            </>
          )}

          {/* Description */}
          <div className="py-6">
            <p className="text-[15px] leading-relaxed text-foreground">{restaurant.description}</p>
          </div>

          <Separator />

          {/* Location */}
          <div className="py-6 space-y-3">
            <h2 className="text-[22px] font-semibold">Location</h2>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <div>
                <p className="text-[15px]">{restaurant.address}</p>
                <p className="text-muted-foreground text-[13px]">
                  {restaurant.neighborhood || restaurant.city}{restaurant.neighborhood && restaurant.city ? `, ${restaurant.city}` : ''}
                </p>
                {restaurant.distance && (
                  <p className="text-[13px] text-primary flex items-center gap-1 mt-1">
                    <Navigation className="h-4 w-4" />
                    {formatDistance(restaurant.distance)} away
                  </p>
                )}
              </div>
            </div>
            <Button 
              variant="outline" 
              className="w-full rounded-full"
              onClick={handleGetDirections}
            >
              <Navigation className="h-4 w-4 mr-2" />
              Get Directions
            </Button>
          </div>

          <Separator />

          {/* Contact */}
          <div className="py-6 space-y-3">
            <h2 className="text-[22px] font-semibold">Contact</h2>
            {restaurant.phone && (
              <button 
                onClick={handleCall}
                className="flex items-center gap-3 w-full text-left hover:bg-muted/50 -mx-2 px-2 py-2 rounded-lg transition-colors"
              >
                <Phone className="h-5 w-5 text-muted-foreground" />
                <span className="text-primary text-[15px]">{restaurant.phone}</span>
              </button>
            )}
            {restaurant.website && (
              <a 
                href={restaurant.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 w-full text-left hover:bg-muted/50 -mx-2 px-2 py-2 rounded-lg transition-colors"
              >
                <Globe className="h-5 w-5 text-muted-foreground" />
                <span className="text-primary text-[15px] truncate">{restaurant.website.replace(/^https?:\/\//, '')}</span>
              </a>
            )}
            {!restaurant.phone && !restaurant.website && (
              <p className="text-[15px] text-muted-foreground">Contact information not available</p>
            )}
          </div>

          <Separator />

          {/* Hours */}
          <div className="py-6 space-y-3">
            <h2 className="text-[22px] font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Hours
            </h2>
            <div className="space-y-2">
              {['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map((day, index) => {
                const hours = restaurant.hours[day];
                const isToday = getCurrentDayIndex() === index;
                return (
                  <div 
                    key={day} 
                    className={`flex justify-between text-[15px] ${isToday ? 'font-medium' : ''}`}
                  >
                    <span className={isToday ? 'text-primary' : 'text-muted-foreground'}>
                      {getDayName(index)}
                      {isToday && ' (Today)'}
                    </span>
                    <span>{hours ? `${hours.open} - ${hours.close}` : 'Closed'}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <Separator />

          {/* Google Reviews Section */}
          <div className="py-6 space-y-3">
            <h2 className="text-[22px] font-semibold flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-muted-foreground" />
              Google Reviews
            </h2>
            
            {isLoadingReviews ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-[15px] text-muted-foreground">Loading reviews...</span>
              </div>
            ) : googleReviews?.reviews && googleReviews.reviews.length > 0 ? (
              <div className="space-y-4">
                {/* Rating Summary */}
                <div className="flex items-center gap-2 text-[15px]">
                  <GoogleRating
                    value={resolveGoogleRating({
                      google: {
                        rating: googleReviews.rating,
                        totalReviews: googleReviews.totalReviews,
                      },
                    })}
                    emptyLabel={null}
                    starClassName="h-4 w-4"
                  />
                  {googleReviews.totalReviews ? (
                    <span className="text-muted-foreground">on Google</span>
                  ) : null}
                </div>

                {/* Horizontal scrolling review cards */}
                <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
                  {googleReviews.reviews.slice(0, 5).map((review, index) => (
                    <div key={index} className="flex-shrink-0 w-[260px] snap-start rounded-xl border border-border p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        {review.profile_photo_url && (
                          <img 
                            src={review.profile_photo_url} 
                            alt={review.author_name}
                            className="w-8 h-8 rounded-full"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-[14px] font-medium truncate">{review.author_name}</p>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-3 w-3 ${i < review.rating ? 'fill-foreground text-foreground' : 'text-muted-foreground/30'}`} 
                              />
                            ))}
                            <span className="text-xs text-muted-foreground ml-1">
                              {review.relative_time_description}
                            </span>
                          </div>
                        </div>
                      </div>
                      <p className="text-[14px] text-foreground leading-relaxed line-clamp-4">{review.text}</p>
                    </div>
                  ))}
                </div>

                {/* View All Reviews Link */}
                {googleReviews.googleMapsUrl && (
                  <button
                    type="button"
                    onClick={() => void openExternalUrl(googleReviews.googleMapsUrl!)}
                    className="text-[15px] font-semibold underline underline-offset-4 hover:text-foreground/80 transition-colors"
                  >
                    View all reviews on Google Maps
                  </button>
                )}
              </div>
            ) : (
              <p className="text-[15px] text-muted-foreground">
                No reviews yet.
              </p>
            )}
          </div>

          {/* Host Guest Guide Button */}
          {restaurant && (
            <>
              <Separator />
              <RefundPolicy />
              <Separator />
              <div className="py-6">
                <GuestGuideButton
                  itemId={restaurant.id}
                  itemType="restaurant"
                  itemName={restaurant.name}
                />
              </div>
            </>
          )}
        </div>
        </div>

        {/* Fixed bottom CTA */}
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 shadow-[0_-2px_10px_rgba(0,0,0,0.06)] z-40">
          <div className="max-w-[375px] md:max-w-3xl lg:max-w-5xl mx-auto space-y-2">
            {!reservationLink && (
              <p role="status" className="text-center text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Reservations unavailable online</span>
                {restaurant.phone ? " — call to book or view on Google Maps" : " — view on Google Maps"}
              </p>
            )}
            <div className="flex gap-3">
              {restaurant.phone && (
                <Button variant="outline" className="flex-1 rounded-full" onClick={handleCall}>
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </Button>
              )}
              <Button
                className="flex-1 rounded-full bg-gradient-to-r from-brand to-hot hover:from-brand-strong hover:to-hot-strong text-paper font-semibold"
                onClick={reservationLink ? handleReservation : handleViewOnMaps}
              >
                {reservationLink ? (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Reserve on {platformLabel}
                  </>
                ) : (
                  <>
                    <MapIcon className="h-4 w-4 mr-2" />
                    View on Google Maps
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RestaurantDetail;
