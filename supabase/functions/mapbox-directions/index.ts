import { guardPaidApi } from "../_shared/paidApiGuard.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tulum Centro coordinates
const TULUM_CENTRO = {
  lat: 20.2114,
  lng: -87.4654,
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const blocked = await guardPaidApi(req, "mapbox-directions", corsHeaders, false);
  if (blocked) return blocked;

  try {
    const { destinationLat, destinationLng } = await req.json();
    const mapboxToken = Deno.env.get('MAPBOX_PUBLIC_TOKEN');

    if (!mapboxToken) {
      console.error('MAPBOX_PUBLIC_TOKEN not configured');
      return new Response(
        JSON.stringify({ error: 'Mapbox token not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!destinationLat || !destinationLng) {
      return new Response(
        JSON.stringify({ error: 'Destination coordinates required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Mapbox Directions API - driving profile
    const directionsUrl = `https://api.mapbox.com/directions/v5/mapbox/driving/${TULUM_CENTRO.lng},${TULUM_CENTRO.lat};${destinationLng},${destinationLat}?geometries=geojson&overview=full&steps=true&access_token=${mapboxToken}`;

    console.log('Fetching directions from Mapbox...');
    const response = await fetch(directionsUrl);
    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes?.length) {
      console.error('Mapbox API error:', data);
      return new Response(
        JSON.stringify({ error: 'Could not calculate route' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const route = data.routes[0];
    const durationMinutes = Math.round(route.duration / 60);
    const distanceKm = (route.distance / 1000).toFixed(1);

    const result = {
      route: route.geometry, // GeoJSON LineString
      duration: route.duration, // seconds
      durationText: durationMinutes < 60 
        ? `${durationMinutes} min` 
        : `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`,
      distance: route.distance, // meters
      distanceText: parseFloat(distanceKm) >= 1 ? `${distanceKm} km` : `${Math.round(route.distance)} m`,
      steps: route.legs[0]?.steps?.map((step: any) => ({
        instruction: step.maneuver?.instruction,
        distance: step.distance,
        duration: step.duration,
      })) || [],
      origin: { lat: TULUM_CENTRO.lat, lng: TULUM_CENTRO.lng },
      destination: { lat: destinationLat, lng: destinationLng },
      // SECURITY: Do NOT return mapboxToken to the client
    };

    console.log('Route calculated:', { duration: result.durationText, distance: result.distanceText });

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in mapbox-directions function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
