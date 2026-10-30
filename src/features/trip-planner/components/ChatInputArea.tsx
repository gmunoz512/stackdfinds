import { useState, useCallback } from "react";
import { Loader2, ArrowUp } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTripPlannerChatContext } from "../context";
import { useAutoResizeTextarea } from "../hooks";

interface ChatInputAreaProps {
  placeholder?: string;
  className?: string;
}

export function ChatInputArea({ 
  placeholder = "Type a message...", 
  className 
}: ChatInputAreaProps) {
  const { isLoading, sendMessage } = useTripPlannerChatContext();
  const [value, setValue] = useState("");
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 44,
    maxHeight: 120,
  });

  const handleSend = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed && !isLoading) {
      sendMessage(trimmed);
      setValue("");
      adjustHeight(true);
    }
  }, [value, isLoading, sendMessage, adjustHeight]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    adjustHeight();
  }, [adjustHeight]);

  const canSend = value.trim().length > 0 && !isLoading;

  return (
    <div 
      className={cn(
        "sticky bottom-0 p-3 border-t border-border bg-background/95 backdrop-blur-sm",
        "pb-[env(safe-area-inset-bottom,12px)]",
        className
      )}
    >
      <div className="max-w-2xl mx-auto">
        {/* Animated gradient border wrapper */}
        <div 
          className="relative rounded-xl p-[2px] animate-gradient-rotate"
          style={{
            background: "linear-gradient(90deg, hsl(var(--primary)), #a855f7, #ec4899, #f97316, hsl(var(--primary)))",
            backgroundSize: "300% 100%",
          }}
        >
          <div className="relative flex items-end gap-2 rounded-[10px] border-0 bg-card p-2">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={isLoading}
            aria-label="Message input"
            className={cn(
              "flex-1 resize-none border-none bg-transparent",
              "text-sm text-foreground",
              "focus-visible:ring-0 focus-visible:ring-offset-0",
              "placeholder:text-muted-foreground",
              "min-h-[44px] py-2.5 px-3"
            )}
            style={{ overflow: "hidden" }}
          />
          
          <Button
            onClick={handleSend}
            disabled={!canSend}
            size="icon"
            aria-label="Send message"
            className={cn(
              "h-9 w-9 shrink-0 rounded-lg transition-colors",
              canSend 
                ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                : "bg-muted text-muted-foreground"
            )}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUp className="h-4 w-4" />
            )}
          </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
