import { memo, useMemo } from "react";
import { motion } from "framer-motion";
import { format, parseISO, differenceInDays } from "date-fns";
import { 
  MapPin, 
  Calendar, 
  ChevronRight, 
  Utensils, 
  Sparkles,
  Loader2,
  Bus,
  Coffee,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useItineraryContext } from "../context/ItineraryContext";
import type { ItineraryItemCategory } from "../types";

const categoryIcons: Record<ItineraryItemCategory, typeof Utensils> = {
  food: Utensils,
  activity: Sparkles,
  transport: Bus,
  free: Coffee,
};

interface ItineraryPreviewCardProps {
  onExpand: () => void;
}

// Loading skeleton for the preview card
function PreviewCardSkeleton() {
  return (
    <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <div className="flex items-center gap-2 mb-3">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-sm font-medium text-primary">Generating itinerary...</span>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-2 mt-3">
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>
    </Card>
  );
}

// Error state card
interface ErrorCardProps {
  message: string;
  retryable: boolean;
  onRetry: () => void;
  onDismiss: () => void;
}

function ErrorCard({ message, retryable, onRetry, onDismiss }: ErrorCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Card className="p-4 bg-destructive/5 border-destructive/20">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
            <AlertCircle className="h-4 w-4 text-destructive" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-foreground text-sm mb-1">
              Couldn't create itinerary
            </h4>
            <p className="text-xs text-muted-foreground mb-3">
              {message}
            </p>
            <div className="flex gap-2">
              {retryable && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className="h-7 text-xs gap-1.5"
                >
                  <RefreshCw className="h-3 w-3" />
                  Try again
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="h-7 text-xs text-muted-foreground"
              >
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export const ItineraryPreviewCard = memo(function ItineraryPreviewCard({ 
  onExpand 
}: ItineraryPreviewCardProps) {
  const { itinerary, isGenerating, generationError, retryGeneration, clearError } = useItineraryContext();

  // Get summary data
  const summary = useMemo(() => {
    if (!itinerary) return null;

    const totalDays = itinerary.days.length;
    const totalActivities = itinerary.days.reduce(
      (sum, day) => sum + day.items.length, 
      0
    );

    // Get unique categories with counts
    const categoryCounts: Record<ItineraryItemCategory, number> = {
      food: 0,
      activity: 0,
      transport: 0,
      free: 0,
    };

    itinerary.days.forEach(day => {
      day.items.forEach(item => {
        categoryCounts[item.category]++;
      });
    });

    // Get top 3 activities for preview
    const previewItems = itinerary.days
      .flatMap(day => day.items)
      .filter(item => item.category === "activity" || item.category === "food")
      .slice(0, 3);

    let dateRange = "";
    if (itinerary.startDate && itinerary.endDate) {
      try {
        const start = parseISO(itinerary.startDate);
        const end = parseISO(itinerary.endDate);
        const days = differenceInDays(end, start) + 1;
        dateRange = `${format(start, "MMM d")} - ${format(end, "MMM d")} • ${days} days`;
      } catch {
        dateRange = `${totalDays} days`;
      }
    }

    return {
      totalDays,
      totalActivities,
      categoryCounts,
      previewItems,
      dateRange,
    };
  }, [itinerary]);

  // Show error state
  if (generationError) {
    return (
      <ErrorCard
        message={generationError.message}
        retryable={generationError.retryable}
        onRetry={retryGeneration}
        onDismiss={clearError}
      />
    );
  }

  // Show skeleton while generating
  if (isGenerating) {
    return <PreviewCardSkeleton />;
  }

  // Don't show if no itinerary
  if (!itinerary || !summary) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Card 
        className="p-4 bg-gradient-to-br from-primary/5 via-background to-primary/10 border-primary/20 
          cursor-pointer hover:border-primary/40 hover:shadow-md transition-all group"
        onClick={onExpand}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground truncate">
                  {itinerary.destination}
                </h4>
                {summary.dateRange && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {summary.dateRange}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 gap-1 text-primary group-hover:bg-primary/10"
          >
            <span className="text-xs">View</span>
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Button>
        </div>

        {/* Stats row */}
        <div className="flex gap-3 mb-3">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{summary.totalDays}</span>
            days
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">{summary.totalActivities}</span>
            activities
          </div>
          {summary.categoryCounts.food > 0 && (
            <>
              <div className="w-px h-4 bg-border" />
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Utensils className="h-3 w-3 text-brand" />
                <span className="font-medium text-foreground">{summary.categoryCounts.food}</span>
                meals
              </div>
            </>
          )}
        </div>

        {/* Preview items */}
        {summary.previewItems.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground font-medium">Highlights</p>
            <div className="flex flex-wrap gap-2">
              {summary.previewItems.map((item, index) => {
                const Icon = categoryIcons[item.category];
                return (
                  <div 
                    key={index}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full 
                      bg-muted/80 text-xs text-foreground"
                  >
                    <Icon className="h-3 w-3 text-muted-foreground" />
                    <span className="truncate max-w-[120px]">{item.title}</span>
                  </div>
                );
              })}
              {summary.totalActivities > 3 && (
                <div className="inline-flex items-center px-2.5 py-1 rounded-full 
                  bg-primary/10 text-xs text-primary font-medium">
                  +{summary.totalActivities - 3} more
                </div>
              )}
            </div>
          </div>
        )}

        {/* Confirmed badge */}
        {itinerary.isConfirmed && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full 
              bg-success/10 text-xs text-success-strong font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              Confirmed
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
});
