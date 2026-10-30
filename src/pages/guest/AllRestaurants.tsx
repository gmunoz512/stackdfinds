import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Store } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import RestaurantFilters, { type FilterState } from "@/components/RestaurantFilters";
import RestaurantCard from "@/components/RestaurantCard";
import LocationSearch from "@/components/LocationSearch";
import { SkeletonCardGrid } from "@/components/ui/skeleton-card";
import stackdLogo from "@/assets/stackd-logo-new.png";
import { 
  mockRestaurants, 
  isRestaurantOpen, 
  filterRestaurantsByLocation,
  type Restaurant 
} from "@/data/mockRestaurants";
import { useNearbyPlaces } from "@/hooks/useNearbyPlaces";
import { type GeoapifyPlace, type AutocompleteSuggestion } from "@/services/googleMapsService";
import { supabase } from "@/integrations/supabase/client";
import { GoogleRating } from "@/components/GoogleRating";
import { resolveGoogleRating } from "@/lib/googleRating";

interface VendorRestaurant {
  id: string;
  name: string;
  category: string;
  photos: string[] | null;
  price_per_person: number | null;
  google_rating: number | null;
}

const convertApiPlaceToRestaurant = (place: GeoapifyPlace): Restaurant => ({
  id: place.id,
  name: place.name,
  cuisine: place.cuisine || 'Restaurant',
  rating: place.rating && place.rating > 0 ? place.rating : undefined,
  reviewCount: place.reviewCount && place.reviewCount > 0 ? place.reviewCount : undefined,
  priceRange: place.priceRange || '$$',
  address: place.address,
  neighborhood: place.city,
  city: place.city,
  zipCode: place.zipCode,
  phone: place.phone || '',
  website: place.website,
  hours: {},
  description: `${place.name} located at ${place.address}`,
  photos: place.photos.length > 0 ? place.photos : [],
  features: [],
  hasOutdoorSeating: false,
  coordinates: { lat: place.lat, lng: place.lng },
  distance: place.distance,
  isFromApi: true,
});

