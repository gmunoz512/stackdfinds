import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Sparkles,
  RotateCcw,
  Eye,
  EyeOff,
  Moon,
  Sun,
  Check,
  Cloud,
  CalendarDays,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { useTripPlannerChatContext } from "../context";
import { useItineraryContext } from "../context/ItineraryContext";

interface ChatHeaderProps {
  onOpenItinerary?: () => void;
}

export function ChatHeader({ onOpenItinerary }: ChatHeaderProps) {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { messages, isSaving, isAuthenticated, bionicEnabled, setBionicEnabled, clearChat } = useTripPlannerChatContext();
  const { itinerary } = useItineraryContext();

  const hasMessages = messages.length > 1;
  const hasItinerary = !!itinerary && itinerary.days.length > 0;

  return (
    <TooltipProvider>
      <div className="flex items-center justify-between p-4 border-b border-border">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/appview')}
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-bold">Trip Planner</h1>
          {isAuthenticated && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span 
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-all duration-300",
                    isSaving 
                      ? "bg-info/10 text-info-strong dark:text-info-light" 
                      : "bg-success/10 text-success-strong dark:text-success-light"
                  )}
                >
                  {isSaving ? (
                    <>
                      <Cloud className="h-3 w-3 animate-pulse" />
                      <span className="animate-pulse">Saving…</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-3 w-3" />
                      Saved
                    </>
                  )}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isSaving ? "Saving chat history…" : "Chat history is saved to your account"}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        
        <div className="flex items-center gap-1">
          {/* View Itinerary button - only appears when itinerary exists */}
          {hasItinerary && onOpenItinerary && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onOpenItinerary}
                  aria-label="View itinerary"
                  className="text-primary"
                >
                  <CalendarDays className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View Itinerary</p>
              </TooltipContent>
            </Tooltip>
          )}
          
          {hasMessages && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearChat}
                  aria-label="Clear chat and start new conversation"
                >
                  <RotateCcw className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>New Chat</p>
              </TooltipContent>
            </Tooltip>
          )}
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setBionicEnabled(!bionicEnabled)}
                className={cn(bionicEnabled && "text-primary")}
                aria-label={bionicEnabled ? "Disable Bionic Reading" : "Enable Bionic Reading"}
              >
                {bionicEnabled ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{bionicEnabled ? "Disable" : "Enable"} Bionic Reading</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Toggle {theme === "dark" ? "Light" : "Dark"} Mode</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
