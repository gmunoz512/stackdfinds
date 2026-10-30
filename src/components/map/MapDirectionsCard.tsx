import type { RefObject } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Navigation, Lightbulb, ExternalLink, Bookmark, BookmarkCheck, Loader2, Car, CircleDot, ChevronDown, ChevronUp, ArrowUp, CornerDownRight, CornerDownLeft, RotateCcw, MoveRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DirectionsData, MapboxRouteData } from "./mapTypes";

// Helper to get direction icon based on instruction text
const getDirectionIcon = (instruction: string) => {
  const lowerInstruction = instruction.toLowerCase();
  if (lowerInstruction.includes('right')) return <CornerDownRight className="h-4 w-4" />;
  if (lowerInstruction.includes('left')) return <CornerDownLeft className="h-4 w-4" />;
  if (lowerInstruction.includes('u-turn') || lowerInstruction.includes('uturn')) return <RotateCcw className="h-4 w-4" />;
  if (lowerInstruction.includes('straight') || lowerInstruction.includes('continue')) return <ArrowUp className="h-4 w-4" />;
  if (lowerInstruction.includes('merge') || lowerInstruction.includes('enter')) return <MoveRight className="h-4 w-4" />;
  return <ArrowUp className="h-4 w-4" />;
};

// Format distance for display
const formatStepDistance = (meters: number) => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
};

// Format duration for display
const formatStepDuration = (seconds: number) => {
  if (seconds >= 60) {
    return `${Math.round(seconds / 60)} min`;
  }
  return `${Math.round(seconds)} sec`;
};