const AllRestaurants = () => {
  const navigate = useNavigate();
  const [vendorRestaurants, setVendorRestaurants] = useState<VendorRestaurant[]>([]);
  const [searchCity, setSearchCity] = useState("");
  const [searchZip, setSearchZip] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    openNow: false,
    nearMe: false,
    topRated: false,
    priceRange: [],
    outdoorSeating: false,
  });

  const { 
    places: apiPlaces, 
    isLoading: isLoadingPlaces, 
    userLocation: apiUserLocation,
    detectLocation: detectApiLocation,
    searchByLocation,
    setPlacesFromSelection,
    isLocationLoading 
  } = useNearbyPlaces();

  useEffect(() => {
    const fetchVendors = async () => {
      const { data, error } = await supabase
        .from('vendor_profiles')
        .select('id, name, category, photos, price_per_person, google_rating')
        .eq('is_published', true)
        .eq('listing_type', 'restaurant');
      if (!error && data) {
        setVendorRestaurants(data as VendorRestaurant[]);
      }
    };
    fetchVendors();
  }, []);

  const handleSearch = () => {
    const query = searchCity || searchZip;
    if (query) {
      searchByLocation(query);
    }
  };

  const handleRestaurantSelect = (suggestion: AutocompleteSuggestion) => {
    // Convert AutocompleteSuggestion to GeoapifyPlace format
    const place: GeoapifyPlace = {
      id: suggestion.id,
      name: suggestion.name,
      cuisine: suggestion.cuisine,
      address: suggestion.description || '',
      city: suggestion.city || '',
      zipCode: suggestion.zipCode || '',
      lat: suggestion.lat || 0,
      lng: suggestion.lng || 0,
      categories: [],
      photos: [],
    };
    setPlacesFromSelection([place]);
  };

  const handleLocationSelect = (lat: number, lng: number, city: string, zipCode: string) => {
    setSearchCity(city);
    setSearchZip(zipCode);
    const query = city || zipCode;
    if (query) {
      searchByLocation(query);
    }
  };

  const handleNearMeClick = () => {
    if (!filters.nearMe) {
      detectApiLocation();
    }
    setFilters({ ...filters, nearMe: !filters.nearMe });
  };

  const filteredRestaurants = useMemo(() => {
    let restaurants: Restaurant[] = [];
    
    if (apiPlaces.length > 0) {
      restaurants = apiPlaces.map(convertApiPlaceToRestaurant);
    } else if (searchCity || searchZip) {
      restaurants = filterRestaurantsByLocation(mockRestaurants, searchCity, searchZip);
    } else if (vendorRestaurants.length === 0) {
      restaurants = mockRestaurants;
    } else {
      restaurants = [];
    }

    if (filters.openNow) {
      restaurants = restaurants.filter(r => isRestaurantOpen(r));
    }
    if (filters.topRated) {
      restaurants = restaurants.filter(r => r.isFromApi && typeof r.rating === "number" && r.rating >= 4.5);
    }
    if (filters.priceRange.length > 0) {
      restaurants = restaurants.filter(r => r.priceRange && filters.priceRange.includes(r.priceRange));
    }
    if (filters.outdoorSeating) {
      restaurants = restaurants.filter(r => r.hasOutdoorSeating);
    }
    if (filters.nearMe && apiUserLocation) {
      restaurants = [...restaurants].sort((a, b) => (a.distance || 999) - (b.distance || 999));
    }

    return restaurants;
  }, [apiPlaces, searchCity, searchZip, filters, apiUserLocation, vendorRestaurants.length]);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/appview');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <button aria-label="Go back" onClick={handleBack} className="p-2 -ml-2 hover:bg-accent rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Link to="/appview" className="flex items-center gap-2">
            <img src={stackdLogo} alt="stackd" className="h-8 w-8" />
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="px-4 py-4 space-y-4 max-w-6xl mx-auto w-full">
        <h1 className="text-2xl font-bold">Restaurants Near You</h1>
        
        <LocationSearch
          city={searchCity}
          zipCode={searchZip}
          onCityChange={setSearchCity}
          onZipChange={setSearchZip}
          onSearch={handleSearch}
          onLocationDetect={detectApiLocation}
          onRestaurantSelect={handleRestaurantSelect}
          onLocationSelect={handleLocationSelect}
          isLoadingLocation={isLocationLoading}
          userLocation={apiUserLocation}
        />

        {vendorRestaurants.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold">On stackd</h2>
            <div className="grid grid-cols-2 gap-3">
              {vendorRestaurants.map((vendor) => (
                <Link key={vendor.id} to={`/vendor/${vendor.id}`} className="block group">
                  <div className="aspect-square rounded-xl overflow-hidden relative">
                    {vendor.photos?.[0] ? (
                      <img src={vendor.photos[0]} alt={vendor.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-brand to-iris-strong flex items-center justify-center">
                        <Store className="h-8 w-8 text-paper/80" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-ink/70 to-transparent p-2">
                      <p className="text-paper text-xs font-medium line-clamp-1">{vendor.name}</p>
                      <div className="flex items-center gap-1 text-paper/80 text-[10px]">
                        <GoogleRating
                          value={resolveGoogleRating({ googleRating: vendor.google_rating })}
                          showCount={false}
                          className="text-[10px] text-inherit"
                          starClassName="h-2.5 w-2.5"
                        />
                        <span>•</span>
                        <span>{vendor.category}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <RestaurantFilters 
          filters={filters} 
          onFilterChange={setFilters} 
          onNearMeClick={handleNearMeClick}
          isLoadingLocation={isLocationLoading}
        />

        {isLoadingPlaces ? (
          <>
            <p className="text-sm text-muted-foreground">Finding restaurants...</p>
            <SkeletonCardGrid count={8} variant="restaurant" columns={4} />
          </>
        ) : filteredRestaurants.length === 0 ? (
          vendorRestaurants.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No restaurants found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your filters or search location
              </p>
            </div>
          ) : null
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {filteredRestaurants.length} restaurant{filteredRestaurants.length !== 1 ? 's' : ''} found
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredRestaurants.map((restaurant) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} variant="grid" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AllRestaurants;
