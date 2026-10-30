import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/components/PageTransition";
import { 
  TripPlannerChatProvider, 
  useTripPlannerChatContext,
  ItineraryProvider 
} from "@/features/trip-planner/context";
import {
  ChatHeader,
  ChatMessageList,
  ChatInputArea,
  QuickActionsBar,
  ChatSuggestionPills,
  AuthPromptDialog,
  ItinerarySheet,
} from "@/features/trip-planner/components";
import { useItineraryContext } from "@/features/trip-planner/context/ItineraryContext";
import { detectConfirmedActivities } from "@/features/trip-planner/utils";

const AUTH_PROMPT_STORAGE_KEY = "tripPlannerAuthPromptShown";

function TripPlannerChatContent() {
  const { messages } = useTripPlannerChatContext();
  const { syncTripFromChat, addActivityToItinerary, itinerary } = useItineraryContext();
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [showItinerarySheet, setShowItinerarySheet] = useState(false);
  const hasMessages = messages.length > 1;
  const didAutoSyncTripRef = useRef(false);
  const processedMessagesRef = useRef<Set<string>>(new Set());

  // Only sync itinerary dates once we actually detect that dates were discussed/confirmed in chat
  useEffect(() => {
    if (didAutoSyncTripRef.current) return;

    const text = messages.map(m => m.content).join("\n");
    const hasDateRange = /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b\s*\d{1,2}\s*[-–]\s*\d{1,2}/i.test(text);
    const hasDuration = /\b\d+\s*(?:days?|nights?)\b/i.test(text);

    if (hasDateRange || hasDuration) {
      syncTripFromChat(messages);
      didAutoSyncTripRef.current = true;
    }
  }, [messages, syncTripFromChat]);

  // Auto-add confirmed activities from AI responses
  useEffect(() => {
    // Only process the last assistant message
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== "assistant") return;
    
    // Create a unique ID for this message to avoid re-processing
    const messageId = `${messages.length}-${lastMessage.content.slice(0, 100)}`;
    if (processedMessagesRef.current.has(messageId)) return;
    processedMessagesRef.current.add(messageId);
    
    // Detect confirmed activities in the AI response
    const confirmedActivities = detectConfirmedActivities(lastMessage.content);
    
    if (confirmedActivities.length === 0) return;
    
    // Check for duplicates against existing itinerary
    const existingTitles = new Set(
      itinerary?.days.flatMap(d => d.items.map(i => i.title.toLowerCase())) || []
    );
    
    for (const activity of confirmedActivities) {
      // Skip if already in itinerary
      if (existingTitles.has(activity.title.toLowerCase())) continue;
      
      // Add to itinerary
      addActivityToItinerary(
        {
          title: activity.title,
          description: "",
          category: activity.category,
          duration: activity.duration,
          location: activity.location,
          includes: activity.includes,
          whatToBring: activity.whatToBring,
        },
        activity.dayNumber ? activity.dayNumber - 1 : undefined,
        messages
      );
      
      // Show toast notification
      const dayLabel = activity.dayNumber ? ` to Day ${activity.dayNumber}` : "";
      toast.success(`${activity.title} added${dayLabel}`, {
        description: "Activity added to your itinerary",
        duration: 3000,
      });
      
      // Add to existing titles to prevent duplicates within same message
      existingTitles.add(activity.title.toLowerCase());
    }
  }, [messages, addActivityToItinerary, itinerary]);

  const handleAuthPromptSkip = () => {
    sessionStorage.setItem(AUTH_PROMPT_STORAGE_KEY, "true");
  };

  const handleAuthPromptClose = (open: boolean) => {
    setShowAuthPrompt(open);
    if (!open) {
      sessionStorage.setItem(AUTH_PROMPT_STORAGE_KEY, "true");
    }
  };

  const handleOpenItinerary = () => {
    setShowItinerarySheet(true);
  };

  return (
    <div className="relative w-full h-screen bg-background flex flex-col">
      <ChatHeader onOpenItinerary={handleOpenItinerary} />

      {/* Auth Prompt Dialog */}
      <AuthPromptDialog
        open={showAuthPrompt}
        onOpenChange={handleAuthPromptClose}
        onSkip={handleAuthPromptSkip}
      />

      {/* Itinerary Sheet */}
      <ItinerarySheet
        open={showItinerarySheet}
        onOpenChange={setShowItinerarySheet}
      />

      {!hasMessages ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold text-foreground">
              Hello, I'm JC!
            </h1>
            <p className="mt-2 text-muted-foreground">
              Discover amazing restaurants and excursions for your trip.
            </p>
          </div>

          <div className="w-full max-w-2xl">
            <ChatInputArea placeholder="Where are you planning to visit?" />
            <div className="mt-6">
              <QuickActionsBar />
            </div>
          </div>
        </div>
      ) : (
        <>
          <ChatMessageList onOpenItinerary={handleOpenItinerary} />
          <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border">
            <div className="max-w-2xl mx-auto px-3 py-2">
              {/* Chat-style suggestion pills instead of buttons */}
              <ChatSuggestionPills 
                className="mb-2" 
                onOpenItinerary={handleOpenItinerary}
              />
            </div>
            <ChatInputArea placeholder="Ask about restaurants or activities..." className="border-t-0 pt-0" />
          </div>
        </>
      )}
    </div>
  );
}

const TripPlannerChat = () => {
  return (
    <PageTransition>
      <TripPlannerChatProvider>
        <ItineraryProvider>
          <TripPlannerChatContent />
        </ItineraryProvider>
      </TripPlannerChatProvider>
    </PageTransition>
  );
};

export default TripPlannerChat;
