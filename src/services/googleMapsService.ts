// Distance label for listings. This is arithmetic only.
// The app does not call Google Maps or Places.

export const formatDistance = (meters: number): string => {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  const miles = meters / 1609.34;
  return `${miles.toFixed(1)} mi`;
};
