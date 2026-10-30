export interface DirectionsData {
  distance: string;
  duration: string;
  durationValue: number;
  origin: string;
  destination: string;
  vendorLocation?: {
    lat: number;
    lng: number;
  };
  arrivalTips: string[];
  error?: string;
}

export interface RouteStep {
  instruction: string;
  distance: number;
  duration: number;
}

export interface MapboxRouteData {
  route: {
    type: string;
    coordinates: [number, number][];
  };
  duration: number;
  durationText: string;
  distance: number;
  distanceText: string;
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number };
  steps?: RouteStep[];
}
