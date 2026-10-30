import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import { format, parseISO, differenceInDays } from "date-fns";
import { X, MapPin, Calendar, ChevronLeft, ChevronRight, Check, Share2, Pencil, GripHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SheetPortal, SheetOverlay } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ItineraryDaySchedule } from "./ItineraryDaySchedule";
import { EditableItineraryDaySchedule } from "./EditableItineraryDaySchedule";
import { ItinerarySkeleton } from "./ItinerarySkeleton";
import { RegenerateDialog, type RegenerateOption } from "./RegenerateDialog";
import { ShareItineraryDialog } from "./ShareItineraryDialog";
import { useItineraryContext } from "../context/ItineraryContext";
import { useTripPlannerChatContext } from "../context/TripPlannerChatContext";
import type { ItineraryDay } from "../types";
import { cn } from "@/lib/utils";
import * as SheetPrimitive from "@radix-ui/react-dialog";

// Day selector for navigating between days
function DaySelector({ 
  days, 
  selectedIndex, 
  onSelect 
}: { 
  days: ItineraryDay[]; 
  selectedIndex: number; 
  onSelect: (index: number) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {days.map((day, index) => {
        const isSelected = index === selectedIndex;
        let dayLabel = `Day ${index + 1}`;
        
        try {
          const date = parseISO(day.date);
          dayLabel = format(date, "EEE d");
        } catch {
          // Use default label
        }
        
        return (
          <button
            key={day.date}
            onClick={() => onSelect(index)}
            className={`
              flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all
              ${isSelected 
                ? "bg-primary text-primary-foreground shadow-md" 
                : "bg-muted text-muted-foreground hover:bg-muted/80"
              }
            `}
          >
            {dayLabel}
          </button>
        );
      })}
    </div>
  );
}

interface ItinerarySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Spring animation config for native feel
const springTransition = {
  type: "spring" as const,
  damping: 30,
  stiffness: 400,
};

