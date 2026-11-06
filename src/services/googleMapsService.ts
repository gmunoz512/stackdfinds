// Geocoding / Places helpers. Paid Google Places calls are disabled —
// these stubs keep old imports compiling without hitting Google.

export interface GeoapifyPlace {
  id: string;
  name: string;
  cuisine?: string;
  address: string;
  city: string;
  zipCode: string;
  phone?: string;
  website?: string;
  openingHours?: string[];
  lat: number;
  lng: number;
  distance?: number;
  categories: string[];
  rating?: number;
  reviewCount?: number;
  priceRange?: '$' | '$$' | '$$$' | '$$$$';
  photos: string[];
}

export interface AutocompleteSuggestion {
  id: string;
  type: 'restaurant' | 'location';
  name: string;
  description: string;
  lat?: number;
  lng?: number;
  city?: string;
  zipCode?: string;
  cuisine?: string;
  address?: string;
}

// Format distance for display (pure math — stays client-side)
export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  const miles = meters / 1609.34;
  return `${miles.toFixed(1)} mi`;
};

// Reverse geocode — Google billed path disabled
export const reverseGeocode = async (_lat: number, _lng: number): Promise<{ city: string; zipCode: string } | null> => {
  return null;
};

// Geocode — Google billed path disabled
export const geocodeLocation = async (_query: string): Promise<{ lat: number; lng: number; city: string; zipCode: string } | null> => {
  return null;
};

// Autocomplete — Google billed path disabled
export const autocompleteSearch = async (
  query: string,
  _lat?: number,
  _lng?: number
): Promise<AutocompleteSuggestion[]> => {
  if (!query || query.length < 2) return [];
  return [];
};
