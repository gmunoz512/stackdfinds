import { useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTripPlannerChatContext } from "../context/TripPlannerChatContext";
import { useItineraryContext } from "../context/ItineraryContext";

// Destination detection patterns
const DESTINATION_PATTERNS = [
  /(?:welcome to|visiting|trip to|traveling to|in)\s+([A-Z][a-zA-Z\s]+?)(?:\.|,|!|\?|$)/i,
  /([A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+)?)\s+(?:is|has|offers|features)/,
  /\b(Tulum|Cancun|Playa del Carmen|Mexico|Miami|Paris|London|Tokyo|New York|Barcelona)\b/i,
];

function detectDestination(text: string): boolean {
  return DESTINATION_PATTERNS.some(pattern => pattern.test(text));
}

export function CreateItineraryButton() {
  const navigate = useNavigate();
  const { messages } = useTripPlannerChatContext();
  const { isGenerating, itinerary, generateItineraryFromChat } = useItineraryContext();
  const wasGenerating = useRef(false);

  // Check if button should be visible
  const shouldShow = useMemo(() => {
    const assistantMessages = messages.filter(m => m.role === "assistant");
    
    // Need at least 3 assistant messages
    if (assistantMessages.length < 3) {
      return false;
    }
    
    // Check if destination is detected in any assistant message
    const combinedText = assistantMessages.map(m => m.content).join(" ");
    return detectDestination(combinedText);
  }, [messages]);

  // Navigate when generation completes
  useEffect(() => {
    if (wasGenerating.current && !isGenerating && itinerary) {
      navigate("/trip-planner/itinerary");
    }
    wasGenerating.current = isGenerating;
  }, [isGenerating, itinerary, navigate]);

  const handleClick = () => {
    if (!isGenerating) {
      generateItineraryFromChat(messages);
    }
  };

  if (!shouldShow) {
    return null;
  }

  return (
    <Button
      variant="outline"
      onClick={handleClick}
      disabled={isGenerating}
      aria-label="Create itinerary from chat"
      className="flex items-center gap-2 rounded-full border-primary/30 bg-primary/5 text-primary hover:bg-primary/10 hover:border-primary/50 transition-colors"
    >
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm font-medium">Creating...</span>
        </>
      ) : (
        <>
          <CalendarPlus className="h-4 w-4" />
          <span className="text-sm font-medium">Create Itinerary</span>
        </>
      )}
    </Button>
  );
}
