import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { SUPPORTED_CITIES, DEFAULT_CITY, getCityByName, type SupportedCity } from '@/lib/supportedCities';

interface SearchContextType {
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  destination: string;
  setDestination: (destination: string) => void;
  selectedCity: SupportedCity;
  supportedCities: SupportedCity[];
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

export const SearchProvider = ({ children }: { children: ReactNode }) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(() => {
    const stored = sessionStorage.getItem('searchSelectedDate');
    return stored ? new Date(stored) : undefined;
  });

  const [destination, setDestinationState] = useState<string>(() => {
    const stored = sessionStorage.getItem('searchDestination');
    return stored || DEFAULT_CITY.name;
  });

  const setDestination = (newDestination: string) => {
    setDestinationState(newDestination);
    sessionStorage.setItem('searchDestination', newDestination);
  };

  const selectedCity = getCityByName(destination) || DEFAULT_CITY;

  useEffect(() => {
    if (selectedDate) {
      sessionStorage.setItem('searchSelectedDate', selectedDate.toISOString());
    } else {
      sessionStorage.removeItem('searchSelectedDate');
    }
  }, [selectedDate]);

  return (
    <SearchContext.Provider value={{ 
      selectedDate, 
      setSelectedDate, 
      destination,
      setDestination,
      selectedCity,
      supportedCities: SUPPORTED_CITIES,
    }}>
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};
