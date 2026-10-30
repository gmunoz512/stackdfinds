import { useState, useRef, useEffect, useCallback } from "react";
import { Search, MapPin, X, Loader2, Utensils } from "lucide-react";
import { autocompleteSearch, type AutocompleteSuggestion } from "@/services/googleMapsService";

interface LocationSearchProps {
  city: string;
  zipCode: string;
  onCityChange: (city: string) => void;
  onZipChange: (zip: string) => void;
  onSearch: () => void;
  onLocationDetect: () => void;
  onRestaurantSelect?: (suggestion: AutocompleteSuggestion) => void;
  onLocationSelect?: (lat: number, lng: number, city: string, zipCode: string) => void;
  isLoadingLocation?: boolean;
  userLocation?: { lat: number; lng: number } | null;
  placeholder?: string;
}

const LocationSearch = ({
  city,
  zipCode,
  onCityChange,
  onZipChange,
  onSearch,
  onLocationDetect,
  onRestaurantSelect,
  onLocationSelect,
  isLoadingLocation,
  userLocation,
  placeholder = "Search restaurants, cuisines, or cities..."
}: LocationSearchProps) => {
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<AutocompleteSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update query when city changes externally
  useEffect(() => {
    if (city && !query) {
      setQuery(city);
    }
  }, [city]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await autocompleteSearch(
        searchQuery,
        userLocation?.lat,
        userLocation?.lng
      );
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } catch (error) {
      console.error('Autocomplete error:', error);
      setSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  }, [userLocation]);

  const handleInputChange = (value: string) => {
    setQuery(value);
    
    // Debounce API calls
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);
  };

  const selectSuggestion = (suggestion: AutocompleteSuggestion) => {
    if (suggestion.type === 'restaurant') {
      setQuery(suggestion.name);
      onCityChange(suggestion.city || '');
      onZipChange(suggestion.zipCode || '');
      onRestaurantSelect?.(suggestion);
    } else {
      setQuery(suggestion.name);
      onCityChange(suggestion.name);
      onZipChange(suggestion.zipCode || '');
      if (suggestion.lat && suggestion.lng) {
        onLocationSelect?.(suggestion.lat, suggestion.lng, suggestion.name, suggestion.zipCode || '');
      }
    }
    setShowSuggestions(false);
    onSearch();
  };

  const clearSearch = () => {
    setQuery('');
    onCityChange('');
    onZipChange('');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setShowSuggestions(false);
      onSearch();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSearchClick = () => {
    setShowSuggestions(false);
    onSearch();
  };

  // Group suggestions by type
  const restaurantSuggestions = suggestions.filter(s => s.type === 'restaurant');
  const locationSuggestions = suggestions.filter(s => s.type === 'location');

  return (
    <div ref={wrapperRef} className="relative group">
      {/* Shadow layers for 3D effect */}
      <div className="absolute -inset-1 bg-gradient-to-r from-brand to-hot rounded-full blur opacity-25 group-hover:opacity-40 transition duration-300"></div>
      <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-light to-hot-light rounded-full blur-sm opacity-20 group-hover:opacity-30 transition duration-300"></div>

      {/* Main search container */}
      <div className="relative bg-card rounded-full shadow-2xl border border-border/50 backdrop-blur-sm overflow-hidden hover:shadow-3xl transition-all duration-300">
        <div className="flex items-center px-4 py-3 gap-2">
          <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          
          <div className="flex-1 flex items-center gap-2">
            <input
              type="text"
              placeholder={placeholder}
              value={query}
              onChange={(e) => handleInputChange(e.target.value)}
              onFocus={() => query.length >= 2 && fetchSuggestions(query)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground min-w-0"
            />
          </div>

          {isSearching && (
            <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
          )}

          {query && !isSearching && (
            <button aria-label="Clear search"
              onClick={clearSearch}
              className="p-1.5 hover:bg-muted rounded-full transition-colors"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}

          <button aria-label="Use my location"
            onClick={onLocationDetect}
            disabled={isLoadingLocation}
            className="p-2 hover:bg-muted rounded-full transition-colors disabled:opacity-50"
            title="Use my location"
          >
            {isLoadingLocation ? (
              <Loader2 className="h-4 w-4 text-muted-foreground animate-spin" />
            ) : (
              <MapPin className="h-4 w-4 text-muted-foreground" />
            )}
          </button>

          <button aria-label="Search" 
            onClick={handleSearchClick}
            className="bg-gradient-to-r from-brand to-hot hover:from-brand-strong hover:to-hot-strong text-paper rounded-full p-2 flex-shrink-0 transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl shadow-xl border border-border overflow-hidden z-50 max-h-[400px] overflow-y-auto">
          {/* Restaurant suggestions */}
          {restaurantSuggestions.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-muted/50 border-b border-border">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Restaurants</p>
              </div>
              {restaurantSuggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => selectSuggestion(suggestion)}
                  className="w-full px-4 py-3 text-left hover:bg-muted flex items-start gap-3 transition-colors border-b border-border/50 last:border-0"
                >
                  <div className="p-2 rounded-full bg-brand/10 flex-shrink-0">
                    <Utensils className="h-4 w-4 text-brand" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{suggestion.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {suggestion.cuisine && <span className="text-brand">{suggestion.cuisine}</span>}
                      {suggestion.cuisine && suggestion.description && ' • '}
                      {suggestion.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {/* Location suggestions */}
          {locationSuggestions.length > 0 && (
            <div>
              <div className="px-4 py-2 bg-muted/50 border-b border-border">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Locations</p>
              </div>
              {locationSuggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => selectSuggestion(suggestion)}
                  className="w-full px-4 py-3 text-left hover:bg-muted flex items-start gap-3 transition-colors border-b border-border/50 last:border-0"
                >
                  <div className="p-2 rounded-full bg-primary/10 flex-shrink-0">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{suggestion.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{suggestion.description}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* No results message */}
      {showSuggestions && suggestions.length === 0 && query.length >= 2 && !isSearching && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl shadow-xl border border-border overflow-hidden z-50">
          <div className="px-4 py-6 text-center">
            <p className="text-sm text-muted-foreground">No results found for "{query}"</p>
            <p className="text-xs text-muted-foreground mt-1">Try a different search term</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationSearch;
