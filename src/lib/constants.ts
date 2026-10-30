// App configuration
export const APP_CONFIG = {
  name: 'Stackd',
  tagline: 'Local Experiences',
  description: 'Curated local experiences recommended by vacation rental hosts',
} as const;

// API endpoints (relative to Supabase functions)
export const API_ENDPOINTS = {
  tripPlannerChat: 'trip-planner-chat',
  googleReviews: 'google-reviews',
  priceComparison: 'price-comparison',
  vendorDirections: 'vendor-directions',
  mapboxDirections: 'mapbox-directions',
  tripadvisorSearch: 'tripadvisor-search',
  scrapeInstagram: 'scrape-instagram',
  assignRole: 'assign-role',
  createBookingCheckout: 'create-booking-checkout',
  cancelBooking: 'cancel-booking',
} as const;

// UI constants
export const UI_CONSTANTS = {
  maxMobileWidth: 768,
  defaultPageSize: 20,
  toastDuration: 4000,
  debounceMs: 300,
} as const;

// Commission rates (percentages)
export const COMMISSION_RATES = {
  default: 15,
  premium: 20,
  host: 10,
} as const;

// Cache durations (milliseconds)
export const CACHE_DURATIONS = {
  restaurants: 5 * 60 * 1000,  // 5 minutes
  experiences: 10 * 60 * 1000, // 10 minutes
  reviews: 30 * 60 * 1000,     // 30 minutes
  userProfile: 60 * 60 * 1000, // 1 hour
} as const;

// Storage keys
export const STORAGE_KEYS = {
  theme: 'theme',
  pendingRole: 'pending_role',
  tripPlannerItinerary: 'tripPlannerItinerary',
} as const;
