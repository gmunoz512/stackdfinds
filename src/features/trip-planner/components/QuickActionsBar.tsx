import { ReactNode, useCallback } from "react";
import {
  Utensils,
  MapPin,
  Compass,
  Waves,
} from "lucide-react";
import { ChatQuickAction } from "./QuickAction";
import { useTripPlannerChatContext } from "../context";

export interface QuickActionItem {
  icon: ReactNode;
  label: string;
  prompt: string;
}

const DEFAULT_ACTIONS: QuickActionItem[] = [
  { icon: <Utensils className="w-4 h-4" />, label: "Top Restaurants", prompt: "What are the best restaurants to try?" },
  { icon: <Compass className="w-4 h-4" />, label: "Best Excursions", prompt: "What excursions and activities do you recommend?" },
  { icon: <MapPin className="w-4 h-4" />, label: "Hidden Gems", prompt: "What hidden gems should I know about?" },
  { icon: <Waves className="w-4 h-4" />, label: "Beach Activities", prompt: "What beach activities are available?" },
];

interface QuickActionsBarProps {
  /** Custom actions to display instead of defaults */
  actions?: QuickActionItem[];
  /** Additional CSS classes */
  className?: string;
}

export function QuickActionsBar({ actions = DEFAULT_ACTIONS, className }: QuickActionsBarProps) {
  const { messages, sendMessage, isLoading } = useTripPlannerChatContext();

  const handleQuickAction = useCallback((prompt: string) => {
    if (!isLoading) {
      sendMessage(prompt);
    }
  }, [isLoading, sendMessage]);

  // Hide once user sends their first message
  const hasUserMessage = messages.some(m => m.role === "user");
  if (hasUserMessage) {
    return null;
  }

  return (
    <nav 
      className={`flex items-center justify-center flex-wrap gap-2 ${className ?? ""}`}
      aria-label="Quick action suggestions"
    >
      {actions.map((action) => (
        <ChatQuickAction
          key={action.label}
          icon={action.icon}
          label={action.label}
          onAction={() => handleQuickAction(action.prompt)}
          disabled={isLoading}
        />
      ))}
    </nav>
  );
}
