import { useMemo, useCallback, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Sparkles, Home, MapPin, Utensils, Calendar, Wand2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { useTripPlannerChatContext } from "../context/TripPlannerChatContext";
import { useItineraryContext } from "../context/ItineraryContext";

interface SuggestionPill {
  icon: React.ReactNode;
  label: string;
  prompt?: string;
  action?: "openItinerary" | "shareItinerary";
  variant?: "primary" | "secondary";
}

// Detect if AI has confirmed the itinerary is complete
function detectItineraryComplete(messages: Array<{ role: string; content: string }>): boolean {
  const lastAssistantMessages = messages
    .filter(m => m.role === "assistant")
    .slice(-2);
  
  const combinedText = lastAssistantMessages.map(m => m.content.toLowerCase()).join(" ");
  
  const completionPatterns = [
    /itinerary\s+(?:is\s+)?(?:ready|complete|finished|all\s+set)/i,
    /(?:your|the)\s+(?:trip|plan)\s+(?:is\s+)?(?:ready|complete|all\s+set)/i,
    /(?:finalized|wrapped\s+up)\s+(?:your|the)\s+(?:itinerary|plan)/i,
    /here(?:'s|\s+is)\s+your\s+(?:complete|full|final)\s+itinerary/i,
    /(?:everything|all)\s+(?:is\s+)?planned\s+(?:out|for\s+you)/i,
  ];
  
  return completionPatterns.some(pattern => pattern.test(combinedText));
}

// Context-aware suggestions based on conversation state
function getSuggestions(
  messageCount: number,
  hasItineraryItems: boolean,
  _hasDestination: boolean,
  isItineraryComplete: boolean
): SuggestionPill[] {
  // Initial state - conversational prompts
  if (messageCount <= 2) {
    return [
      {
        icon: <Sparkles className="h-3.5 w-3.5" />,
        label: "Suggest activities",
        prompt: "What are the top activities you'd recommend for my trip? Show me 2-3 great options with full details.",
        variant: "primary",
      },
      {
        icon: <Home className="h-3.5 w-3.5" />,
        label: "Host's favorites",
        prompt: "Show me my host's favorite experiences. I'd like to see what they recommend for guests.",
        variant: "secondary",
      },
    ];
  }

  const suggestions: SuggestionPill[] = [];

  // If itinerary is complete and has items, show share option prominently
  if (isItineraryComplete && hasItineraryItems) {
    suggestions.push({
      icon: <Share2 className="h-3.5 w-3.5" />,
      label: "Generate shareable itinerary",
      action: "shareItinerary",
      variant: "primary",
    });
  }

  // If user has items in itinerary, show view option
  if (hasItineraryItems) {
    suggestions.push({
      icon: <Calendar className="h-3.5 w-3.5" />,
      label: "View itinerary",
      action: "openItinerary",
      variant: isItineraryComplete ? "secondary" : "primary",
    });
  }

  // More discovery suggestions
  suggestions.push({
    icon: <Sparkles className="h-3.5 w-3.5" />,
    label: "More activities",
    prompt: "Show me more activity options with full details. What else do you recommend?",
    variant: hasItineraryItems ? "secondary" : "primary",
  });

  suggestions.push({
    icon: <Utensils className="h-3.5 w-3.5" />,
    label: "Best restaurants",
    prompt: "What are the must-try restaurants? Show me 2-3 top picks with details.",
  });

  suggestions.push({
    icon: <MapPin className="h-3.5 w-3.5" />,
    label: "Hidden gems",
    prompt: "What hidden gems should I not miss? Show me unique local experiences.",
  });

  return suggestions;
}

// Destination detection from messages
function detectDestination(messages: Array<{ role: string; content: string }>): string | null {
  const assistantMessages = messages.filter(m => m.role === "assistant");
  const combinedText = assistantMessages.map(m => m.content).join(" ");
  
  const patterns = [
    /(?:welcome to|visiting|trip to|traveling to|in)\s+([A-Z][a-zA-Z\s]+?)(?:\.|,|!|\?|$)/i,
    /\b(Tulum|Cancun|Playa del Carmen|Mexico|Miami|Paris|London|Tokyo|New York|Barcelona)\b/i,
  ];
  
  for (const pattern of patterns) {
    const match = combinedText.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }
  
  return null;
}

interface ChatSuggestionPillsProps {
  className?: string;
  onOpenItinerary?: () => void;
}

export function ChatSuggestionPills({ className, onOpenItinerary }: ChatSuggestionPillsProps) {
  const { messages, sendMessage, isLoading } = useTripPlannerChatContext();
  const { 
    itinerary, 
    generateItineraryFromChat, 
    isGenerating, 
    generationError,
    confirmItinerary,
    generateShareLink,
    isSharing,
  } = useItineraryContext();
  
  const detectedDestination = useMemo(() => detectDestination(messages), [messages]);
  const isItineraryComplete = useMemo(() => detectItineraryComplete(messages), [messages]);
  const hasItineraryItems = itinerary?.days.some(day => day.items.length > 0) ?? false;
  const hasDestination = !!detectedDestination;
  
  // Track if we triggered the build to show toast on completion
  const didTriggerBuildRef = useRef(false);
  const wasGeneratingRef = useRef(false);

  // Show toast when generation completes successfully after "Build itinerary now"
  useEffect(() => {
    if (wasGeneratingRef.current && !isGenerating && didTriggerBuildRef.current) {
      didTriggerBuildRef.current = false;
      if (generationError) {
        toast.error("Failed to generate itinerary", {
          description: generationError.message || "Something went wrong. Please try again.",
          action: generationError.retryable ? {
            label: "Retry",
            onClick: () => {
              didTriggerBuildRef.current = true;
              generateItineraryFromChat(messages, "full");
            },
          } : undefined,
        });
      } else {
        toast.success("Itinerary generated!", {
          description: "Your trip plan is ready to view and customize.",
        });
      }
    }
    wasGeneratingRef.current = isGenerating;
  }, [isGenerating, generationError, generateItineraryFromChat, messages]);
  
  const suggestions = useMemo(() => {
    return getSuggestions(messages.length, hasItineraryItems, hasDestination, isItineraryComplete);
  }, [messages.length, hasItineraryItems, hasDestination, isItineraryComplete]);

  const handleClick = useCallback(async (suggestion: SuggestionPill) => {
    if (isLoading || isGenerating || isSharing) return;
    
    // Handle "Generate shareable itinerary" action
    if (suggestion.action === "shareItinerary") {
      // First confirm the itinerary, then generate share link
      confirmItinerary();
      try {
        const shareUrl = await generateShareLink();
        if (!shareUrl) {
          toast.error("Failed to generate share link", {
            description: "Build an itinerary first, then try again.",
          });
          return;
        }
        toast.success("Shareable link generated!", {
          description: "Your itinerary is now ready to share.",
        });
        // Open the itinerary sheet to show the share options
        onOpenItinerary?.();
      } catch {
        toast.error("Failed to generate share link", {
          description: "Please try again.",
        });
      }
      return;
    }
    
    // Handle view itinerary action
    if (suggestion.action === "openItinerary" && onOpenItinerary) {
      onOpenItinerary();
      return;
    }
    
    // Send the conversational prompt
    if (suggestion.prompt) {
      sendMessage(suggestion.prompt);
    }
  }, [isLoading, isGenerating, isSharing, sendMessage, onOpenItinerary, generateItineraryFromChat, messages, confirmItinerary, generateShareLink]);

  // Only show after some conversation
  const userMessageCount = messages.filter(m => m.role === "user").length;
  if (userMessageCount < 1) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex flex-wrap gap-2 justify-center ${className ?? ""}`}
    >
      {suggestions.slice(0, 4).map((suggestion, index) => (
        <motion.button
          key={suggestion.label}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => handleClick(suggestion)}
          disabled={isLoading}
          className={`
            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
            transition-all duration-200 disabled:opacity-50
            ${suggestion.variant === "primary"
              ? "bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 hover:border-primary/40"
              : "bg-muted/50 text-muted-foreground border border-border hover:bg-muted hover:text-foreground"
            }
          `}
        >
          {suggestion.icon}
          <span>{suggestion.label}</span>
        </motion.button>
      ))}
    </motion.div>
  );
}