export function ItinerarySheet({ open, onOpenChange }: ItinerarySheetProps) {
  const { messages } = useTripPlannerChatContext();
  const { 
    itinerary, 
    isGenerating,
    isSharing,
    hasUserEdits, 
    isConfirmed,
    shareUrl,
    syncTripFromChat,
    confirmItinerary,
    unconfirmItinerary,
    generateItineraryFromChat,
    generateShareLink,
    removeItem,
    updateDayItems,
    updateItem,
  } = useItineraryContext();
  
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [skeletonStep, setSkeletonStep] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [dragY, setDragY] = useState(0);
  const constraintsRef = useRef(null);
  const didSyncOnOpenRef = useRef(false);

  // When the sheet opens, sync destination/dates from chat ONLY (no auto-generation)
  // The user explicitly adds items via "Add to Itinerary" buttons in the chat
  useEffect(() => {
    if (!open) {
      didSyncOnOpenRef.current = false;
      return;
    }
    if (didSyncOnOpenRef.current) return;
    didSyncOnOpenRef.current = true;

    // Only sync destination + date range from conversation — do NOT auto-generate items
    // Items should only come from explicit "Add to Itinerary" actions in the chat
    syncTripFromChat(messages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Skeleton animation - properly managed in useEffect
  useEffect(() => {
    if (!isGenerating) {
      setSkeletonStep(0);
      return;
    }
    const interval = setInterval(() => {
      setSkeletonStep(prev => (prev < 3 ? prev + 1 : prev));
    }, 1500);
    const maxTimer = setTimeout(() => clearInterval(interval), 6000);
    return () => {
      clearInterval(interval);
      clearTimeout(maxTimer);
    };
  }, [isGenerating]);

  const handleRegenerateSelect = (option: RegenerateOption) => {
    if (option === null) {
      return;
    }
    generateItineraryFromChat(messages, option === "improve" ? "improve" : "full");
  };

  const handleGenerateShareLink = async () => {
    await generateShareLink();
  };

  const handleConfirmToggle = () => {
    if (isConfirmed) {
      unconfirmItinerary();
    } else {
      confirmItinerary();
    }
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    try {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      const days = differenceInDays(end, start) + 1;
      return `${format(start, "MMM d")} - ${format(end, "MMM d")} • ${days} days`;
    } catch {
      return "";
    }
  };

  // Handle drag-to-dismiss
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (info.offset.y > 200 || (info.offset.y > 100 && info.velocity.y > 500)) {
      onOpenChange(false);
    }
    setDragY(0);
  };

  // Loading state
  if (isGenerating) {
    return (
      <AnimatePresence>
        {open && (
          <SheetPrimitive.Root open={open} onOpenChange={onOpenChange}>
            <SheetPortal>
              <SheetOverlay />
              <SheetPrimitive.Content asChild forceMount>
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={springTransition}
                  className="fixed inset-x-0 bottom-0 z-50 h-[90vh] rounded-t-3xl bg-background p-0 flex flex-col shadow-2xl"
                >
                  <div className="flex-1 overflow-hidden">
                    <ItinerarySkeleton currentStep={skeletonStep} />
                  </div>
                </motion.div>
              </SheetPrimitive.Content>
            </SheetPortal>
          </SheetPrimitive.Root>
        )}
      </AnimatePresence>
    );
  }

  // Empty state
  if (!itinerary || !itinerary.days.length) {
    return (
      <AnimatePresence>
        {open && (
          <SheetPrimitive.Root open={open} onOpenChange={onOpenChange}>
            <SheetPortal>
              <SheetOverlay />
              <SheetPrimitive.Content asChild forceMount>
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={springTransition}
                  className="fixed inset-x-0 bottom-0 z-50 h-[90vh] rounded-t-3xl bg-background p-0 shadow-2xl"
                >
                  <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Calendar className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No Itinerary Yet</h3>
                    <p className="text-muted-foreground text-sm max-w-xs mb-6">
                      Chat with JC about your trip to generate a personalized itinerary.
                    </p>
                    <Button onClick={() => onOpenChange(false)}>
                      Back to Chat
                    </Button>
                  </div>
                </motion.div>
              </SheetPrimitive.Content>
            </SheetPortal>
          </SheetPrimitive.Root>
        )}
      </AnimatePresence>
    );
  }

  const currentDay = itinerary.days[selectedDayIndex];
  const canGoPrev = selectedDayIndex > 0;
  const canGoNext = selectedDayIndex < itinerary.days.length - 1;

  return (
    <AnimatePresence>
      {open && (
        <SheetPrimitive.Root open={open} onOpenChange={onOpenChange}>
          <SheetPortal>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-ink/80"
              onClick={() => onOpenChange(false)}
            />
            <SheetPrimitive.Content asChild forceMount>
              <motion.div
                ref={constraintsRef}
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={springTransition}
                drag={isEditMode ? false : "y"}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 0.5 }}
                onDragEnd={handleDragEnd}
                style={{ y: dragY }}
                className="fixed inset-x-0 bottom-0 z-50 h-[90vh] rounded-t-3xl bg-background p-0 flex flex-col shadow-2xl touch-none"
              >
                {/* Drag handle */}
                <motion.div 
                  className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="w-12 h-1.5 rounded-full bg-muted-foreground/40" />
                </motion.div>

                {/* Header */}
                <div className="px-4 pb-3 border-b border-border">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-left flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="font-semibold text-lg truncate">{itinerary.destination}</span>
                      </div>
                      {itinerary.startDate && itinerary.endDate && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDateRange(itinerary.startDate, itinerary.endDate)}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {/* Edit Mode Toggle */}
                      <Button
                        variant={isEditMode ? "default" : "ghost"}
                        size="icon"
                        className={cn("h-8 w-8", isEditMode && "bg-primary text-primary-foreground")}
                        onClick={() => setIsEditMode(!isEditMode)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onOpenChange(false)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Edit mode indicator */}
                  {isEditMode && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-2 flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary text-xs font-medium"
                    >
                      <GripHorizontal className="h-3.5 w-3.5" />
                      <span>Edit mode: Drag to reorder, tap to edit</span>
                    </motion.div>
                  )}

                  {/* Day selector */}
                  <div className="mt-3">
                    <DaySelector
                      days={itinerary.days}
                      selectedIndex={selectedDayIndex}
                      onSelect={setSelectedDayIndex}
                    />
                  </div>
                </div>

                {/* Content */}
                <ScrollArea className="flex-1 px-4 py-4">
                  <motion.div
                    key={`${selectedDayIndex}-${isEditMode}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {isEditMode ? (
                      <EditableItineraryDaySchedule
                        day={currentDay}
                        dayIndex={selectedDayIndex}
                        onUpdateItems={(items) => updateDayItems(selectedDayIndex, items)}
                        onUpdateItem={(itemIndex, updates) => updateItem(selectedDayIndex, itemIndex, updates)}
                        onRemoveItem={(itemIndex) => removeItem(selectedDayIndex, itemIndex)}
                      />
                    ) : (
                      <ItineraryDaySchedule
                        day={currentDay}
                        onRemoveItem={(itemIndex) => removeItem(selectedDayIndex, itemIndex)}
                      />
                    )}
                  </motion.div>
                </ScrollArea>

                {/* Day navigation */}
                <div className="flex items-center justify-between px-4 py-2 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDayIndex(prev => prev - 1)}
                    disabled={!canGoPrev}
                    className="gap-1"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Day {selectedDayIndex + 1} of {itinerary.days.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedDayIndex(prev => prev + 1)}
                    disabled={!canGoNext}
                    className="gap-1"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Footer actions */}
                <div className="flex gap-2 p-4 border-t border-border bg-background">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowRegenerateDialog(true)}
                  >
                    Regenerate
                  </Button>
                  {isConfirmed ? (
                    <Button
                      variant="outline"
                      className="flex-1 gap-2"
                      onClick={() => setShowShareDialog(true)}
                    >
                      <Share2 className="h-4 w-4" />
                      Share
                    </Button>
                  ) : (
                    <Button
                      className="flex-1 gap-2"
                      onClick={handleConfirmToggle}
                    >
                      <Check className="h-4 w-4" />
                      Confirm
                    </Button>
                  )}
                </div>

                {/* Dialogs */}
                <RegenerateDialog
                  open={showRegenerateDialog}
                  onOpenChange={setShowRegenerateDialog}
                  onSelect={handleRegenerateSelect}
                  hasUserEdits={hasUserEdits}
                />
                <ShareItineraryDialog
                  open={showShareDialog}
                  onOpenChange={setShowShareDialog}
                  isGenerating={isSharing}
                  shareUrl={shareUrl}
                  onGenerateLink={handleGenerateShareLink}
                  itineraryId={itinerary?.id}
                  isOwner={true}
                />
              </motion.div>
            </SheetPrimitive.Content>
          </SheetPortal>
        </SheetPrimitive.Root>
      )}
    </AnimatePresence>
  );
}