export function MapDirectionsCard(props: {
  vendorName: string;
  directionsData: DirectionsData | null;
  mapRouteData: MapboxRouteData | null;
  mapError: boolean;
  mapLoaded: boolean;
  mapContainer: RefObject<HTMLDivElement>;
  isPinMode: boolean;
  isAnimating: boolean;
  animateCar: () => void;
  openInGoogleMaps: () => void;
  displayDistance?: string;
  displayDuration?: string;
  showDirections: boolean;
  setShowDirections: (value: boolean) => void;
  isSaved: boolean;
  isSaving: boolean;
  handleSaveToItinerary: () => void;
}) {
  const {
    vendorName, directionsData, mapRouteData, mapError, mapLoaded, mapContainer,
    isPinMode, isAnimating, animateCar, openInGoogleMaps, displayDistance, displayDuration,
    showDirections, setShowDirections, isSaved, isSaving, handleSaveToItinerary,
  } = props;
  return (
    <Card className="overflow-hidden border-border/50 bg-gradient-to-br from-card via-card to-primary/5 backdrop-blur-sm">
      {/* Interactive Mapbox Map - always render container with explicit dimensions */}
      <div className="relative w-full" style={{ height: '192px', minHeight: '192px' }}>
        {directionsData?.vendorLocation && !mapError ? (
          <>
            <div 
              ref={mapContainer} 
              className="absolute inset-0 w-full h-full"
              style={{ width: '100%', height: '100%' }}
              onClick={(e) => {
                if ((e.target as HTMLElement).closest('.mapboxgl-ctrl')) return;
              }}
            />
            
            {/* Loading overlay */}
            {!mapLoaded && mapRouteData && (
              <div className="absolute inset-0 bg-muted flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            )}

            {/* Fallback stylized map while loading Mapbox data */}
            {!mapRouteData && (
              <div className="absolute inset-0 bg-gradient-to-br from-slate-tint via-info-wash to-lagoon-wash dark:from-slate-inkish dark:via-info-abyss/40 dark:to-lagoon-abyss/30">
                <div className="absolute inset-0 opacity-10">
                  <div className="w-full h-full" style={{
                    backgroundImage: 'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
                    backgroundSize: '30px 30px'
                  }} />
                </div>
                
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 192" preserveAspectRatio="xMidYMid slice">
                  <path 
                    d="M 80 96 Q 200 50 320 96" 
                    fill="none" 
                    stroke="url(#routeGradient)" 
                    strokeWidth="3" 
                    strokeDasharray="8 6"
                    strokeLinecap="round"
                    className="animate-pulse"
                  />
                  <defs>
                    <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="1" />
                    </linearGradient>
                  </defs>
                </svg>

                <div className="absolute left-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
                  <div className="h-10 w-10 rounded-full bg-muted border-2 border-primary/40 flex items-center justify-center shadow-md">
                    <CircleDot className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-[10px] font-medium text-muted-foreground bg-background/80 px-1.5 py-0.5 rounded">
                    Tulum Centro
                  </span>
                </div>

                <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col items-center gap-1">
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full bg-primary/20 animate-ping absolute inset-0" />
                    <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center shadow-lg relative border-2 border-primary">
                      <MapPin className="h-5 w-5 text-primary-foreground" />
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-foreground bg-background/90 px-1.5 py-0.5 rounded shadow-sm max-w-[80px] truncate">
                    {vendorName.split(' ').slice(0, 2).join(' ')}
                  </span>
                </div>

                <div className="absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/90 backdrop-blur-sm shadow-sm border border-border/50">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                  <span className="text-xs font-medium text-muted-foreground">Loading route...</span>
                </div>
              </div>
            )}

            {/* Gradient overlay at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-card to-transparent pointer-events-none" />
            {/* Map controls row */}
            <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center">
              {/* Animate journey button (directions mode only) */}
              {!isPinMode && mapLoaded && mapRouteData?.route && (
                <button
                  onClick={animateCar}
                  disabled={isAnimating}
                  className={cn(
                    "px-2.5 py-1.5 rounded-full backdrop-blur-sm text-xs font-medium flex items-center gap-1.5 shadow-sm border transition-all",
                    isAnimating 
                      ? "bg-success/90 text-paper border-success/50" 
                      : "bg-background/90 text-foreground border-border/50 hover:bg-background"
                  )}
                >
                  <Car className={cn("h-3 w-3", isAnimating && "animate-pulse")} />
                  {isAnimating ? "Driving..." : "Animate Route"}
                </button>
              )}
              {(!mapLoaded || isPinMode) && <div />}
              
              {/* Open in Maps button */}
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
          // Fallback when no vendor location - show a placeholder
          <div className="absolute inset-0 bg-gradient-to-br from-slate-tint via-info-wash to-lagoon-wash dark:from-slate-inkish dark:via-info-abyss/40 dark:to-lagoon-abyss/30 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Location loading...</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Compact Location Header */}
      <div className="p-4 space-y-4">
        {/* Main Info Row */}
        <div className="flex items-start gap-3">
          {/* Map Pin Icon with gradient background */}
          <div className="relative shrink-0">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
              <MapPin className="h-6 w-6 text-primary" />
            </div>
          </div>
          
          {/* Location Details */}
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm text-foreground truncate">
              {vendorName}
            </h4>
            {directionsData?.destination && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                {directionsData.destination}
              </p>
            )}
            
            {/* Distance & Duration Pills (directions mode only) */}
            {!isPinMode && (displayDistance || displayDuration) && (
              <div className="flex items-center gap-2 mt-2">
                {displayDistance && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    <Car className="h-3 w-3" />
                    <span>{displayDistance}</span>
                  </div>
                )}
                {displayDuration && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-xs font-medium">
                    <Clock className="h-3 w-3" />
                    <span>{displayDuration}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Turn-by-Turn Directions (directions mode only) */}
        {!isPinMode && mapRouteData?.steps && mapRouteData.steps.length > 0 && (
          <div className="rounded-lg border border-border/50 overflow-hidden">
            <button
              onClick={() => setShowDirections(!showDirections)}
              className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Navigation className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Turn-by-Turn Directions</span>
                <span className="text-xs text-muted-foreground">({mapRouteData.steps.length} steps)</span>
              </div>
              {showDirections ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
            
            {showDirections && (
              <div className="divide-y divide-border/50 max-h-64 overflow-y-auto">
                {mapRouteData.steps.map((step, index) => (
                  <div 
                    key={index}
                    className="flex items-start gap-3 p-3 hover:bg-muted/20 transition-colors"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                        {getDirectionIcon(step.instruction)}
                      </div>
                      <span className="text-[10px] text-muted-foreground">{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground leading-relaxed">
                        {step.instruction}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {formatStepDistance(step.distance)}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatStepDuration(step.duration)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="flex items-start gap-3 p-3 bg-success/5">
                  <div className="flex flex-col items-center gap-1">
                    <div className="h-8 w-8 rounded-full bg-success/20 flex items-center justify-center text-success-strong shrink-0">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <span className="text-[10px] text-muted-foreground">End</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-success-strong">Arrive at {vendorName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Total: {mapRouteData.distanceText} • {mapRouteData.durationText}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Arrival Tips (directions mode only) */}
        {!isPinMode && directionsData?.arrivalTips && directionsData.arrivalTips.length > 0 && (
          <div className="rounded-lg bg-rating/10 border border-rating/20 p-3">
            <div className="flex items-start gap-2">
              <Lightbulb className="h-4 w-4 text-rating shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="text-xs font-medium text-rating-strong dark:text-rating-light">Pro Tips</span>
                <ul className="space-y-1">
                  {directionsData.arrivalTips.slice(0, 2).map((tip, index) => (
                    <li key={index} className="text-xs text-muted-foreground leading-relaxed">
                      • {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={openInGoogleMaps}
            className={cn(
              "flex-1 h-11 rounded-xl font-medium",
              "bg-gradient-to-r from-primary to-primary/80",
              "hover:from-primary/90 hover:to-primary/70",
              "shadow-lg shadow-primary/25",
              "transition-all duration-300 hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.02]"
            )}
          >
            <Navigation className="h-4 w-4 mr-2" />
            Get Directions
          </Button>
          <Button
            variant={isSaved ? "default" : "outline"}
            aria-label={isSaved ? `Remove ${vendorName} from itinerary` : `Save ${vendorName} to itinerary`}
            onClick={handleSaveToItinerary}
            disabled={isSaving}
            className={cn(
              "h-11 px-4 rounded-xl transition-all duration-300",
              isSaved && "bg-success-strong hover:bg-success-deep border-success-strong"
            )}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isSaved ? (
              <BookmarkCheck className="h-4 w-4" />
            ) : (
              <Bookmark className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
