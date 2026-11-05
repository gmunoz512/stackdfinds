import { useState, useCallback } from 'react';
import { 
  reverseGeocode, 
  geocodeLocation,
  type GeoapifyPlace 
} from '@/services/googleMapsService';
import { searchNearbyRestaurants } from '@/services/tripadvisorService';
import { Restaurant } from '@/data/mockRestaurants';
import { toast } from '@/hooks/use-toast';

// Convert Restaurant to GeoapifyPlace format for compatibility
const convertToGeoapifyPlace = (restaurant: Restaurant): GeoapifyPlace => ({
  id: restaurant.id,
  name: restaurant.name,
  cuisine: restaurant.cuisine,
  address: restaurant.address,
  city: restaurant.city,
  zipCode: restaurant.zipCode,
  phone: restaurant.phone,
  website: restaurant.website,
  openingHours: restaurant.hours ? Object.entries(restaurant.hours)
    .filter(([_, value]) => value !== null)
    .map(([day, value]) => value ? `${day}: ${value.open} - ${value.close}` : '')
    .filter(Boolean) : undefined,
  lat: restaurant.coordinates?.lat || 0,
  lng: restaurant.coordinates?.lng || 0,
  distance: restaurant.distance,
  categories: [restaurant.cuisine],
  rating: restaurant.rating,
  reviewCount: restaurant.reviewCount,
  priceRange: restaurant.priceRange,
  photos: restaurant.photos,
});

interface UseNearbyPlacesResult {
  places: GeoapifyPlace[];
  isLoading: boolean;
  error: string | null;
  userLocation: { lat: number; lng: number; city: string; zipCode: string } | null;
  detectLocation: () => void;
  searchByLocation: (query: string) => Promise<void>;
  searchByName: (query: string, lat: number, lng: number) => Promise<void>;
  setPlacesFromSelection: (places: GeoapifyPlace[]) => void;
  isLocationLoading: boolean;
}

export const useNearbyPlaces = (): UseNearbyPlacesResult => {
  const [places, setPlaces] = useState<GeoapifyPlace[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ 
    lat: number; 
    lng: number; 
    city: string; 
    zipCode: string;
  } | null>(null);
  const [isLocationLoading, setIsLocationLoading] = useState(false);

  // Fetch places using TripAdvisor API
  const fetchPlaces = useCallback(async (lat: number, lng: number) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const restaurants = await searchNearbyRestaurants(lat, lng, 15);
      
      // Convert to GeoapifyPlace format for compatibility
      const nearbyPlaces = restaurants.map(convertToGeoapifyPlace);
      setPlaces(nearbyPlaces);
      
      if (nearbyPlaces.length === 0) {
        toast({ 
          title: "No restaurants found nearby", 
          description: "Try searching for a different location",
          duration: 3000 
        });
      } else {
        toast({ 
          title: `Found ${nearbyPlaces.length} restaurants from TripAdvisor`, 
          duration: 2000 
        });
      }
    } catch (err) {
      setError('Failed to fetch nearby restaurants');
      console.error('TripAdvisor fetch error:', err);
      toast({ 
        title: "Error loading restaurants", 
        description: "Please try again",
        variant: "destructive",
        duration: 3000 
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Detect user's current location
  const detectLocation = useCallback(() => {
    setIsLocationLoading(true);
    setError(null);

    if (!navigator.geolocation) {
      toast({ 
        title: "Geolocation not supported", 
        variant: "destructive", 
        duration: 3000 
      });
      setIsLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Reverse geocode to get city name (still using Geoapify for geocoding)
        const locationInfo = await reverseGeocode(latitude, longitude);
        
        const newLocation = {
          lat: latitude,
          lng: longitude,
          city: locationInfo?.city || 'Your Location',
          zipCode: locationInfo?.zipCode || '',
        };
        
        setUserLocation(newLocation);
        toast({ 
          title: `Location detected: ${newLocation.city}`, 
          duration: 2000 
        });
        
        // Fetch nearby places using TripAdvisor
        await fetchPlaces(latitude, longitude);
        setIsLocationLoading(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        let message = "Could not detect location";
        if (error.code === error.PERMISSION_DENIED) {
          message = "Location permission denied";
        } else if (error.code === error.TIMEOUT) {
          message = "Location detection timed out";
        }
        toast({ 
          title: message, 
          description: "Please enter your city or ZIP code manually",
          duration: 3000 
        });
        setError(message);
        setIsLocationLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  }, [fetchPlaces]);

  // Search by city name or ZIP code
  const searchByLocation = useCallback(async (query: string) => {
    if (!query.trim()) return;
    
    setIsLocationLoading(true);
    setError(null);

    try {
      // Use Geoapify for geocoding the location
      const locationData = await geocodeLocation(query);
      
      if (locationData) {
        setUserLocation(locationData);
        toast({ 
          title: `Searching restaurants in ${locationData.city}...`, 
          duration: 2000 
        });
        // Use TripAdvisor for restaurant search
        await fetchPlaces(locationData.lat, locationData.lng);
      } else {
        toast({ 
          title: "Location not found", 
          description: "Try entering a different city or ZIP code",
          variant: "destructive",
          duration: 3000 
        });
      }
    } catch (err) {
      setError('Failed to search location');
      console.error(err);
    } finally {
      setIsLocationLoading(false);
    }
  }, [fetchPlaces]);

  // Search restaurants by name within a location (uses TripAdvisor nearby search)
  const searchByName = useCallback(async (query: string, lat: number, lng: number) => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // TripAdvisor nearby search - filter results by name on client side
      const restaurants = await searchNearbyRestaurants(lat, lng, 20);
      const filteredResults = restaurants.filter(r => 
        r.name.toLowerCase().includes(query.toLowerCase()) ||
        r.cuisine.toLowerCase().includes(query.toLowerCase())
      );
      
      const places = filteredResults.map(convertToGeoapifyPlace);
      setPlaces(places);
      
      if (places.length === 0) {
        toast({ 
          title: `No results for "${query}"`, 
          description: "Try a different search term",
          duration: 3000 
        });
      } else {
        toast({ 
          title: `Found ${places.length} results for "${query}"`, 
          duration: 2000 
        });
      }
    } catch (err) {
      setError('Failed to search restaurants');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Set places from external selection (e.g., autocomplete)
  const setPlacesFromSelection = useCallback((newPlaces: GeoapifyPlace[]) => {
    setPlaces(newPlaces);
  }, []);

  return {
    places,
    isLoading,
    error,
    userLocation,
    detectLocation,
    searchByLocation,
    searchByName,
    setPlacesFromSelection,
    isLocationLoading,
  };
};
