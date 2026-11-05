import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, ExternalLink, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useRequireSignIn } from "@/hooks/useRequireSignIn";
import type { DirectionsData, MapboxRouteData } from "@/components/map/mapTypes";
import { MapDirectionsCard } from "@/components/map/MapDirectionsCard";

interface VendorLocationMapProps {
  vendorName: string;
  vendorAddress?: string;
  placeId?: string;
  /** "directions" shows the full route from Tulum Centro; "pin" shows only the vendor location marker */
  mode?: 'directions' | 'pin';
}

let _cachedMapboxToken: string | null = null;
async function getMapboxToken(): Promise<string | null> {
  if (_cachedMapboxToken) return _cachedMapboxToken;
  try {
    const { data, error } = await supabase.functions.invoke('mapbox-token');
    if (error || !data?.token) return null;
    _cachedMapboxToken = data.token;
    return data.token;
  } catch {
    return null;
  }
}

const TULUM_CENTRO = { lat: 20.2114, lng: -87.4654 };

export function VendorLocationMap({ vendorName, vendorAddress, placeId, mode = 'directions' }: VendorLocationMapProps) {
  const isPinMode = mode === 'pin';
  const { toast } = useToast();
  const { requireSignIn } = useRequireSignIn();
  const [directionsData, setDirectionsData] = useState<DirectionsData | null>(null);
  const [mapRouteData, setMapRouteData] = useState<MapboxRouteData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [itineraryItemId, setItineraryItemId] = useState<string | null>(null);
  const [mapError, setMapError] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const carMarker = useRef<mapboxgl.Marker | null>(null);
  const animationRef = useRef<number | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Check auth state and if already saved
  useEffect(() => {
    const checkAuthAndSaved = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);

      if (user && vendorName) {
        const { data } = await supabase
          .from('itinerary_items')
          .select('id')
          .eq('user_id', user.id)
          .eq('vendor_name', vendorName)
          .maybeSingle();

        if (data) {
          setIsSaved(true);
          setItineraryItemId(data.id);
        }
      }
    };

    checkAuthAndSaved();
  }, [vendorName]);

  // Fetch initial directions data
  useEffect(() => {
    const fetchDirections = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const { data, error: fnError } = await supabase.functions.invoke('vendor-directions', {
          body: { vendorName, vendorAddress, placeId }
        });

        if (fnError) {
          throw new Error(fnError.message);
        }

        if (data?.error && !data?.vendorLocation) {
          setError(data.error);
        } else {
          setDirectionsData(data);
        }
      } catch (err) {
        console.error('Error fetching directions:', err);
        setError('Unable to load location data');
      } finally {
        setIsLoading(false);
      }
    };

    if (vendorName || vendorAddress || placeId) {
      fetchDirections();
    }
  }, [vendorName, vendorAddress, placeId]);

  // Fetch Mapbox route when we have vendor location (skip in pin mode)
  useEffect(() => {
    if (isPinMode) return;
    const fetchMapboxRoute = async () => {
      if (!directionsData?.vendorLocation) return;

      try {
        const { data, error: fnError } = await supabase.functions.invoke('mapbox-directions', {
          body: { 
            destinationLat: directionsData.vendorLocation.lat,
            destinationLng: directionsData.vendorLocation.lng
          }
        });

        if (fnError) {
          console.error('Mapbox directions error:', fnError);
          return;
        }

        if (data && !data.error) {
          setMapRouteData(data);
        }
      } catch (err) {
        console.error('Error fetching Mapbox route:', err);
      }
    };

    fetchMapboxRoute();
  }, [directionsData?.vendorLocation, isPinMode]);

  // In pin mode, fetch just the Mapbox token and init map centered on vendor
  useEffect(() => {
    if (!isPinMode || !directionsData?.vendorLocation) return;
    if (!mapContainer.current || map.current) return;

    const initPinMap = async () => {
      try {
        const token = await getMapboxToken();
        if (!token) {
          console.error('Could not get Mapbox token');
          setMapError(true);
          return;
        }

        if (!mapContainer.current || map.current) return;

        mapboxgl.accessToken = token;
        const { lat, lng } = directionsData.vendorLocation!;

        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/light-v11',
          center: [lng, lat],
          zoom: 15,
          attributionControl: false,
        });

        map.current.on('load', () => {
          if (!map.current) return;

          // Add vendor marker
          const destEl = document.createElement('div');
          destEl.className = 'destination-marker';
          destEl.innerHTML = `
            <div style="
              width: 36px; 
              height: 36px; 
              background: #ef4444; 
              border: 3px solid white; 
              border-radius: 50%; 
              display: flex; 
              align-items: center; 
              justify-content: center;
              box-shadow: 0 2px 12px rgba(239,68,68,0.4);
            ">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
          `;
          new mapboxgl.Marker(destEl)
            .setLngLat([lng, lat])
            .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`<strong>${vendorName}</strong>`))
            .addTo(map.current!);

          map.current!.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
          setMapLoaded(true);
        });

      } catch (err) {
        console.error('Error initializing pin map:', err);
        setMapError(true);
      }
    };

    initPinMap();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [isPinMode, directionsData?.vendorLocation, vendorName]);

  // Initialize Mapbox map when route data is available (directions mode only)
  useEffect(() => {
    if (isPinMode) return;
    if (!mapContainer.current || !mapRouteData?.route) return;
    if (map.current) return;

    const initDirectionsMap = async () => {
      const token = await getMapboxToken();
      if (!token || !mapContainer.current || map.current) return;

      try {
        mapboxgl.accessToken = token;

        // Calculate bounds to fit the route
        const coordinates = mapRouteData.route.coordinates;
        const bounds = coordinates.reduce((bounds, coord) => {
          return bounds.extend(coord as [number, number]);
        }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));

        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/light-v11',
          bounds: bounds,
          fitBoundsOptions: { padding: 40 },
          attributionControl: false,
        });

        map.current.on('load', () => {
          if (!map.current) return;

          map.current.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString' as const,
                coordinates: mapRouteData.route.coordinates
              }
            }
          });

          map.current.addLayer({
            id: 'route-outline',
            type: 'line',
            source: 'route',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': '#1e40af', 'line-width': 8, 'line-opacity': 0.4 }
          });

          map.current.addLayer({
            id: 'route-line',
            type: 'line',
            source: 'route',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': '#3b82f6', 'line-width': 5, 'line-opacity': 0.9 }
          });

          const originEl = document.createElement('div');
          originEl.className = 'origin-marker';
          originEl.innerHTML = `
            <div style="width: 32px; height: 32px; background: white; border: 3px solid #3b82f6; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
              <div style="width: 12px; height: 12px; background: #3b82f6; border-radius: 50%;"></div>
            </div>
          `;
          new mapboxgl.Marker(originEl)
            .setLngLat([mapRouteData.origin.lng, mapRouteData.origin.lat])
            .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML('<strong>Tulum Centro</strong><p>Starting point</p>'))
            .addTo(map.current);

          const destEl = document.createElement('div');
          destEl.className = 'destination-marker';
          destEl.innerHTML = `
            <div style="width: 36px; height: 36px; background: #ef4444; border: 3px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 12px rgba(239,68,68,0.4);">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
          `;
          new mapboxgl.Marker(destEl)
            .setLngLat([mapRouteData.destination.lng, mapRouteData.destination.lat])
            .setPopup(new mapboxgl.Popup({ offset: 25 }).setHTML(`<strong>${vendorName}</strong><p>${mapRouteData.distanceText} • ${mapRouteData.durationText}</p>`))
            .addTo(map.current);

          const carEl = document.createElement('div');
          carEl.className = 'car-marker';
          carEl.innerHTML = `
            <div style="width: 28px; height: 28px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border: 2px solid white; border-radius: 50%; display: flex; align-items: center; justify-content: center; box-shadow: 0 3px 12px rgba(16,185,129,0.5); transition: transform 0.1s ease-out;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
                <circle cx="7" cy="17" r="2"/>
                <circle cx="17" cy="17" r="2"/>
              </svg>
            </div>
          `;
          carMarker.current = new mapboxgl.Marker(carEl)
            .setLngLat([mapRouteData.origin.lng, mapRouteData.origin.lat])
            .addTo(map.current);

          map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
          setMapLoaded(true);
        });

      } catch (err) {
        console.error('Error initializing map:', err);
        setMapError(true);
      }
    };

    initDirectionsMap();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (carMarker.current) {
        carMarker.current.remove();
        carMarker.current = null;
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [mapRouteData, vendorName]);

  // Animate car along route
  const animateCar = useCallback(() => {
    if (!mapRouteData?.route?.coordinates || !carMarker.current) return;
    
    const coordinates = mapRouteData.route.coordinates;
    const totalPoints = coordinates.length;
    let currentIndex = 0;
    const animationDuration = 8000; // 8 seconds for full route
    const startTime = performance.now();

    setIsAnimating(true);

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / animationDuration, 1);
      
      // Easing function for smooth animation
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      
      currentIndex = Math.floor(easedProgress * (totalPoints - 1));
      const nextIndex = Math.min(currentIndex + 1, totalPoints - 1);
      
      // Interpolate between current and next point
      const segmentProgress = (easedProgress * (totalPoints - 1)) % 1;
      const currentCoord = coordinates[currentIndex];
      const nextCoord = coordinates[nextIndex];
      
      const interpolatedLng = currentCoord[0] + (nextCoord[0] - currentCoord[0]) * segmentProgress;
      const interpolatedLat = currentCoord[1] + (nextCoord[1] - currentCoord[1]) * segmentProgress;
      
      carMarker.current?.setLngLat([interpolatedLng, interpolatedLat]);

      // Calculate rotation based on direction
      if (currentIndex < totalPoints - 1) {
        const dx = nextCoord[0] - currentCoord[0];
        const dy = nextCoord[1] - currentCoord[1];
        const rotation = Math.atan2(dy, dx) * (180 / Math.PI);
        const el = carMarker.current?.getElement();
        if (el) {
          el.style.transform = `rotate(${rotation}deg)`;
        }
      }

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
        // Reset car to start after a delay
        setTimeout(() => {
          carMarker.current?.setLngLat([coordinates[0][0], coordinates[0][1]]);
          const el = carMarker.current?.getElement();
          if (el) el.style.transform = '';
        }, 1000);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [mapRouteData]);

  const openInGoogleMaps = () => {
    if (directionsData?.vendorLocation) {
      const { lat, lng } = directionsData.vendorLocation;
      const url = `https://www.google.com/maps/dir/${TULUM_CENTRO.lat},${TULUM_CENTRO.lng}/${lat},${lng}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      const query = encodeURIComponent(`${vendorName} Tulum Mexico`);
      window.open(`https://www.google.com/maps/search/${query}`, '_blank', 'noopener,noreferrer');
    }
  };

  const handleSaveToItinerary = async () => {
    if (!requireSignIn("save")) return;
    if (!userId) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save items to your itinerary.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      if (isSaved && itineraryItemId) {
        const { error: deleteError } = await supabase
          .from('itinerary_items')
          .delete()
          .eq('id', itineraryItemId);

        if (deleteError) throw deleteError;

        setIsSaved(false);
        setItineraryItemId(null);
        toast({
          title: "Removed from itinerary",
          description: `${vendorName} has been removed from your trip plan.`,
        });
      } else {
        const { data, error: insertError } = await supabase
          .from('itinerary_items')
          .insert({
            user_id: userId,
            vendor_name: vendorName,
            vendor_address: directionsData?.destination || vendorAddress,
            place_id: placeId,
            travel_distance: mapRouteData?.distanceText || directionsData?.distance,
            travel_duration: mapRouteData?.durationText || directionsData?.duration,
            travel_duration_seconds: mapRouteData?.duration || directionsData?.durationValue,
            arrival_tips: directionsData?.arrivalTips,
          })
          .select('id')
          .single();

        if (insertError) throw insertError;

        setIsSaved(true);
        setItineraryItemId(data.id);
        toast({
          title: "Saved to itinerary!",
          description: `${vendorName} has been added to your trip plan.`,
        });
      }
    } catch (err) {
      console.error('Error saving to itinerary:', err);
      toast({
        title: "Error",
        description: "Failed to update your itinerary. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    if (isPinMode) {
      return <Skeleton className="h-48 w-full rounded-xl" />;
    }
    return (
      <Card className="overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm">
        <Skeleton className="h-48 w-full" />
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-xl" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </Card>
    );
  }

  if (error && !directionsData?.vendorLocation) {
    if (isPinMode) {
      return (
        <div className="rounded-xl bg-muted p-4">
          <p className="text-muted-foreground text-sm">{error}</p>
        </div>
      );
    }
    return (
      <Card className="p-4 border-border/50 bg-card/80 backdrop-blur-sm">
        <p className="text-muted-foreground text-sm">{error}</p>
      </Card>
    );
  }

  const displayDistance = mapRouteData?.distanceText || directionsData?.distance;
  const displayDuration = mapRouteData?.durationText || directionsData?.duration;

  // Pin mode: render just the map container, no Card wrapper
  if (isPinMode) {
    return (
      <div className="relative w-full rounded-xl overflow-hidden" style={{ height: '192px', minHeight: '192px' }}>
        {directionsData?.vendorLocation && !mapError ? (
          <>
            <div 
              ref={mapContainer} 
              className="absolute inset-0 w-full h-full"
              style={{ width: '100%', height: '100%' }}
            />
            
            {/* Loading overlay */}
            {!mapLoaded && (
              <div className="absolute inset-0 bg-muted flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}

            {/* Open in Maps button */}
            <div className="absolute bottom-2 right-2">
              <button
                onClick={openInGoogleMaps}
                className="px-2.5 py-1.5 rounded-full bg-background/90 backdrop-blur-sm text-xs font-medium text-foreground flex items-center gap-1.5 shadow-sm border border-border/50 hover:bg-background transition-colors"
              >
                <ExternalLink className="h-3 w-3" />
                Open in Maps
              </button>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-tint via-info-wash to-lagoon-wash dark:from-slate-inkish dark:via-info-abyss/40 dark:to-lagoon-abyss/30 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Location loading...</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <MapDirectionsCard
      vendorName={vendorName}
      directionsData={directionsData}
      mapRouteData={mapRouteData}
      mapError={mapError}
      mapLoaded={mapLoaded}
      mapContainer={mapContainer}
      isPinMode={isPinMode}
      isAnimating={isAnimating}
      animateCar={animateCar}
      openInGoogleMaps={openInGoogleMaps}
      displayDistance={displayDistance}
      displayDuration={displayDuration}
      showDirections={showDirections}
      setShowDirections={setShowDirections}
      isSaved={isSaved}
      isSaving={isSaving}
      handleSaveToItinerary={handleSaveToItinerary}
    />
  );
}
