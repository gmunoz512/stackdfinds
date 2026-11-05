import { useState } from "react";
import { format, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { formatTo12Hour } from "../utils/formatTime";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  MapPin,
  Clock,
  Utensils,
  Bus,
  Sparkles,
  Coffee,
  GripVertical,
  Trash2,
  Check,
  X,
  ChevronDown,
  Plus,
  Backpack,
  CheckCircle2,
  Navigation,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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

interface EditableItemProps {
  item: ItineraryItem;
  index: number;
  onUpdate: (updates: Partial<ItineraryItem>) => void;
  onRemove: () => void;
}

function EditableItem({ item, index, onUpdate, onRemove }: EditableItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);
  const [editDescription, setEditDescription] = useState(item.description);
  const [editDuration, setEditDuration] = useState(item.duration || "");
  const [editIncludes, setEditIncludes] = useState(item.includes?.join(", ") || "");
  const [editWhatToBring, setEditWhatToBring] = useState(item.whatToBring?.join(", ") || "");
  const [editDistanceFromPrevious, setEditDistanceFromPrevious] = useState(item.distanceFromPrevious || "");
  const [editTravelTimeFromPrevious, setEditTravelTimeFromPrevious] = useState(item.travelTimeFromPrevious || "");
  const [editDistanceToNext, setEditDistanceToNext] = useState(item.distanceToNext || "");
  const [editTravelTimeToNext, setEditTravelTimeToNext] = useState(item.travelTimeToNext || "");

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `${index}-${item.title}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = categoryIcons[item.category];
  const colorClass = categoryColors[item.category];

  const parseListString = (str: string): string[] => {
    return str
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  };

  const handleSave = () => {
    onUpdate({
      title: editTitle,
      description: editDescription,
      duration: editDuration || undefined,
      includes: parseListString(editIncludes),
      whatToBring: parseListString(editWhatToBring),
      distanceFromPrevious: editDistanceFromPrevious || undefined,
      travelTimeFromPrevious: editTravelTimeFromPrevious || undefined,
      distanceToNext: editDistanceToNext || undefined,
      travelTimeToNext: editTravelTimeToNext || undefined,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditTitle(item.title);
    setEditDescription(item.description);
    setEditDuration(item.duration || "");
    setEditIncludes(item.includes?.join(", ") || "");
    setEditWhatToBring(item.whatToBring?.join(", ") || "");
    setEditDistanceFromPrevious(item.distanceFromPrevious || "");
    setEditTravelTimeFromPrevious(item.travelTimeFromPrevious || "");
    setEditDistanceToNext(item.distanceToNext || "");
    setEditTravelTimeToNext(item.travelTimeToNext || "");
    setIsEditing(false);
  };

  const hasDetails =
    (item.includes && item.includes.length > 0) ||
    (item.whatToBring && item.whatToBring.length > 0) ||
    item.distanceFromPrevious ||
    item.distanceToNext;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <Card className={`p-3 border-border/60 ${isDragging ? "shadow-lg ring-2 ring-primary/20" : ""}`}>
        <div className="flex gap-3">
          {/* Drag Handle */}
          <div
            {...attributes}
            {...listeners}
            className="flex-shrink-0 flex items-center cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
          >
            <GripVertical className="h-5 w-5" />
          </div>

          {/* Time & Icon */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-muted text-xs font-medium text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{formatTo12Hour(item.time)}</span>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${colorClass}`}>
              <Icon className="h-4 w-4" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="space-y-3">
                {/* Basic Info */}
                <div className="space-y-2">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Title"
                    className="h-8 text-sm"
                    autoFocus
                  />
                  <Textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="Description"
                    className="text-sm min-h-[60px] resize-none"
                  />
                  <Input
                    value={editDuration}
                    onChange={(e) => setEditDuration(e.target.value)}
                    placeholder="Duration (e.g., 2 hours)"
                    className="h-8 text-sm"
                  />
                </div>

                {/* Details Section */}
                <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full justify-between h-7 text-xs">
                      <span>Edit Details (includes, what to bring, travel)</span>
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isDetailsOpen ? "rotate-180" : ""}`} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <AnimatePresence>
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 pt-3"
                      >
                        {/* What's Included */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                            <span>What's Included (comma-separated)</span>
                          </div>
                          <Textarea
                            value={editIncludes}
                            onChange={(e) => setEditIncludes(e.target.value)}
                            placeholder="e.g., Equipment rental, Guide, Snacks"
                            className="text-xs min-h-[50px] resize-none"
                          />
                        </div>

                        {/* What to Bring */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-medium">
                            <Backpack className="h-3.5 w-3.5 text-info" />
                            <span>What to Bring (comma-separated)</span>
                          </div>
                          <Textarea
                            value={editWhatToBring}
                            onChange={(e) => setEditWhatToBring(e.target.value)}
                            placeholder="e.g., Sunscreen, Comfortable shoes, Water"
                            className="text-xs min-h-[50px] resize-none"
                          />
                        </div>

                        {/* Travel Info */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-medium">
                            <Navigation className="h-3.5 w-3.5 text-primary" />
                            <span>Travel Info</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              value={editDistanceFromPrevious}
                              onChange={(e) => setEditDistanceFromPrevious(e.target.value)}
                              placeholder="Distance from prev (e.g., 5 km)"
                              className="h-7 text-xs"
                            />
                            <Input
                              value={editTravelTimeFromPrevious}
                              onChange={(e) => setEditTravelTimeFromPrevious(e.target.value)}
                              placeholder="Time from prev (e.g., 15 min)"
                              className="h-7 text-xs"
                            />
                            <Input
                              value={editDistanceToNext}
                              onChange={(e) => setEditDistanceToNext(e.target.value)}
                              placeholder="Distance to next (e.g., 3 km)"
                              className="h-7 text-xs"
                            />
                            <Input
                              value={editTravelTimeToNext}
                              onChange={(e) => setEditTravelTimeToNext(e.target.value)}
                              placeholder="Time to next (e.g., 10 min)"
                              className="h-7 text-xs"
                            />
                          </div>
                        </div>
                      </motion.div>
                    </AnimatePresence>
                  </CollapsibleContent>
                </Collapsible>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button size="sm" variant="default" onClick={handleSave} className="h-7 text-xs">
                    <Check className="h-3 w-3 mr-1" />
                    Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={handleCancel} className="h-7 text-xs">
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => setIsEditing(true)}
                className="cursor-pointer hover:bg-muted/50 rounded p-1 -m-1 transition-colors"
              >
                <h4 className="font-semibold text-foreground text-sm leading-tight truncate">
                  {item.title}
                </h4>
                {item.duration && (
                  <Badge variant="secondary" className="mt-1 text-[10px] h-5">
                    <Timer className="h-2.5 w-2.5 mr-1" />
                    {item.duration}
                  </Badge>
                )}
                {item.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {item.description}
                  </p>
                )}
                {item.location && (
                  <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{item.location}</span>
                  </div>
                )}
                {/* Quick details preview */}
                {hasDetails && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.includes && item.includes.length > 0 && (
                      <Badge variant="outline" className="text-[10px] h-5 gap-1">
                        <CheckCircle2 className="h-2.5 w-2.5 text-success" />
                        {item.includes.length} included
                      </Badge>
                    )}
                    {item.whatToBring && item.whatToBring.length > 0 && (
                      <Badge variant="outline" className="text-[10px] h-5 gap-1">
                        <Backpack className="h-2.5 w-2.5 text-info" />
                        {item.whatToBring.length} to bring
                      </Badge>
                    )}
                    {item.distanceFromPrevious && (
                      <Badge variant="outline" className="text-[10px] h-5 gap-1">
                        <Navigation className="h-2.5 w-2.5" />
                        {item.distanceFromPrevious}
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Delete Button with Confirmation */}
          {!isEditing && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive flex-shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove activity?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove "{item.title}" from your itinerary. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onRemove}>Remove</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

interface EditableItineraryDayScheduleProps {
  day: ItineraryDay;
  dayIndex: number;
  onUpdateItems: (items: ItineraryItem[]) => void;
  onUpdateItem: (itemIndex: number, updates: Partial<ItineraryItem>) => void;
  onRemoveItem: (itemIndex: number) => void;
}

export function EditableItineraryDaySchedule({
  day,
  dayIndex,
  onUpdateItems,
  onUpdateItem,
  onRemoveItem,
}: EditableItineraryDayScheduleProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const formattedDate = (() => {
    try {
      return format(parseISO(day.date), "EEEE, MMMM d");
    } catch {
      return day.date;
    }
  })();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = day.items.findIndex((_, idx) => `${idx}-${day.items[idx].title}` === active.id);
      const newIndex = day.items.findIndex((_, idx) => `${idx}-${day.items[idx].title}` === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newItems = arrayMove(day.items, oldIndex, newIndex);
        onUpdateItems(newItems);
      }
    }
  };

  // Empty state
  if (!day.items || day.items.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg text-foreground">{day.title}</h3>
          <span className="text-sm text-muted-foreground">{formattedDate}</span>
        </div>
        <Card className="p-8 text-center border-dashed border-2 bg-muted/30">
          <Coffee className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
          <p className="text-sm text-muted-foreground">No activities for this day</p>
        </Card>
      </div>
    );
  }

  const sortableIds = day.items.map((item, idx) => `${idx}-${item.title}`);

  return (
    <div className="space-y-4">
      {/* Day header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg text-foreground">{day.title}</h3>
        <span className="text-sm text-muted-foreground">{formattedDate}</span>
      </div>

      <p className="text-xs text-muted-foreground">
        Drag to reorder • Tap to edit • {day.items.length} {day.items.length === 1 ? "item" : "items"}
      </p>

      {/* Sortable items */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {day.items.map((item, index) => (
              <EditableItem
                key={`${index}-${item.title}`}
                item={item}
                index={index}
                onUpdate={(updates) => onUpdateItem(index, updates)}
                onRemove={() => onRemoveItem(index)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
