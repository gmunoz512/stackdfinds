// Google Maps / Places API Service — proxied through edge function
import { supabase } from "@/integrations/supabase/client";

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

// Helper to call the google-places edge function
const callGooglePlaces = async (action: string, params: Record<string, unknown>) => {
  const { data, error } = await supabase.functions.invoke('google-places', {
    body: { action, params },
  });

  if (error) {
    console.error(`google-places/${action} error:`, error);
    return null;
  }

  return data;
};

// Reverse geocode coordinates to get city/location name
export const reverseGeocode = async (lat: number, lng: number): Promise<{ city: string; zipCode: string } | null> => {
  return callGooglePlaces('reverseGeocode', { lat, lng });
};

// Geocode a city/address to get coordinates
export const geocodeLocation = async (query: string): Promise<{ lat: number; lng: number; city: string; zipCode: string } | null> => {
  return callGooglePlaces('geocode', { query });
};

// Autocomplete search for restaurants and locations
export const autocompleteSearch = async (
  query: string,
  lat?: number,
  lng?: number
): Promise<AutocompleteSuggestion[]> => {
  if (!query || query.length < 2) return [];

  const result = await callGooglePlaces('autocomplete', { query, lat, lng });
  return result || [];
};
