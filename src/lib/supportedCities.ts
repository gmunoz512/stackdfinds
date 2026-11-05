export interface SupportedCity {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export const SUPPORTED_CITIES: SupportedCity[] = [
  { id: "tulum", name: "Tulum", lat: 20.2114, lng: -87.4654 },
];

export const DEFAULT_CITY = SUPPORTED_CITIES[0]; // Tulum

export const getCityByName = (name: string): SupportedCity | undefined => {
  return SUPPORTED_CITIES.find(
    (city) => city.name.toLowerCase() === name.toLowerCase()
  );
};

export const getCityById = (id: string): SupportedCity | undefined => {
  return SUPPORTED_CITIES.find((city) => city.id === id);
};
