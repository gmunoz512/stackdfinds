import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingDown, TrendingUp, Minus, Sparkles, ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PriceComparisonProps {
  category: string;
  experienceName: string;
  currentPrice: number;
  duration?: string;
}

interface Comparable {
  name: string;
  priceRange: string;
  notes: string;
}

interface PriceData {
  priceRange: { low: number; high: number };
  priceAssessment: 'below_average' | 'average' | 'above_average' | 'premium';
  assessmentText: string;
  comparables: Comparable[];
  marketInsight: string;
}

const PriceComparison = ({ category, experienceName, currentPrice, duration }: PriceComparisonProps) => {
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loadedForPrice, setLoadedForPrice] = useState<number | null>(null);

  // Generate a unique cache key based on experience details
  const cacheKey = `price-comparison-${category}-${experienceName}-${currentPrice}-${duration || 'none'}`.replace(/\s+/g, '-').toLowerCase();

  // Check for cached data on mount and when price changes
  useEffect(() => {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        // Check if cache is less than 1 hour old
        if (parsed.timestamp && Date.now() - parsed.timestamp < 60 * 60 * 1000) {
          setPriceData(parsed.data);
          setHasLoaded(true);
          setLoadedForPrice(currentPrice);
          return;
        } else {
          sessionStorage.removeItem(cacheKey);
        }
      } catch {
        sessionStorage.removeItem(cacheKey);
      }
    }
    
    // Reset state when price changes and no cache exists
    if (loadedForPrice !== null && loadedForPrice !== currentPrice) {
      setPriceData(null);
      setHasLoaded(false);
      setIsExpanded(false);
    }
  }, [cacheKey, currentPrice, loadedForPrice]);

  // Reset when price changes to a different value than what was loaded
  useEffect(() => {
    if (loadedForPrice !== null && loadedForPrice !== currentPrice) {
      // Check if we have cache for the new price
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.timestamp && Date.now() - parsed.timestamp < 60 * 60 * 1000) {
            setPriceData(parsed.data);
            setHasLoaded(true);
            setLoadedForPrice(currentPrice);
            setIsExpanded(true); // Keep expanded when switching tiers
            return;
          }
        } catch {
          // Invalid cache, reset
        }
      }
      // No cache for new price, reset state
      setPriceData(null);
      setHasLoaded(false);
      setLoadedForPrice(null);
      // Keep expanded state so user can click to load new comparison
    }
  }, [currentPrice, loadedForPrice, cacheKey]);

  const fetchComparison = async () => {
    if (hasLoaded && loadedForPrice === currentPrice) {
      setIsExpanded(!isExpanded);
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('price-comparison', {
        body: {
          category,
          experienceName,
          currentPrice,
          duration,
          location: 'Tulum'
        }
      });

      if (error) throw error;

      if (data?.success) {
        setPriceData(data.data);
        setHasLoaded(true);
        setLoadedForPrice(currentPrice);
        setIsExpanded(true);
        
        // Cache the result with timestamp
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data: data.data,
          timestamp: Date.now()
        }));
      } else {
        throw new Error(data?.error || 'Failed to get price comparison');
      }
    } catch (error) {
      console.error('Price comparison error:', error);
      toast.error('Could not load price comparison');
    } finally {
      setIsLoading(false);
    }
  };

  const getAssessmentIcon = () => {
    if (!priceData) return null;
    switch (priceData.priceAssessment) {
      case 'below_average':
        return <TrendingUp className="h-4 w-4 text-success" />;
      case 'above_average':
      case 'premium':
        return <TrendingDown className="h-4 w-4 text-warning" />;
      default:
        return <Minus className="h-4 w-4 text-info" />;
    }
  };

  const getAssessmentColor = () => {
    if (!priceData) return 'bg-muted';
    switch (priceData.priceAssessment) {
      case 'below_average':
        return 'bg-success/10 text-success-strong border-success/20';
      case 'above_average':
        return 'bg-warning/10 text-warning-strong border-warning/20';
      case 'premium':
        return 'bg-iris/10 text-iris-strong border-iris/20';
      default:
        return 'bg-info/10 text-info-strong border-info/20';
    }
  };

  const getMarkerGlowColor = () => {
    if (!priceData) return 'shadow-md';
    switch (priceData.priceAssessment) {
      case 'below_average':
        return 'shadow-[0_0_8px_2px_rgba(34,197,94,0.5)]';
      case 'above_average':
        return 'shadow-[0_0_8px_2px_rgba(245,158,11,0.5)]';
      case 'premium':
        return 'shadow-[0_0_8px_2px_rgba(168,85,247,0.5)]';
      default:
        return 'shadow-[0_0_8px_2px_rgba(59,130,246,0.5)]';
    }
  };

  const getAssessmentLabel = () => {
    if (!priceData) return '';
    switch (priceData.priceAssessment) {
      case 'below_average':
        return 'Great Value';
      case 'above_average':
        return 'Above Average';
      case 'premium':
        return 'Premium';
      default:
        return 'Fair Price';
    }
  };

  const needsRefresh = hasLoaded && loadedForPrice !== currentPrice;

  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        size="sm"
        onClick={fetchComparison}
        disabled={isLoading}
        className="w-full gap-2 justify-between"
      >
        <span className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          {needsRefresh ? 'Compare New Price in Tulum' : 'Compare Prices in Tulum'}
        </span>
        {isLoading ? (
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        ) : hasLoaded && !needsRefresh ? (
          isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
        ) : needsRefresh ? (
          <Badge variant="secondary" className="text-xs px-1.5 py-0.5">New</Badge>
        ) : null}
      </Button>

      {isLoading && (
        <Card className="p-4 space-y-4 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent animate-in fade-in duration-300">
          {/* Header skeleton */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>
          
          {/* Price range bar skeleton */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-3 w-8" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-8" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-3 w-32 mx-auto" />
          </div>
          
          {/* Assessment text skeleton */}
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          
          {/* Comparables skeleton */}
          <div className="space-y-2 pt-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
          
          {/* Market insight skeleton */}
          <div className="border-t pt-3">
            <Skeleton className="h-3 w-full" />
          </div>
        </Card>
      )}

      {priceData && isExpanded && (
        <Card className="p-4 space-y-4 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
          {/* Price Assessment Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getAssessmentIcon()}
              <Badge variant="outline" className={getAssessmentColor()}>
                {getAssessmentLabel()}
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              Tulum Market
            </div>
          </div>

          {/* Price Range Bar */}
          <div className="space-y-3">
            <div className="flex justify-between text-xs text-muted-foreground font-medium">
              <span className="text-success-strong">${priceData.priceRange.low}</span>
              <span className="uppercase tracking-wider text-[10px]">Market Range</span>
              <span className="text-warning-strong">${priceData.priceRange.high}</span>
            </div>
            <div className="relative h-3 rounded-full overflow-hidden shadow-inner bg-gradient-to-r from-muted/80 via-muted to-muted/80">
              {/* Gradient track with shimmer */}
              <div 
                className="absolute inset-0 bg-gradient-to-r from-success/90 via-mint-light/80 via-40% via-info-light/80 via-60% to-warning/90 rounded-full"
              />
              {/* Shimmer effect */}
              <div className="absolute inset-0 overflow-hidden rounded-full">
                <div className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-paper/40 to-transparent animate-shimmer" />
              </div>
              {/* Shine overlay */}
              <div className="absolute inset-0 bg-gradient-to-b from-paper/20 to-transparent rounded-full" />
              {/* Tick marks */}
              <div className="absolute inset-0 flex justify-between px-1 items-center">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-px h-1.5 bg-paper/40 rounded-full" />
                ))}
              </div>
              {/* Current price marker */}
              <div 
                className="absolute top-1/2 -translate-y-1/2 z-10"
                style={{ 
                  left: `${Math.min(100, Math.max(0, ((currentPrice - priceData.priceRange.low) / (priceData.priceRange.high - priceData.priceRange.low)) * 100))}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              >
                <div className={`w-4 h-4 bg-foreground rounded-full border-2 border-background ${getMarkerGlowColor()} animate-glow-pulse`} />
              </div>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              This experience: <span className="font-semibold text-foreground">${currentPrice}</span>
            </p>
          </div>

          {/* Assessment Text */}
          <p className="text-sm text-muted-foreground">
            {priceData.assessmentText}
          </p>

          {/* Comparables */}
          {priceData.comparables && priceData.comparables.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Similar in Tulum</p>
              <div className="space-y-2">
                {priceData.comparables.map((comp, index) => (
                  <div key={index} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/50">
                    <span className="font-medium truncate flex-1 mr-2">{comp.name}</span>
                    <span className="text-muted-foreground whitespace-nowrap">{comp.priceRange}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Market Insight */}
          {priceData.marketInsight && (
            <p className="text-xs text-muted-foreground italic border-t pt-3">
              💡 {priceData.marketInsight}
            </p>
          )}
        </Card>
      )}
    </div>
  );
};

export default PriceComparison;
