import { guardPaidApi } from "../_shared/paidApiGuard.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tulum Centro coordinates (central reference point)
const TULUM_CENTRO = {
  lat: 20.2114,
  lng: -87.4654,
  name: "Tulum Centro"
};

interface DirectionsResult {
  distance: string;
  duration: string;
  durationValue: number; // in seconds
  origin: string;
  destination: string;
  vendorLocation?: {
    lat: number;
    lng: number;
  };
  arrivalTips: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const blocked = await guardPaidApi(req, "vendor-directions", corsHeaders, false);
  if (blocked) return blocked;

  try {
    const { vendorName, vendorAddress, placeId } = await req.json();
    const apiKey = Deno.env.get('GOOGLE_REVIEWS_API_KEY');

    if (!apiKey) {
      console.error('GOOGLE_REVIEWS_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let destination = vendorAddress || vendorName;
    let vendorLocation: { lat: number; lng: number } | undefined;

    // If we have a placeId, get the exact location
    if (placeId) {
      console.log('Fetching place details for placeId:', placeId);
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,formatted_address,name&key=${apiKey}`;
      const detailsResponse = await fetch(detailsUrl);
      const detailsData = await detailsResponse.json();
      
      if (detailsData.status === 'OK' && detailsData.result) {
        vendorLocation = {
          lat: detailsData.result.geometry?.location?.lat,
          lng: detailsData.result.geometry?.location?.lng
        };
        destination = detailsData.result.formatted_address || detailsData.result.name || destination;
        console.log('Found vendor location:', vendorLocation);
      }
    }

    // If no placeId, search for the place
    if (!vendorLocation && (vendorName || vendorAddress)) {
      const searchQuery = vendorAddress || `${vendorName} Tulum Mexico`;
      console.log('Searching for place:', searchQuery);
      
      const searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(searchQuery)}&inputtype=textquery&fields=place_id,geometry,formatted_address,name&locationbias=circle:20000@${TULUM_CENTRO.lat},${TULUM_CENTRO.lng}&key=${apiKey}`;
      
      const searchResponse = await fetch(searchUrl);
      const searchData = await searchResponse.json();
      
      if (searchData.status === 'OK' && searchData.candidates?.length > 0) {
        const candidate = searchData.candidates[0];
        vendorLocation = {
          lat: candidate.geometry?.location?.lat,
          lng: candidate.geometry?.location?.lng
        };
        destination = candidate.formatted_address || candidate.name || destination;
        console.log('Found place via search:', vendorLocation);
      }
    }

    // Get directions from Tulum Centro to the vendor
    const origin = `${TULUM_CENTRO.lat},${TULUM_CENTRO.lng}`;
    const destinationCoords = vendorLocation 
      ? `${vendorLocation.lat},${vendorLocation.lng}` 
      : encodeURIComponent(destination + ' Tulum Mexico');
    
    console.log('Getting directions from', origin, 'to', destinationCoords);
    
    const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destinationCoords}&mode=driving&key=${apiKey}`;
    
    const directionsResponse = await fetch(directionsUrl);
    const directionsData = await directionsResponse.json();
    
    if (directionsData.status !== 'OK' || !directionsData.routes?.length) {
      console.error('Directions API error:', directionsData.status);
      return new Response(
        JSON.stringify({ 
          error: 'Could not calculate directions',
          vendorLocation
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const route = directionsData.routes[0];
    const leg = route.legs[0];
    
    // Generate arrival tips based on duration
    const durationMinutes = Math.ceil(leg.duration.value / 60);
    const arrivalTips = generateArrivalTips(durationMinutes, vendorName);

    const result: DirectionsResult = {
      distance: leg.distance.text,
      duration: leg.duration.text,
      durationValue: leg.duration.value,
      origin: TULUM_CENTRO.name,
      destination: leg.end_address || destination,
      vendorLocation,
      arrivalTips
    };

    console.log('Directions result:', result);
    
    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in vendor-directions function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function generateArrivalTips(durationMinutes: number, vendorName?: string): string[] {
  const tips: string[] = [];
  
  // Base buffer time recommendation
  if (durationMinutes <= 10) {
    tips.push(`🚗 Only ${durationMinutes} min from Tulum Centro - very convenient!`);
    tips.push("⏰ Arrive 10-15 minutes early to check in and get settled.");
  } else if (durationMinutes <= 20) {
    tips.push(`🚗 About ${durationMinutes} min drive from Tulum Centro.`);
    tips.push("⏰ Plan to leave 25-30 minutes before your booking time.");
  } else if (durationMinutes <= 30) {
    tips.push(`🚗 ${durationMinutes} min drive - moderate distance from Centro.`);
    tips.push("⏰ Leave 40-45 minutes early to account for traffic and parking.");
  } else {
    tips.push(`🚗 ${durationMinutes} min drive - plan ahead for this trip!`);
    tips.push("⏰ Leave at least 1 hour early, especially during peak hours.");
  }

  // Common Tulum-specific tips
  tips.push("🛣️ Beach Road (Carretera Tulum-Boca Paila) can have heavy traffic 11am-4pm.");
  tips.push("💡 Consider renting a bike for short distances or during busy periods.");
  
  return tips;
}
