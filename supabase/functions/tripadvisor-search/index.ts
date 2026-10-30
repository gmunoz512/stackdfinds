import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, createRateLimitResponse } from "../_shared/rateLimit.ts";
import { corsHeadersFor } from "../_shared/http.ts";

const TRIPADVISOR_API_KEY = Deno.env.get('TRIPADVISOR_API_KEY');

const getCorsHeaders = (origin: string | null) =>
  corsHeadersFor(new Request("https://stackd.local/", { headers: origin ? { origin } : {} }));

interface SearchRequest {
  action: 'search' | 'details' | 'photos' | 'reviews';
  query?: string;
  lat?: number;
  lng?: number;
  locationId?: string;
  limit?: number;
}

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

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
    `tripadvisor:${ip}`,
    'tripadvisor-search',
    { windowMinutes: 1, maxRequests: 20 }
  );

  if (!rateLimitResult.allowed) {
    console.log(`Rate limit exceeded for TripAdvisor search from IP: ${ip}`);
    return createRateLimitResponse(rateLimitResult.resetAt, corsHeaders);
  }

  if (!TRIPADVISOR_API_KEY) {
    console.error('TRIPADVISOR_API_KEY not configured');
    return new Response(
      JSON.stringify({ error: 'TripAdvisor API key not configured' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { action, query, lat, lng, locationId, limit = 10 }: SearchRequest = await req.json();
    console.log(`TripAdvisor API - Action: ${action}, Query: ${query}, Lat: ${lat}, Lng: ${lng}, LocationId: ${locationId}`);

    const baseUrl = 'https://api.content.tripadvisor.com/api/v1';
    const headers = {
      'accept': 'application/json',
    };

    let response;
    let data;

    switch (action) {
      case 'search': {
        // Search for restaurants near location
        if (!lat || !lng) {
          return new Response(
            JSON.stringify({ error: 'lat and lng are required for search' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const searchUrl = `${baseUrl}/location/nearby_search?latLong=${lat},${lng}&category=restaurants&language=en&key=${TRIPADVISOR_API_KEY}`;
        console.log('Fetching nearby restaurants from TripAdvisor');
        
        response = await fetch(searchUrl, { headers });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`TripAdvisor search error: ${response.status} - ${errorText}`);
          throw new Error(`TripAdvisor API error: ${response.status}`);
        }
        
        data = await response.json();
        console.log(`Found ${data.data?.length || 0} restaurants`);
        
        // Fetch details for each restaurant to get ratings, photos, etc.
        const restaurants = data.data?.slice(0, limit) || [];
        const enrichedRestaurants = await Promise.all(
          restaurants.map(async (restaurant: any) => {
            try {
              // Get location details
              const detailsUrl = `${baseUrl}/location/${restaurant.location_id}/details?language=en&currency=USD&key=${TRIPADVISOR_API_KEY}`;
              const detailsRes = await fetch(detailsUrl, { headers });
              
              if (detailsRes.ok) {
                const details = await detailsRes.json();
                return {
                  ...restaurant,
                  details: details,
                };
              }
              return restaurant;
            } catch (err) {
              console.error(`Error fetching details for ${restaurant.location_id}:`, err);
              return restaurant;
            }
          })
        );
        
        return new Response(
          JSON.stringify({ restaurants: enrichedRestaurants }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'details': {
        if (!locationId) {
          return new Response(
            JSON.stringify({ error: 'locationId is required for details' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const detailsUrl = `${baseUrl}/location/${locationId}/details?language=en&currency=USD&key=${TRIPADVISOR_API_KEY}`;
        console.log(`Fetching details for location ${locationId}`);
        
        response = await fetch(detailsUrl, { headers });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`TripAdvisor details error: ${response.status} - ${errorText}`);
          throw new Error(`TripAdvisor API error: ${response.status}`);
        }
        
        data = await response.json();
        return new Response(
          JSON.stringify({ details: data }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'photos': {
        if (!locationId) {
          return new Response(
            JSON.stringify({ error: 'locationId is required for photos' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const photosUrl = `${baseUrl}/location/${locationId}/photos?language=en&key=${TRIPADVISOR_API_KEY}`;
        console.log(`Fetching photos for location ${locationId}`);
        
        response = await fetch(photosUrl, { headers });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`TripAdvisor photos error: ${response.status} - ${errorText}`);
          throw new Error(`TripAdvisor API error: ${response.status}`);
        }
        
        data = await response.json();
        return new Response(
          JSON.stringify({ photos: data.data || [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'reviews': {
        if (!locationId) {
          return new Response(
            JSON.stringify({ error: 'locationId is required for reviews' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const reviewsUrl = `${baseUrl}/location/${locationId}/reviews?language=en&key=${TRIPADVISOR_API_KEY}`;
        console.log(`Fetching reviews for location ${locationId}`);
        
        response = await fetch(reviewsUrl, { headers });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`TripAdvisor reviews error: ${response.status} - ${errorText}`);
          throw new Error(`TripAdvisor API error: ${response.status}`);
        }
        
        data = await response.json();
        return new Response(
          JSON.stringify({ reviews: data.data || [] }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Use: search, details, photos, or reviews' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Error in tripadvisor-search function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
