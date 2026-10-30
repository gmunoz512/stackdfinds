import { useRef, useEffect, memo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Clock, AlertCircle } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { useTripPlannerChatContext } from "../context";
import type { StreamingStatus } from "../context/TripPlannerChatContext";

const ThinkingIndicator = memo(function ThinkingIndicator() {
  return (
    <div className="flex justify-start animate-fade-in" role="status" aria-label="JC is thinking">
      <Card className="relative max-w-[85%] p-3 bg-muted overflow-hidden">
        {/* Shimmer overlay */}
        <div 
          className="absolute inset-0 -translate-x-full animate-shimmer"
          style={{
            background: 'linear-gradient(90deg, transparent, hsl(var(--primary) / 0.08), transparent)',
          }}
        />
        <div className="relative flex items-center gap-2">
          <span className="text-sm text-muted-foreground">JC is thinking</span>
          <span className="flex items-center gap-0.5">
            <span className="w-1.5 h-1.5 bg-primary/70 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 bg-primary/70 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 bg-primary/70 rounded-full animate-bounce" />
          </span>
        </div>
      </Card>
    </div>
  );
});

interface StreamingBannerProps {
  status: StreamingStatus;
  onRetry: () => void;
}

const StreamingBanner = memo(function StreamingBanner({ status, onRetry }: StreamingBannerProps) {
  if (status === "idle" || status === "streaming") return null;

  if (status === "slow") {
    return (
      <div className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-warning/10 text-warning-strong dark:text-warning-light text-sm">
        <Clock className="w-4 h-4 animate-spin" />
        <span>Still thinking... This is taking longer than usual.</span>
      </div>
    );
  }

  if (status === "timeout") {
    return (
      <div className="flex flex-col items-center gap-3 py-4 px-4 rounded-lg bg-destructive/10 text-destructive">
        <div className="flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4" />
          <span>Response timed out. JC might be busy.</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </Button>
      </div>
    );
  }

  return null;
});

interface ChatMessageListProps {
  onOpenItinerary?: () => void;
}

export function ChatMessageList({ onOpenItinerary }: ChatMessageListProps) {
  const { messages, isLoading, bionicEnabled, streamingStatus, retryLastMessage, hostVendors } = useTripPlannerChatContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Auto-scroll during streaming by tracking content changes
  useEffect(() => {
    if (streamingStatus === "streaming" || isLoading) {
      // Poll-scroll while streaming so content stays visible
      scrollIntervalRef.current = setInterval(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    }

    return () => {
      if (scrollIntervalRef.current) {
        clearInterval(scrollIntervalRef.current);
        scrollIntervalRef.current = null;
      }
    };
  }, [streamingStatus, isLoading]);

  // Final scroll when streaming ends
  useEffect(() => {
    if (streamingStatus === "idle" && !isLoading) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [streamingStatus, isLoading]);

  // Filter out empty assistant messages when showing the timeout banner
  const displayMessages = messages.filter((msg, idx) => {
    if (msg.content.trim()) return true;
    if (msg.role === "assistant" && idx === messages.length - 1 && streamingStatus === "timeout") {
      return false;
    }
    return true;
  });

  return (
    <ScrollArea className="flex-1 p-4">
      <div className="space-y-4 max-w-2xl mx-auto" role="log" aria-live="polite">
        {displayMessages.map((message, index) => (
          <ChatMessage
            key={`${message.role}-${index}`}
            message={message}
            bionicEnabled={bionicEnabled}
            hostVendors={hostVendors}
          />
        ))}
        
        {isLoading && streamingStatus !== "timeout" && (
          <>
            <ThinkingIndicator />
            <StreamingBanner status={streamingStatus} onRetry={retryLastMessage} />
          </>
        )}
        
        {streamingStatus === "timeout" && (
          <StreamingBanner status={streamingStatus} onRetry={retryLastMessage} />
        )}
        
        <div ref={messagesEndRef} aria-hidden="true" />
      </div>
    </ScrollArea>
  );
}
