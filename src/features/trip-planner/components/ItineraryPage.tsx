import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { format, parseISO, differenceInDays } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Sparkles,
  RefreshCw,
  Pencil,
  Check,
  X,
  Lock,
  Share2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { PageTransition } from "@/components/PageTransition";
import { useItineraryContext, type RegenerateMode } from "../context/ItineraryContext";
import { ItineraryDaySchedule } from "./ItineraryDaySchedule";
import { EditableItineraryDaySchedule } from "./EditableItineraryDaySchedule";
import { RegenerateDialog, type RegenerateOption } from "./RegenerateDialog";
import { ShareItineraryDialog } from "./ShareItineraryDialog";
import { ItinerarySkeleton } from "./ItinerarySkeleton";
import type { ItineraryDay, Message } from "../types";

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

// Props allow passing messages from parent (when chat context is available)
interface ItineraryPageProps {
  messages?: Message[];
}

export function ItineraryPage({ messages = [] }: ItineraryPageProps) {
  const navigate = useNavigate();
  const { 
    itinerary, 
    clearItinerary, 
    updateDayItems, 
    updateItem, 
    removeItem,
    generateItineraryFromChat,
    hasUserEdits,
    isGenerating,
    isConfirmed,
    isSharing,
    shareUrl,
    confirmItinerary,
    unconfirmItinerary,
    generateShareLink,
    generationError,
  } = useItineraryContext();

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showRegenerateDialog, setShowRegenerateDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [skeletonStep, setSkeletonStep] = useState(0);
  const skeletonIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Animate skeleton steps while generating
  useEffect(() => {
    if (isGenerating) {
      skeletonIntervalRef.current = setInterval(() => {
        setSkeletonStep(prev => (prev + 1) % 4);
      }, 2000);
    } else {
      if (skeletonIntervalRef.current) {
        clearInterval(skeletonIntervalRef.current);
        skeletonIntervalRef.current = null;
      }
      setSkeletonStep(0);
    }

    return () => {
      if (skeletonIntervalRef.current) {
        clearInterval(skeletonIntervalRef.current);
      }
    };
  }, [isGenerating]);

  const selectedDay = useMemo(() => {
    if (!itinerary || !itinerary.days.length) return null;
    return itinerary.days[selectedDayIndex] || itinerary.days[0];
  }, [itinerary, selectedDayIndex]);

  const handleBack = () => {
    // Navigate back to chat, preserving state
    navigate("/trip-planner");
  };

  const handleToggleEdit = () => {
    if (isConfirmed) return;
    setIsEditMode(!isEditMode);
  };

  const handleRegenerateClick = () => {
    if (isConfirmed) return;
    setShowRegenerateDialog(true);
  };

  const handleRegenerateSelect = (option: RegenerateOption) => {
    setShowRegenerateDialog(false);
    
    if (!option) return;

    if (messages.length > 0) {
      generateItineraryFromChat(messages, option as RegenerateMode);
    } else if (option === "full") {
      clearItinerary();
      navigate("/trip-planner");
    }
  };

  const handleConfirm = () => {
    confirmItinerary();
  };

  const handleUnlock = () => {
    unconfirmItinerary();
  };

  const handleShareClick = () => {
    setShowShareDialog(true);
  };

  const handleGenerateShareLink = async () => {
    await generateShareLink();
  };

  // Show skeleton while generating
  if (isGenerating) {
    return (
      <PageTransition>
        <ItinerarySkeleton currentStep={skeletonStep} />
      </PageTransition>
    );
  }

  // Empty state
  if (!itinerary) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
          <div className="w-full max-w-[430px] text-center rounded-2xl border border-border/80 bg-card p-8 shadow-sm">
            <div className="mx-auto w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
              <Calendar className="h-7 w-7 text-muted-foreground" />
            </div>
            <h2 className="text-xl mb-2">No itinerary yet</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Chat with JC to plan a trip, or build a weekend sample from published vendors.
            </p>
            {generationError && (
              <p className="text-sm text-destructive mb-4">
                {generationError.message}
              </p>
            )}
            <div className="flex flex-col gap-3">
              <Button className="rounded-full" onClick={() => navigate("/trip-planner")}>
                <Sparkles className="h-4 w-4 mr-2" />
                Start Planning
              </Button>
              <Button
                variant="outline"
                className="rounded-full"
                onClick={() => generateItineraryFromChat(messages, "full")}
              >
                Build weekend sample
              </Button>
            </div>
          </div>
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
            <Button variant="ghost" size="icon" onClick={handleBack}>
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
            {isConfirmed && (
              <span className="text-xs font-medium text-mint-strong bg-mint/10 px-2 py-1 rounded-full flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Confirmed
              </span>
            )}
            {isEditMode && !isConfirmed && (
              <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full">
                Editing
              </span>
            )}
            {hasUserEdits && !isEditMode && !isConfirmed && (
              <span className="text-xs font-medium text-success-strong bg-success/10 px-2 py-1 rounded-full">
                Customized
              </span>
            )}
          </div>

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
        <main className="flex-1 p-4 pb-24 overflow-y-auto">
          <AnimatePresence mode="wait">
            {selectedDay && (
              <motion.div
                key={`${selectedDay.date}-${isEditMode}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {isEditMode ? (
                  <EditableItineraryDaySchedule
                    day={selectedDay}
                    dayIndex={selectedDayIndex}
                    onUpdateItems={(items) => updateDayItems(selectedDayIndex, items)}
                    onUpdateItem={(itemIndex, updates) => updateItem(selectedDayIndex, itemIndex, updates)}
                    onRemoveItem={(itemIndex) => removeItem(selectedDayIndex, itemIndex)}
                  />
                ) : (
                  <ItineraryDaySchedule 
                    day={selectedDay} 
                    onEditItem={() => {
                      setIsEditMode(true);
                    }}
                    onRemoveItem={(itemIndex) => {
                      removeItem(selectedDayIndex, itemIndex);
                    }}
                  />
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Sticky Footer */}
        <footer className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 safe-area-bottom">
          <div className="flex gap-2 max-w-lg mx-auto">
            {isConfirmed ? (
              <>
                <Button variant="outline" className="flex-1" onClick={handleUnlock}>
                  <Lock className="h-4 w-4 mr-2" />
                  Unlock
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleShareClick}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
                <Button 
                  variant="default" 
                  className="flex-1"
                  onClick={() => navigate("/itinerary")}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  View Trip
                </Button>
              </>
            ) : isEditMode ? (
              <>
                <Button variant="outline" className="flex-1" onClick={handleToggleEdit}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button variant="default" className="flex-1" onClick={handleToggleEdit}>
                  <Check className="h-4 w-4 mr-2" />
                  Done Editing
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" className="flex-1" onClick={handleToggleEdit}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={handleRegenerateClick}
                  disabled={isGenerating}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isGenerating ? "animate-spin" : ""}`} />
                  {isGenerating ? "..." : "Regenerate"}
                </Button>
                <Button variant="default" className="flex-1" onClick={handleConfirm}>
                  <Check className="h-4 w-4 mr-2" />
                  Confirm
                </Button>
              </>
            )}
          </div>
        </footer>

        {/* Regenerate Confirmation Dialog */}
        <RegenerateDialog
          open={showRegenerateDialog}
          onOpenChange={setShowRegenerateDialog}
          onSelect={handleRegenerateSelect}
          hasUserEdits={hasUserEdits}
        />

        {/* Share Itinerary Dialog */}
        <ShareItineraryDialog
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
          shareUrl={shareUrl}
          isGenerating={isSharing}
          onGenerateLink={handleGenerateShareLink}
        />
      </div>
    </PageTransition>
  );
}
