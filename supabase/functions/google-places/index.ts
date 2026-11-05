import { guardPaidApi } from "../_shared/paidApiGuard.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const blocked = await guardPaidApi(req, "google-places", corsHeaders, false);
  if (blocked) return blocked;

  try {
    const apiKey = Deno.env.get('GOOGLE_REVIEWS_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, params } = await req.json();

    let result;

    switch (action) {
      case 'reverseGeocode': {
        const { lat, lng } = params;
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.status !== 'OK' || !data.results?.length) {
          result = null;
          break;
        }

        const r = data.results[0];
        let city = '';
        let zipCode = '';

        for (const component of r.address_components || []) {
          if (component.types.includes('locality')) city = component.long_name;
          else if (component.types.includes('sublocality') && !city) city = component.long_name;
          else if (component.types.includes('administrative_area_level_1') && !city) city = component.short_name;
          if (component.types.includes('postal_code')) zipCode = component.long_name;
        }

        result = { city: city || 'Unknown', zipCode };
        break;
      }

      case 'geocode': {
        const { query } = params;
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.status !== 'OK' || !data.results?.length) {
          result = null;
          break;
        }

        const r = data.results[0];
        const location = r.geometry?.location;
        let city = '';
        let zipCode = '';

        for (const component of r.address_components || []) {
          if (component.types.includes('locality')) city = component.long_name;
          else if (component.types.includes('administrative_area_level_1') && !city) city = component.short_name;
          if (component.types.includes('postal_code')) zipCode = component.long_name;
        }

        result = {
          lat: location?.lat || 0,
          lng: location?.lng || 0,
          city: city || query,
          zipCode,
        };
        break;
      }

      case 'autocomplete': {
        const { query, lat, lng } = params;
        const suggestions: Array<{
          id: string;
          type: 'restaurant' | 'location';
          name: string;
          description: string;
          lat?: number;
          lng?: number;
          cuisine?: string;
          address?: string;
        }> = [];

        // Search for restaurants if we have location
        if (lat && lng) {
          const restaurantUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&type=restaurant&location=${lat},${lng}&radius=50000&key=${apiKey}`;
          try {
            const res = await fetch(restaurantUrl);
            if (res.ok) {
              const data = await res.json();
              if (data.status === 'OK') {
                const cuisineMap: Record<string, string> = {
                  'italian_restaurant': 'Italian', 'mexican_restaurant': 'Mexican',
                  'chinese_restaurant': 'Chinese', 'japanese_restaurant': 'Japanese',
                  'indian_restaurant': 'Indian', 'thai_restaurant': 'Thai',
                  'american_restaurant': 'American', 'french_restaurant': 'French',
                  'seafood_restaurant': 'Seafood', 'pizza_restaurant': 'Pizza',
                  'hamburger_restaurant': 'Burgers', 'sushi_restaurant': 'Japanese',
                  'steak_house': 'Steakhouse', 'mediterranean_restaurant': 'Mediterranean',
                  'asian_restaurant': 'Asian', 'cafe': 'Café',
                  'fast_food_restaurant': 'Fast Food', 'bar': 'Bar & Grill',
                };
                const getCuisine = (types: string[]) => {
                  for (const t of types) { if (cuisineMap[t]) return cuisineMap[t]; }
                  return 'Restaurant';
                };

                (data.results || []).slice(0, 5).forEach((place: Record<string, unknown>) => {
                  const types = (place.types || []) as string[];
                  suggestions.push({
                    id: `rest_${place.place_id}`,
                    type: 'restaurant',
                    name: (place.name as string) || 'Unknown Restaurant',
                    description: (place.formatted_address as string) || '',
                    lat: (place.geometry as Record<string, Record<string, number>>)?.location?.lat,
                    lng: (place.geometry as Record<string, Record<string, number>>)?.location?.lng,
                    cuisine: getCuisine(types),
                    address: place.formatted_address as string,
                  });
                });
              }
            }
          } catch (err) {
            console.error('Restaurant search error:', err);
          }
        }

        // Search for locations (cities)
        const locationUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=(cities)&key=${apiKey}`;
        try {
          const res = await fetch(locationUrl);
          if (res.ok) {
            const data = await res.json();
            if (data.status === 'OK') {
              (data.predictions || []).slice(0, 5).forEach((prediction: Record<string, unknown>) => {
                const sf = prediction.structured_formatting as Record<string, string> | undefined;
                suggestions.push({
                  id: `loc_${prediction.place_id}`,
                  type: 'location',
                  name: sf?.main_text || (prediction.description as string) || '',
                  description: sf?.secondary_text || '',
                });
              });
            }
          }
        } catch (err) {
          console.error('Location search error:', err);
        }

        result = suggestions;
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown action: ${action}` }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in google-places function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
