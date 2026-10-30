import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, createRateLimitResponse } from "../_shared/rateLimit.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GoogleReview {
  author_name: string;
  author_url?: string;
  profile_photo_url?: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
}

interface GooglePhoto {
  photo_reference: string;
  width: number;
  height: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Rate limiting - 20 requests per minute per IP
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               req.headers.get('x-real-ip') || 
               'unknown';
    
    const rateLimitResult = await checkRateLimit(
      supabaseAdmin,
      `google:${ip}`,
      'google-reviews',
      { windowMinutes: 1, maxRequests: 20 }
    );

    if (!rateLimitResult.allowed) {
      console.log(`Rate limit exceeded for Google reviews from IP: ${ip}`);
      return createRateLimitResponse(rateLimitResult.resetAt, corsHeaders);
    }

    const { placeId, searchQuery, lat, lng } = await req.json();
    const apiKey = Deno.env.get('GOOGLE_REVIEWS_API_KEY');

    if (!apiKey) {
      console.error('GOOGLE_REVIEWS_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let googlePlaceId = placeId;

    // If no placeId provided, search for the place first using legacy Find Place API
    if (!googlePlaceId && searchQuery) {
      console.log('Searching for place:', searchQuery);
      
      let searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(searchQuery)}&inputtype=textquery&fields=place_id,name,formatted_address&key=${apiKey}`;
      
      // Add location bias if coordinates provided
      if (lat && lng) {
        searchUrl += `&locationbias=circle:5000@${lat},${lng}`;
      }

      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();
      console.log('Place search response:', JSON.stringify(searchData));

      if (searchData.status === 'OK' && searchData.candidates && searchData.candidates.length > 0) {
        googlePlaceId = searchData.candidates[0].place_id;
        console.log('Found place_id:', googlePlaceId);
      } else {
        console.log('No places found for query:', searchQuery, 'Status:', searchData.status);
        return new Response(
          JSON.stringify({ 
            error: 'Place not found',
            reviews: [],
            photos: [],
            googleMapsUrl: null
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (!googlePlaceId) {
      return new Response(
        JSON.stringify({ error: 'No place ID or search query provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch place details with reviews AND photos using legacy Places API
    console.log('Fetching place details for:', googlePlaceId);
    
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${googlePlaceId}&fields=place_id,name,rating,user_ratings_total,reviews,url,photos&key=${apiKey}`;
    
    const detailsResponse = await fetch(detailsUrl);
    const detailsData = await detailsResponse.json();
    console.log('Place details response status:', detailsData.status);

    if (detailsData.status !== 'OK') {
      console.error('Place details error:', JSON.stringify(detailsData));
      return new Response(
        JSON.stringify({ 
          error: detailsData.error_message || `API returned status: ${detailsData.status}`,
          reviews: [],
          photos: [],
          googleMapsUrl: null
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = detailsData.result;
    const reviews: GoogleReview[] = (result.reviews || []).map((review: GoogleReview) => ({
      author_name: review.author_name || 'Anonymous',
      author_url: review.author_url,
      profile_photo_url: review.profile_photo_url,
      rating: review.rating || 0,
      relative_time_description: review.relative_time_description || '',
      text: review.text || '',
      time: review.time || 0
    }));

    // Convert photo references to actual photo URLs
    const photos: string[] = [];
    if (result.photos && Array.isArray(result.photos)) {
      for (const photo of result.photos.slice(0, 10)) { // Limit to 10 photos
        if (photo.photo_reference) {
          // Construct the photo URL - this returns a redirect to the actual image
          const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photo_reference=${photo.photo_reference}&key=${apiKey}`;
          photos.push(photoUrl);
        }
      }
      console.log(`Found ${photos.length} photos for place`);
    }

    console.log(`Found ${reviews.length} reviews for place`);
    
    return new Response(
      JSON.stringify({
        placeId: googlePlaceId,
        name: result.name,
        rating: result.rating,
        totalReviews: result.user_ratings_total,
        reviews: reviews,
        photos: photos,
        googleMapsUrl: result.url || `https://www.google.com/maps/place/?q=place_id:${googlePlaceId}`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in google-reviews function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
