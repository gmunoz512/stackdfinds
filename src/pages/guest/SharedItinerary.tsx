import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format, parseISO, differenceInDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { PageTransition } from "@/components/PageTransition";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Sparkles,
  Clock,
  Utensils,
  Bus,
  Coffee,
  ExternalLink,
  Pencil,
  Check,
  X,
  Trash2,
  Plus,
  LogIn,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Itinerary, ItineraryDay, ItineraryItem, ItineraryItemCategory, CollaboratorPermission } from "@/features/trip-planner/types";
import { EditPermissionBanner } from "@/features/trip-planner/components/EditPermissionBanner";
import { useItinerarySync, loadItineraryFromDatabase } from "@/features/trip-planner/hooks/useItinerarySync";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

// Category styling
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

// Editable Schedule Item Component
interface ScheduleItemProps {
  item: ItineraryItem;
  index: number;
  isLast: boolean;
  canEdit: boolean;
  onUpdate: (updates: Partial<ItineraryItem>) => void;
  onRemove: () => void;
}

function ScheduleItem({ item, index, isLast, canEdit, onUpdate, onRemove }: ScheduleItemProps) {
  const Icon = categoryIcons[item.category];
  const colorClass = categoryColors[item.category];
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(item.title);
  const [editedDescription, setEditedDescription] = useState(item.description);
  const [editedTime, setEditedTime] = useState(item.time);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleSave = () => {
    onUpdate({
      title: editedTitle,
      description: editedDescription,
      time: editedTime,
    });
    setIsEditing(false);
    toast.success("Activity updated");
  };

  const handleCancel = () => {
    setEditedTitle(item.title);
    setEditedDescription(item.description);
    setEditedTime(item.time);
    setIsEditing(false);
  };

  const handleDelete = () => {
    onRemove();
    setShowDeleteDialog(false);
    toast.success("Activity removed");
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.2 }}
        className="relative"
      >
        <div className="flex gap-4">
          {/* Timeline */}
          <div className="flex flex-col items-center">
            {isEditing ? (
              <Input
                type="time"
                value={editedTime}
                onChange={(e) => setEditedTime(e.target.value)}
                className="w-20 h-8 text-xs"
              />
            ) : (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted text-xs font-medium text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{item.time}</span>
              </div>
            )}
            
            <div className={`mt-3 w-10 h-10 rounded-full flex items-center justify-center border ${colorClass}`}>
              <Icon className="h-5 w-5" />
            </div>
            
            {!isLast && (
              <div className="w-px flex-1 min-h-[24px] bg-border mt-3" />
            )}
          </div>

          {/* Content Card */}
          <Card className="flex-1 p-4 mb-4 border-border/60">
            {isEditing ? (
              <div className="space-y-3">
                <Input
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  placeholder="Activity title"
                  className="font-semibold"
                />
                <Textarea
                  value={editedDescription}
                  onChange={(e) => setEditedDescription(e.target.value)}
                  placeholder="Description"
                  rows={2}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave}>
                    <Check className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancel}>
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-start justify-between">
                  <span className={`inline-flex items-center gap-1 text-xs font-medium mb-2 ${categoryColors[item.category].split(' ')[0]}`}>
                    {categoryLabels[item.category]}
                  </span>
                  
                  {canEdit && (
                    <div className="flex gap-1 -mt-1 -mr-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Edit itinerary"
                        className="h-7 w-7"
                        onClick={() => setIsEditing(true)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Delete itinerary"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => setShowDeleteDialog(true)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
                
                <h4 className="font-semibold text-foreground leading-tight">
                  {item.title}
                </h4>
                
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  {item.description}
                </p>

                {item.location && (
                  <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{item.location}</span>
                  </div>
                )}

                {item.bookingLink && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3 h-8 text-xs"
                    onClick={() => window.open(item.bookingLink, "_blank", "noopener,noreferrer")}
                  >
                    <ExternalLink className="h-3 w-3 mr-1.5" />
                    Book Now
                  </Button>
                )}
              </>
            )}
          </Card>
        </div>
      </motion.div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove activity?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove "{item.title}" from the itinerary. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Day Schedule Component
