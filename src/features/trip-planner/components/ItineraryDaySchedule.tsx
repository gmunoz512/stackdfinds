import { format, parseISO } from "date-fns";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { formatTo12Hour } from "../utils/formatTime";
import {
  MapPin,
  Clock,
  Utensils,
  Bus,
  Sparkles,
  Coffee,
  ExternalLink,
  ChevronDown,
  Backpack,
  CheckCircle2,
  Navigation,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ActivityDropdownMenu } from "./ActivityDropdownMenu";
import type { ItineraryDay, ItineraryItem, ItineraryItemCategory } from "../types";

const categoryIcons: Record<ItineraryItemCategory, typeof Utensils> = {
  food: Utensils,
  activity: Sparkles,
  transport: Bus,
  free: Coffee,
};

const categoryColors: Record<ItineraryItemCategory, string> = {
  food: "text-brand bg-brand/10 border-brand/20",
  activity: "text-primary bg-primary/10 border-primary/20",
  transport: "text-info bg-info/10 border-info/20",
  free: "text-muted-foreground bg-muted border-border",
};

const categoryLabels: Record<ItineraryItemCategory, string> = {
  food: "Food & Dining",
  activity: "Activity",
  transport: "Transportation",
  free: "Free Time",
};

interface TravelInfoProps {
  distanceFromPrevious?: string;
  travelTimeFromPrevious?: string;
  distanceToNext?: string;
  travelTimeToNext?: string;
  isFirst: boolean;
  isLast: boolean;
}

