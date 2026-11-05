import { ItineraryProvider, TripPlannerChatProvider, useTripPlannerChatContext } from "@/features/trip-planner/context";
import { ItineraryPage } from "@/features/trip-planner/components";

// Inner component that can access chat context
function TripItineraryInner() {
  const { messages } = useTripPlannerChatContext();
  return <ItineraryPage messages={messages} />;
}

export default function TripItinerary() {
  return (
    <TripPlannerChatProvider>
      <ItineraryProvider>
        <TripItineraryInner />
      </ItineraryProvider>
    </TripPlannerChatProvider>
  );
}