interface DayScheduleProps {
  day: ItineraryDay;
  dayIndex: number;
  canEdit: boolean;
  onUpdateItem: (itemIndex: number, updates: Partial<ItineraryItem>) => void;
  onRemoveItem: (itemIndex: number) => void;
  onAddItem: () => void;
}

function DaySchedule({ day, dayIndex, canEdit, onUpdateItem, onRemoveItem, onAddItem }: DayScheduleProps) {
  const formattedDate = (() => {
    try {
      return format(parseISO(day.date), "EEEE, MMMM d");
    } catch {
      return day.date;
    }
  })();

  if (!day.items || day.items.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg text-foreground">{day.title || `Day ${dayIndex + 1}`}</h3>
          <span className="text-sm text-muted-foreground">{formattedDate}</span>
        </div>

        <Card className="p-8 text-center border-dashed border-2 bg-muted/30">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <Coffee className="h-6 w-6 text-muted-foreground" />
          </div>
          <h4 className="font-medium text-foreground mb-1">Free Day</h4>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-4">
            No activities planned. Enjoy exploring on your own or relax!
          </p>
          {canEdit && (
            <Button variant="outline" size="sm" onClick={onAddItem}>
              <Plus className="h-4 w-4 mr-1" />
              Add Activity
            </Button>
          )}
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg text-foreground">{day.title || `Day ${dayIndex + 1}`}</h3>
        <span className="text-sm text-muted-foreground">{formattedDate}</span>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {day.items.length} {day.items.length === 1 ? "activity" : "activities"} planned
        </p>
        {canEdit && (
          <Button variant="ghost" size="sm" onClick={onAddItem}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        )}
      </div>

      <div className="pt-2">
        {day.items.map((item, index) => (
          <ScheduleItem
            key={`${item.time}-${item.title}-${index}`}
            item={item}
            index={index}
            isLast={index === day.items.length - 1}
            canEdit={canEdit}
            onUpdate={(updates) => onUpdateItem(index, updates)}
            onRemove={() => onRemoveItem(index)}
          />
        ))}
      </div>
    </div>
  );
}

