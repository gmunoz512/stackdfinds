import { useState } from "react";
import { MapPin, Clock, Star, DollarSign, Umbrella } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export interface FilterState {
  openNow: boolean;
  nearMe: boolean;
  topRated: boolean;
  priceRange: ('$' | '$$' | '$$$' | '$$$$')[];
  outdoorSeating: boolean;
}

interface RestaurantFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onNearMeClick: () => void;
  isLoadingLocation?: boolean;
}

const RestaurantFilters = ({ 
  filters, 
  onFilterChange, 
  onNearMeClick,
  isLoadingLocation 
}: RestaurantFiltersProps) => {
  const toggleFilter = (key: keyof Omit<FilterState, 'priceRange'>) => {
    if (key === 'nearMe') {
      onNearMeClick();
      return;
    }
    onFilterChange({ ...filters, [key]: !filters[key] });
  };

  const togglePrice = (price: '$' | '$$' | '$$$' | '$$$$') => {
    const newPrices = filters.priceRange.includes(price)
      ? filters.priceRange.filter(p => p !== price)
      : [...filters.priceRange, price];
    onFilterChange({ ...filters, priceRange: newPrices });
  };

  const FilterButton = ({ 
    active, 
    onClick, 
    children,
    loading 
  }: { 
    active: boolean; 
    onClick: () => void; 
    children: React.ReactNode;
    loading?: boolean;
  }) => (
    <Button
      variant={active ? "default" : "outline"}
      size="sm"
      onClick={onClick}
      disabled={loading}
      className={`shrink-0 rounded-full text-xs h-8 px-3 ${
        active 
          ? 'bg-foreground text-background hover:bg-foreground/90' 
          : 'bg-card hover:bg-muted'
      }`}
    >
      {children}
    </Button>
  );

  return (
    <ScrollArea className="w-full">
      <div className="flex gap-2 px-4 py-3">
        <FilterButton 
          active={filters.nearMe} 
          onClick={() => toggleFilter('nearMe')}
          loading={isLoadingLocation}
        >
          <MapPin className="h-3.5 w-3.5 mr-1.5" />
          {isLoadingLocation ? 'Finding...' : 'Near Me'}
        </FilterButton>

        <FilterButton 
          active={filters.openNow} 
          onClick={() => toggleFilter('openNow')}
        >
          <Clock className="h-3.5 w-3.5 mr-1.5" />
          Open Now
        </FilterButton>

        <FilterButton 
          active={filters.topRated} 
          onClick={() => toggleFilter('topRated')}
        >
          <Star className="h-3.5 w-3.5 mr-1.5" />
          Top Rated
        </FilterButton>

        <FilterButton 
          active={filters.priceRange.includes('$') || filters.priceRange.includes('$$')} 
          onClick={() => {
            const hasLow = filters.priceRange.includes('$') || filters.priceRange.includes('$$');
            if (hasLow) {
              onFilterChange({ 
                ...filters, 
                priceRange: filters.priceRange.filter(p => p !== '$' && p !== '$$') 
              });
            } else {
              onFilterChange({ 
                ...filters, 
                priceRange: [...filters.priceRange, '$', '$$'] 
              });
            }
          }}
        >
          <DollarSign className="h-3.5 w-3.5 mr-1" />
          $ - $$
        </FilterButton>

        <FilterButton 
          active={filters.priceRange.includes('$$$') || filters.priceRange.includes('$$$$')} 
          onClick={() => {
            const hasHigh = filters.priceRange.includes('$$$') || filters.priceRange.includes('$$$$');
            if (hasHigh) {
              onFilterChange({ 
                ...filters, 
                priceRange: filters.priceRange.filter(p => p !== '$$$' && p !== '$$$$') 
              });
            } else {
              onFilterChange({ 
                ...filters, 
                priceRange: [...filters.priceRange, '$$$', '$$$$'] 
              });
            }
          }}
        >
          <DollarSign className="h-3.5 w-3.5 mr-1" />
          $$$ - $$$$
        </FilterButton>

        <FilterButton 
          active={filters.outdoorSeating} 
          onClick={() => toggleFilter('outdoorSeating')}
        >
          <Umbrella className="h-3.5 w-3.5 mr-1.5" />
          Outdoor
        </FilterButton>
      </div>
      <ScrollBar orientation="horizontal" className="h-2" />
    </ScrollArea>
  );
};

export default RestaurantFilters;
