import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Clock,
  Navigation,
  Trash2,
  GripVertical,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";

interface ItineraryItem {
  id: string;
  vendor_name: string;
  vendor_address: string | null;
  place_id: string | null;
  travel_distance: string | null;
  travel_duration: string | null;
  travel_duration_seconds: number | null;
  arrival_tips: string[] | null;
  notes: string | null;
  planned_date: string | null;
  planned_time: string | null;
  sort_order: number;
  created_at: string;
}

interface SortableItineraryItemProps {
  item: ItineraryItem;
  index: number;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export function SortableItineraryItem({
  item,
  index,
  onDelete,
  isDeleting,
}: SortableItineraryItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const openInGoogleMaps = () => {
    const query = encodeURIComponent(`${item.vendor_name} Tulum Mexico`);
    window.open(`https://www.google.com/maps/search/${query}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={`p-4 ${isDragging ? 'opacity-50 shadow-lg ring-2 ring-primary' : ''}`}
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <button aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
          className="mt-1 p-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing touch-none"
        >
          <GripVertical className="h-5 w-5" />
        </button>

        {/* Order Number */}
        <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0 mt-0.5">
          {index + 1}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-2 min-w-0">
          <h3 className="font-semibold truncate">{item.vendor_name}</h3>
          
          {/* Travel info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {item.travel_distance && (
              <div className="flex items-center gap-1.5">
                <Navigation className="h-3.5 w-3.5" />
                <span>{item.travel_distance}</span>
              </div>
            )}
            {item.travel_duration && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>{item.travel_duration}</span>
              </div>
            )}
          </div>

          {/* Address */}
          {item.vendor_address && (
            <div className="flex items-start gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span className="line-clamp-1">{item.vendor_address}</span>
            </div>
          )}

          {/* Arrival tips preview */}
          {item.arrival_tips && item.arrival_tips.length > 0 && (
            <p className="text-xs text-muted-foreground/80 italic line-clamp-1">
              {item.arrival_tips[0]}
            </p>
          )}

          {/* Saved date */}
          <p className="text-xs text-muted-foreground/60">
            Saved {format(new Date(item.created_at), 'MMM d, yyyy')}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={openInGoogleMaps}
            className="h-8 w-8"
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(item.id)}
            disabled={isDeleting}
            className="h-8 w-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
