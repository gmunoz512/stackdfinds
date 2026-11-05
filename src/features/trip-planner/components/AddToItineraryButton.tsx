import { useState, useCallback, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Check, Calendar } from "lucide-react";
import { useItineraryContext } from "../context/ItineraryContext";
import { useTripPlannerChatContext } from "../context/TripPlannerChatContext";
import type { ItineraryItemCategory } from "../types";

export interface ParsedActivity {
  title: string;
  description?: string;
  time?: string;
  duration?: string;
  category: ItineraryItemCategory;
  location?: string;
  includes?: string[];
  whatToBring?: string[];
  vendorId?: string;
  bookingLink?: string;
  travelInfo?: {
    distance?: string;
    travelTime?: string;
  };
}

interface AddToItineraryButtonProps {
  activity: ParsedActivity;
  variant?: "default" | "compact";
}

export const AddToItineraryButton = memo(function AddToItineraryButton({
  activity,
  variant = "default",
}: AddToItineraryButtonProps) {
  const { addActivityToItinerary, itinerary } = useItineraryContext();
  const { messages } = useTripPlannerChatContext();
  const [isAdded, setIsAdded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Check if this activity is already in the itinerary
  const isAlreadyAdded = itinerary?.days.some(day =>
    day.items.some(item => 
      item.title.toLowerCase() === activity.title.toLowerCase()
    )
  ) ?? false;

  const handleAdd = useCallback(() => {
    if (isAdded || isAlreadyAdded || isAnimating) return;

    setIsAnimating(true);
    // Pass messages so the itinerary can extract dates from chat
    addActivityToItinerary(activity, undefined, messages);
    
    // Show confirmation
    setTimeout(() => {
      setIsAdded(true);
      setIsAnimating(false);
    }, 300);
  }, [activity, addActivityToItinerary, messages, isAdded, isAlreadyAdded, isAnimating]);

  const showAdded = isAdded || isAlreadyAdded;

  if (variant === "compact") {
    return (
      <motion.button
        onClick={handleAdd}
        disabled={showAdded}
        className={`
          inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
          transition-all duration-200
          ${showAdded
            ? "bg-success/20 text-success-strong dark:text-success-light cursor-default"
            : "bg-primary/10 text-primary hover:bg-primary/20 active:scale-95"
          }
        `}
        whileTap={{ scale: showAdded ? 1 : 0.95 }}
      >
        <AnimatePresence mode="wait">
          {showAdded ? (
            <motion.span
              key="added"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center gap-1"
            >
              <Check className="h-3 w-3" />
              Added
            </motion.span>
          ) : (
            <motion.span
              key="add"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1"
            >
              <Plus className="h-3 w-3" />
              Add
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    );
  }

  return (
    <motion.button
      onClick={handleAdd}
      disabled={showAdded}
      className={`
        inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium
        transition-all duration-300 mt-2
        ${showAdded
          ? "bg-success/20 text-success-strong dark:text-success-light border border-success/30 cursor-default"
          : "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 hover:border-primary/40 active:scale-95"
        }
      `}
      whileTap={{ scale: showAdded ? 1 : 0.95 }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <AnimatePresence mode="wait">
        {showAdded ? (
          <motion.span
            key="added"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-2"
          >
            <Check className="h-4 w-4" />
            Added to itinerary
          </motion.span>
        ) : isAnimating ? (
          <motion.span
            key="adding"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.5, repeat: Infinity, ease: "linear" }}
            >
              <Calendar className="h-4 w-4" />
            </motion.div>
            Adding...
          </motion.span>
        ) : (
          <motion.span
            key="add"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add to itinerary
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
});