function TravelInfo({ 
  distanceFromPrevious, 
  travelTimeFromPrevious, 
  distanceToNext, 
  travelTimeToNext,
  isFirst,
  isLast 
}: TravelInfoProps) {
  const hasFromPrevious = !isFirst && (distanceFromPrevious || travelTimeFromPrevious);
  const hasToNext = !isLast && (distanceToNext || travelTimeToNext);
  
  if (!hasFromPrevious && !hasToNext) return null;
  
  return (
    <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Navigation className="h-3.5 w-3.5" />
        <span>Travel Info</span>
      </div>
      <div className="grid gap-2 text-xs">
        {hasFromPrevious && (
          <div className="flex items-center gap-4 bg-muted/50 px-3 py-2 rounded-md">
            <span className="text-muted-foreground">From previous:</span>
            {distanceFromPrevious && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {distanceFromPrevious}
              </span>
            )}
            {travelTimeFromPrevious && (
              <span className="flex items-center gap-1">
                <Timer className="h-3 w-3" />
                {travelTimeFromPrevious}
              </span>
            )}
          </div>
        )}
        {hasToNext && (
          <div className="flex items-center gap-4 bg-muted/50 px-3 py-2 rounded-md">
            <span className="text-muted-foreground">To next:</span>
            {distanceToNext && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {distanceToNext}
              </span>
            )}
            {travelTimeToNext && (
              <span className="flex items-center gap-1">
                <Timer className="h-3 w-3" />
                {travelTimeToNext}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface ScheduleItemProps {
  item: ItineraryItem;
  index: number;
  isLast: boolean;
  onEdit?: () => void;
  onRemove?: () => void;
}

function ScheduleItem({ item, index, isLast, onEdit, onRemove }: ScheduleItemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const Icon = categoryIcons[item.category];
  const colorClass = categoryColors[item.category];
  
  const hasDetails = (item.includes && item.includes.length > 0) || 
                     (item.whatToBring && item.whatToBring.length > 0) ||
                     item.duration ||
                     item.distanceFromPrevious ||
                     item.distanceToNext;

  const handleViewDetails = useCallback(() => {
    setIsOpen(true);
  }, []);

  const handleEdit = useCallback(() => {
    onEdit?.();
  }, [onEdit]);

  const handleRemove = useCallback(() => {
    onRemove?.();
  }, [onRemove]);

  const handleReplace = useCallback(() => {
    toast.info("Replace activity feature coming soon!");
  }, []);

  const handleViewOnMap = useCallback(() => {
    if (item.location) {
      const query = encodeURIComponent(item.location);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, "_blank");
    }
  }, [item.location]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.2 }}
      className="relative"
    >
      <div className="flex gap-4">
        {/* Timeline */}
        <div className="flex flex-col items-center">
          {/* Time badge */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted text-xs font-medium text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{formatTo12Hour(item.time)}</span>
          </div>
          
          {/* Icon */}
          <div
            className={`mt-3 w-10 h-10 rounded-full flex items-center justify-center border ${colorClass}`}
          >
            <Icon className="h-5 w-5" />
          </div>
          
          {/* Connector line */}
          {!isLast && (
            <div className="w-px flex-1 min-h-[24px] bg-border mt-3" />
          )}
        </div>

        {/* Content Card */}
        <Card className="flex-1 p-4 mb-4 border-border/60 hover:border-border transition-colors">
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
              {/* Category label */}
              <span className={`inline-flex items-center gap-1 text-xs font-medium mb-2 ${categoryColors[item.category].split(' ')[0]}`}>
                {categoryLabels[item.category]}
              </span>
              
              {/* Title */}
              <h4 className="font-semibold text-foreground leading-tight">
                {item.title}
              </h4>
            </div>
            
            {/* Dropdown Menu */}
            <ActivityDropdownMenu
              onViewDetails={handleViewDetails}
              onEdit={handleEdit}
              onRemove={handleRemove}
              onReplace={handleReplace}
              onViewOnMap={handleViewOnMap}
              hasLocation={!!item.location}
            />
          </div>
          
          {/* Duration badge */}
          {item.duration && (
            <div className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full bg-muted text-xs text-muted-foreground">
              <Timer className="h-3 w-3" />
              {item.duration}
            </div>
          )}
          
          {/* Description */}
          <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
            {item.description}
          </p>

          {/* Location */}
          {item.location && (
            <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="truncate">{item.location}</span>
            </div>
          )}

          {/* Expandable Details Section */}
          {hasDetails && (
            <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-3">
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between h-8 text-xs text-muted-foreground hover:text-foreground"
                >
                  <span>View Details</span>
                  <ChevronDown 
                    className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="pt-3 space-y-4"
                  >
                    {/* What's Included */}
                    {item.includes && item.includes.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                          <span>What's Included</span>
                        </div>
                        <ul className="grid gap-1.5 pl-5">
                          {item.includes.map((inc, i) => (
                            <li key={i} className="text-xs text-muted-foreground list-disc">
                              {inc}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* What to Bring */}
                    {item.whatToBring && item.whatToBring.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                          <Backpack className="h-3.5 w-3.5 text-info" />
                          <span>What to Bring</span>
                        </div>
                        <ul className="grid gap-1.5 pl-5">
                          {item.whatToBring.map((bringItem, i) => (
                            <li key={i} className="text-xs text-muted-foreground list-disc">
                              {bringItem}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {/* Travel Info */}
                    <TravelInfo
                      distanceFromPrevious={item.distanceFromPrevious}
                      travelTimeFromPrevious={item.travelTimeFromPrevious}
                      distanceToNext={item.distanceToNext}
                      travelTimeToNext={item.travelTimeToNext}
                      isFirst={index === 0}
                      isLast={isLast}
                    />
                  </motion.div>
                </AnimatePresence>
              </CollapsibleContent>
            </Collapsible>
          )}

          {/* Booking Link */}
          {item.bookingLink && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3 h-8 text-xs"
              onClick={() => {
                const link = item.bookingLink!;
                if (link.startsWith("/")) {
                  navigate(link);
                } else {
                  window.open(link, "_blank", "noopener,noreferrer");
                }
              }}
            >
              <ExternalLink className="h-3 w-3 mr-1.5" />
              Book Now
            </Button>
          )}
        </Card>
      </div>
    </motion.div>
  );
}

interface ItineraryDayScheduleProps {
  day: ItineraryDay;
  onEditItem?: (itemIndex: number) => void;
  onRemoveItem?: (itemIndex: number) => void;
}

export function ItineraryDaySchedule({ day, onEditItem, onRemoveItem }: ItineraryDayScheduleProps) {
  const formattedDate = (() => {
    try {
      return format(parseISO(day.date), "EEEE, MMMM d");
    } catch {
      return day.date;
    }
  })();

  // Empty state
  if (!day.items || day.items.length === 0) {
    return (
      <div className="space-y-4">
        {/* Day header */}
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg text-foreground">{day.title}</h3>
          <span className="text-sm text-muted-foreground">{formattedDate}</span>
        </div>

        {/* Empty state card */}
        <Card className="p-8 text-center border-dashed border-2 bg-muted/30">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <Coffee className="h-6 w-6 text-muted-foreground" />
          </div>
          <h4 className="font-medium text-foreground mb-1">Free Day</h4>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            No activities planned. Enjoy exploring on your own or relax!
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Day header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg text-foreground">{day.title}</h3>
        <span className="text-sm text-muted-foreground">{formattedDate}</span>
      </div>

      {/* Items count */}
      <p className="text-xs text-muted-foreground">
        {day.items.length} {day.items.length === 1 ? "activity" : "activities"} planned
      </p>

      {/* Timeline */}
      <div className="pt-2">
        {day.items.map((item, index) => (
          <ScheduleItem
            key={`${item.time}-${item.title}-${index}`}
            item={item}
            index={index}
            isLast={index === day.items.length - 1}
            onEdit={() => onEditItem?.(index)}
            onRemove={() => onRemoveItem?.(index)}
          />
        ))}
      </div>
    </div>
  );
}
