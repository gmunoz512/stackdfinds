import { z } from 'zod';

export interface PriceTier {
  name: string;
  price: number;
}

export const vendorProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  listingType: z.enum(['restaurant', 'experience'], { required_error: 'Please select a listing type' }),
  category: z.string().min(1, 'Please select a category'),
  ageRestriction: z.enum(['family_friendly', 'adults_only'], { required_error: 'Please select an age restriction' }),
  instagramUrl: z.string().optional(),
  websiteUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  linkedinUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  businessRegistrationUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  pricePerPerson: z.coerce.number().min(0).optional(),
  duration: z.string().min(1, 'Please enter duration'),
  maxGuests: z.coerce.number().min(1, 'Must accommodate at least 1 guest'),
  description: z.string().optional(),
  aboutExperience: z.string().optional(),
  googlePlaceId: z.string().optional(),
  googleRating: z.coerce.number().optional(),
  googleReviewsUrl: z.string().optional(),
  commissionPercentage: z.coerce.number().min(0, 'Must be at least 0%').max(100, 'Cannot exceed 100%').optional(),
});

export type VendorProfileFormData = z.infer<typeof vendorProfileSchema>;

export const CATEGORIES = [
  'Private Chef',
  'Massage & Spa',
  'Yacht Charter',
  'Photography',
  'Tour Guide',
  'Fitness & Yoga',
  'Wine Tasting',
  'Fishing Charter',
  'Water Sports',
  'Cooking Class',
  'Art Class',
  'Music & Entertainment',
  'Transportation',
  'Childcare',
  'Pet Care',
  'Cleaning Service',
  'Concierge',
  'Other',
];

export interface AirbnbReview {
  reviewerName: string;
  reviewerAvatar?: string;
  date: string;
  comment: string;
}

export interface ExistingProfile {
  id: string;
  name: string;
  category: string;
  listing_type: string;
  age_restriction: 'family_friendly' | 'adults_only';
  description: string | null;
  about_experience: string | null;
  instagram_url: string | null;
  photos: string[] | null;
  menu_url: string | null;
  price_per_person: number | null;
  price_tiers: PriceTier[] | null;
  duration: string | null;
  max_guests: number | null;
  included_items: string[] | null;
  google_place_id: string | null;
  google_rating: number | null;
  google_reviews_url: string | null;
  commission_percentage: number | null;
  airbnb_experience_url: string | null;
  airbnb_reviews: AirbnbReview[] | null;
  host_bio: string | null;
  host_avatar_url: string | null;
  meeting_point_description: string | null;
  website_url: string | null;
  linkedin_url: string | null;
  business_registration_url: string | null;
  ownership_evidence_urls: string[] | null;
}
