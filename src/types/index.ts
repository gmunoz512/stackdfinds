// Centralized type definitions for the application

// Re-export from existing sources for consistency
export type { Experience } from '@/data/mockData';
export type { Restaurant } from '@/data/mockRestaurants';

// Vendor type matching Supabase schema
export interface Vendor {
  id: string;
  name: string;
  email: string;
  category: string;
  commission: number;
  description: string | null;
  user_id: string;
  created_at: string;
}

// Price range type
export type PriceRange = '$' | '$$' | '$$$' | '$$$$';

// User role type
export type UserRole = 'host' | 'vendor' | 'user';

// Recommendation item stored in profile
export interface RecommendationItem {
  id: string;
  type: 'vendor' | 'restaurant' | 'experience';
  addedAt: string;
}

// User profile from Supabase profiles table
export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  zip_code: string | null;
  recommendations: RecommendationItem[];
  created_at: string;
  updated_at: string;
}

// TripAdvisor API response types
export interface TripAdvisorPhoto {
  images?: {
    large?: { url: string };
    medium?: { url: string };
    original?: { url: string };
  };
}

export interface TripAdvisorReview {
  id: string;
  text: string;
  rating: number;
  title?: string;
  travel_date?: string;
  published_date?: string;
  user?: {
    username?: string;
    user_location?: { name: string };
    avatar?: { small?: { url: string } };
  };
}

// Geoapify types
export interface GeoapifyFeature {
  properties: {
    datasource?: {
      raw?: {
        cuisine?: string;
        [key: string]: unknown;
      };
    };
    categories?: string[];
    name?: string;
    formatted?: string;
    lat?: number;
    lon?: number;
    place_id?: string;
    city?: string;
    state?: string;
    country?: string;
    [key: string]: unknown;
  };
  geometry?: {
    coordinates?: [number, number];
  };
}

// Supabase error type for catch blocks
export interface SupabaseError {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

// Helper to safely extract error message
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as { message: unknown }).message);
  }
  return 'An unexpected error occurred';
}
