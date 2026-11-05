// TripAdvisor API Service
import { supabase } from "@/integrations/supabase/client";
import { Restaurant } from "@/data/mockRestaurants";

export interface TripAdvisorRestaurant {
  location_id: string;
  name: string;
  address_obj?: {
    street1?: string;
    street2?: string;
    city?: string;
    state?: string;
    country?: string;
    postalcode?: string;
    address_string?: string;
  };
  latitude?: string;
  longitude?: string;
  distance?: string;
  details?: {
    rating?: string;
    num_reviews?: string;
    price_level?: string;
    cuisine?: Array<{ name: string }>;
    phone?: string;
    website?: string;
    web_url?: string;
    hours?: {
      week_ranges?: Array<Array<{ open_time: number; close_time: number }>>;
      weekday_text?: string[];
    };
    description?: string;
  };
}

// Convert TripAdvisor price level to our format
const convertPriceLevel = (priceLevel?: string): '$' | '$$' | '$$$' | '$$$$' | undefined => {
  if (!priceLevel) return undefined;
  const price = priceLevel.replace(/[^$]/g, '');
  if (price.length >= 1 && price.length <= 4) {
    return price as '$' | '$$' | '$$$' | '$$$$';
  }
  return '$$'; // Default
};

// Get placeholder photos based on cuisine
const getPlaceholderPhotos = (cuisine: string, index: number): string[] => {
  const photoSets: Record<string, string[]> = {
    'Italian': [
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
      'https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=800',
    ],
    'Japanese': [
      'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=800',
      'https://images.unsplash.com/photo-1553621042-f6e147245754?w=800',
    ],
    'Mexican': [
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
      'https://images.unsplash.com/photo-1599974579688-8dbdd335c77f?w=800',
    ],
    'Seafood': [
      'https://images.unsplash.com/photo-1615141982883-c7ad0e69fd62?w=800',
      'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800',
    ],
    'American': [
      'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800',
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
    ],
    'default': [
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
    ],
  };
  
  return photoSets[cuisine] || photoSets['default'];
};

// Convert TripAdvisor restaurant to our Restaurant format
const convertToRestaurant = (ta: TripAdvisorRestaurant, index: number): Restaurant => {
  const cuisines = ta.details?.cuisine?.map(c => c.name) || [];
  const primaryCuisine = cuisines[0] || 'Restaurant';
  
  // Parse distance (TripAdvisor returns distance in miles as string, convert to meters)
  const distanceMiles = ta.distance ? parseFloat(ta.distance) : undefined;
  const distanceInMeters = distanceMiles ? Math.round(distanceMiles * 1609.34) : undefined;

  // Convert weekday_text to hours format
  const hours: { [key: string]: { open: string; close: string } | null } = {
    monday: null,
    tuesday: null,
    wednesday: null,
    thursday: null,
    friday: null,
    saturday: null,
    sunday: null,
  };
  
  // Parse hours if available from weekday_text
  if (ta.details?.hours?.weekday_text) {
    const dayMap: Record<string, string> = {
      'Monday': 'monday',
      'Tuesday': 'tuesday', 
      'Wednesday': 'wednesday',
      'Thursday': 'thursday',
      'Friday': 'friday',
      'Saturday': 'saturday',
      'Sunday': 'sunday',
    };
    
    ta.details.hours.weekday_text.forEach(text => {
      const match = text.match(/^(\w+):\s*(.+)$/);
      if (match) {
        const day = dayMap[match[1]];
        const timeRange = match[2];
        if (day && timeRange !== 'Closed') {
          const times = timeRange.split(' - ');
          if (times.length === 2) {
            hours[day] = { open: times[0], close: times[1] };
          }
        }
      }
    });
  }
  
  return {
    id: `ta_${ta.location_id}`,
    name: ta.name,
    cuisine: primaryCuisine,
    rating: ta.details?.rating ? parseFloat(ta.details.rating) : undefined,
    reviewCount: ta.details?.num_reviews ? parseInt(ta.details.num_reviews) : undefined,
    priceRange: convertPriceLevel(ta.details?.price_level),
    distance: distanceInMeters,
    address: ta.address_obj?.address_string || ta.address_obj?.street1 || 'Address unavailable',
    phone: ta.details?.phone,
    website: ta.details?.website || ta.details?.web_url,
    photos: getPlaceholderPhotos(primaryCuisine, index),
    hours,
    description: ta.details?.description,
    city: ta.address_obj?.city || '',
    zipCode: ta.address_obj?.postalcode || '',
    coordinates: ta.latitude && ta.longitude 
      ? { lat: parseFloat(ta.latitude), lng: parseFloat(ta.longitude) }
      : undefined,
    isFromApi: true,
  };
};

// Search for nearby restaurants using TripAdvisor API
export const searchNearbyRestaurants = async (
  lat: number,
  lng: number,
  limit: number = 10
): Promise<Restaurant[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('tripadvisor-search', {
      body: {
        action: 'search',
        lat,
        lng,
        limit,
      },
    });

    if (error) {
      throw error;
    }

    if (!data?.restaurants) {
      return [];
    }

    return data.restaurants.map((r: TripAdvisorRestaurant, i: number) => convertToRestaurant(r, i));
  } catch {
    return [];
  }
};

// Get restaurant details
export const getRestaurantDetails = async (locationId: string): Promise<Restaurant | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('tripadvisor-search', {
      body: {
        action: 'details',
        locationId,
      },
    });

    if (error) {
      return null;
    }

    if (!data?.details) {
      return null;
    }

    return convertToRestaurant({ location_id: locationId, ...data.details, details: data.details }, 0);
  } catch {
    return null;
  }
};

// Get restaurant photos
export const getRestaurantPhotos = async (locationId: string): Promise<string[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('tripadvisor-search', {
      body: {
        action: 'photos',
        locationId,
      },
    });

    if (error) {
      return [];
    }

    // Extract photo URLs from TripAdvisor response
    const photos = data?.photos || [];
    return photos.map((photo: { images?: { large?: { url: string }; medium?: { url: string }; original?: { url: string } } }) => 
      photo.images?.large?.url || 
      photo.images?.medium?.url || 
      photo.images?.original?.url
    ).filter(Boolean);
  } catch {
    return [];
  }
};

// Get restaurant reviews
export const getRestaurantReviews = async (locationId: string): Promise<unknown[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('tripadvisor-search', {
      body: {
        action: 'reviews',
        locationId,
      },
    });

    if (error) {
      return [];
    }

    return data?.reviews || [];
  } catch {
    return [];
  }
};