// Day Selector Component
interface DaySelectorProps {
  days: ItineraryDay[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}

function DaySelector({ days, selectedIndex, onSelect }: DaySelectorProps) {
  return (
    <ScrollArea className="w-full">
      <div className="flex gap-2 p-1">
        {days.map((day, index) => {
          const isSelected = index === selectedIndex;
          let dateFormatted = { day: "", weekday: "", month: "" };

          try {
            const date = parseISO(day.date);
            dateFormatted = {
              weekday: format(date, "EEE"),
              day: format(date, "d"),
              month: format(date, "MMM"),
            };
          } catch {
            dateFormatted = { weekday: "Day", day: String(index + 1), month: "" };
          }

          return (
            <button
              key={day.date}
              onClick={() => onSelect(index)}
              className={`flex-shrink-0 flex flex-col items-center px-4 py-2 rounded-xl transition-all ${
                isSelected
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              <span className="text-xs font-medium uppercase">
                {dateFormatted.weekday}
              </span>
              <span className="text-lg font-bold">{dateFormatted.day}</span>
              <span className="text-[10px] opacity-80">{dateFormatted.month}</span>
            </button>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}

function formatDateRange(startDate: string, endDate: string): string {
  try {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const days = differenceInDays(end, start) + 1;
    return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")} • ${days} days`;
  } catch {
    return `${startDate} - ${endDate}`;
  }
}

export default function SharedItinerary() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [permission, setPermission] = useState<"owner" | CollaboratorPermission | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);

  // Handle remote changes from realtime
  const handleRemoteChange = useCallback((remoteItinerary: Itinerary) => {
    setItinerary(remoteItinerary);
    toast.info("Itinerary updated by collaborator");
  }, []);

  // Realtime sync
  const { pushChanges, isSyncing, isConnected } = useItinerarySync({
    itineraryId: itinerary?.id || null,
    permission,
    onRemoteChange: handleRemoteChange,
    debounceMs: 1500,
  });

  // Fetch itinerary on mount
  useEffect(() => {
    const fetchSharedItinerary = async () => {
      if (!token) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      // Check authentication status
      const { data: { user } } = await supabase.auth.getUser();
      setIsGuest(!user);

      // First try the new itineraries table
      const { itinerary: loadedItinerary, permission: loadedPermission, error } = 
        await loadItineraryFromDatabase(token, true);

      if (loadedItinerary && !error) {
        setItinerary(loadedItinerary);
        setPermission(loadedPermission);
        setIsLoading(false);
        return;
      }

      // Fallback to legacy shared_itineraries table
      const { data: sharedData, error: sharedError } = await supabase
        .from('shared_itineraries')
        .select('*')
        .eq('share_token', token)
        .eq('is_public', true)
        .maybeSingle();

      if (sharedError || !sharedData) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const storedData = sharedData as any;
      
      if (storedData.itinerary_data) {
        setItinerary(storedData.itinerary_data as Itinerary);
        setPermission("viewer"); // Legacy shares are view-only
      } else {
        setItinerary({
          id: sharedData.id,
          destination: storedData.destination || sharedData.title?.replace('Trip to ', '') || 'Unknown',
          startDate: storedData.start_date || new Date().toISOString().split('T')[0],
          endDate: storedData.end_date || new Date().toISOString().split('T')[0],
          days: [],
          isConfirmed: true,
        });
        setPermission("viewer");
      }

      setIsLoading(false);
    };

    fetchSharedItinerary();
  }, [token]);

  // Save changes to localStorage for guests
  useEffect(() => {
    if (isGuest && itinerary && token) {
      localStorage.setItem(`shared_itinerary_${token}`, JSON.stringify(itinerary));
    }
  }, [itinerary, isGuest, token]);

  const canEdit = permission === "owner" || permission === "editor";

  const selectedDay = useMemo(() => {
    if (!itinerary || !itinerary.days.length) return null;
    return itinerary.days[selectedDayIndex] || itinerary.days[0];
  }, [itinerary, selectedDayIndex]);

  const handleBack = () => {
    navigate('/');
  };

  const handleUpdateItem = useCallback((dayIndex: number, itemIndex: number, updates: Partial<ItineraryItem>) => {
    setItinerary(prev => {
      if (!prev) return prev;
      const newDays = [...prev.days];
      if (newDays[dayIndex] && newDays[dayIndex].items[itemIndex]) {
        const newItems = [...newDays[dayIndex].items];
        newItems[itemIndex] = { ...newItems[itemIndex], ...updates, isUserEdited: true };
        newDays[dayIndex] = { ...newDays[dayIndex], items: newItems };
      }
      const updated = { ...prev, days: newDays };
      
      // Push to database if authenticated
      if (!isGuest) {
        pushChanges(updated);
      }
      
      return updated;
    });
  }, [isGuest, pushChanges]);

  const handleRemoveItem = useCallback((dayIndex: number, itemIndex: number) => {
    setItinerary(prev => {
      if (!prev) return prev;
      const newDays = [...prev.days];
      if (newDays[dayIndex]) {
        const newItems = newDays[dayIndex].items.filter((_, idx) => idx !== itemIndex);
        newDays[dayIndex] = { ...newDays[dayIndex], items: newItems };
      }
      const updated = { ...prev, days: newDays };
      
      if (!isGuest) {
        pushChanges(updated);
      }
      
      return updated;
    });
  }, [isGuest, pushChanges]);

  const handleAddItem = useCallback((dayIndex: number) => {
    const newItem: ItineraryItem = {
      id: crypto.randomUUID(),
      time: "12:00",
      title: "New Activity",
      description: "Add a description for this activity",
      category: "activity",
      isUserEdited: true,
    };

    setItinerary(prev => {
      if (!prev) return prev;
      const newDays = [...prev.days];
      if (newDays[dayIndex]) {
        newDays[dayIndex] = {
          ...newDays[dayIndex],
          items: [...newDays[dayIndex].items, newItem].sort((a, b) => a.time.localeCompare(b.time)),
        };
      }
      const updated = { ...prev, days: newDays };
      
      if (!isGuest) {
        pushChanges(updated);
      }
      
      return updated;
    });
    
    toast.success("Activity added - click to edit");
  }, [isGuest, pushChanges]);

  const handleSignInToSave = () => {
    // Save current state to localStorage before redirecting
    if (itinerary && token) {
      localStorage.setItem(`shared_itinerary_${token}`, JSON.stringify(itinerary));
    }
    navigate('/auth', { state: { returnTo: `/shared/${token}` } });
  };

  if (notFound) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
          <Calendar className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Itinerary not found</h2>
          <p className="text-muted-foreground mb-6 text-center">
            This itinerary may have been removed or the link is invalid.
          </p>
          <Button onClick={() => navigate('/')}>
            Go Home
          </Button>
        </div>
      </PageTransition>
    );
  }

  if (isLoading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-6 w-48" />
            <div className="w-10" />
          </div>
          <div className="p-4 space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </PageTransition>
    );
  }

  if (!itinerary || itinerary.days.length === 0) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
          <Calendar className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No itinerary details</h2>
          <p className="text-muted-foreground mb-6 text-center">
            This itinerary doesn't have any scheduled activities yet.
          </p>
          <Button onClick={() => navigate('/trip-planner')}>
            <Sparkles className="h-4 w-4 mr-2" />
            Plan Your Own Trip
          </Button>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center gap-3 p-4">
            <Button variant="ghost" size="icon" aria-label="Go back" onClick={handleBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold truncate flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                {itinerary.destination}
              </h1>
              <p className="text-xs text-muted-foreground">
                {formatDateRange(itinerary.startDate, itinerary.endDate)}
              </p>
            </div>
          </div>

          {/* Permission Banner */}
          {permission && (
            <div className="px-4 pb-2">
              <EditPermissionBanner
                permission={permission}
                isConnected={isConnected}
                isSyncing={isSyncing}
                isGuest={isGuest}
              />
            </div>
          )}

          {/* Day Selector */}
          <div className="px-4 pb-3">
            <DaySelector
              days={itinerary.days}
              selectedIndex={selectedDayIndex}
              onSelect={setSelectedDayIndex}
            />
          </div>
        </header>

        {/* Day Schedule */}
        <main className="flex-1 p-4 pb-32 overflow-y-auto">
          <AnimatePresence mode="wait">
            {selectedDay && (
              <motion.div
                key={selectedDay.date}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <DaySchedule
                  day={selectedDay}
                  dayIndex={selectedDayIndex}
                  canEdit={canEdit}
                  onUpdateItem={(itemIndex, updates) => handleUpdateItem(selectedDayIndex, itemIndex, updates)}
                  onRemoveItem={(itemIndex) => handleRemoveItem(selectedDayIndex, itemIndex)}
                  onAddItem={() => handleAddItem(selectedDayIndex)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Footer CTA */}
        <footer className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 safe-area-bottom">
          <div className="max-w-lg mx-auto">
            {isGuest && canEdit ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center">
                  Sign in to save your changes permanently
                </p>
                <Button onClick={handleSignInToSave} className="w-full">
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In to Save
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  Want to plan your own trip?
                </p>
                <Button onClick={() => navigate('/trip-planner')} className="w-full">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Start Planning
                </Button>
              </div>
            )}
          </div>
        </footer>
      </div>
    </PageTransition>
  );
}
