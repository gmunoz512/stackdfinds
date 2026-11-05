import { createContext, useContext, useState, useEffect, useRef, useCallback, type ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase, SUPABASE_URL } from "@/integrations/supabase/client";
import type { Message, HostVendor } from "../types";
import { CHAT_HISTORY_KEY, MAX_MESSAGE_LENGTH, getInitialMessage } from "../utils";

export type StreamingStatus = "idle" | "streaming" | "slow" | "timeout";

const MAX_STORED_MESSAGES = 50;

interface TripPlannerChatContextValue {
  messages: Message[];
  hostVendors: HostVendor[];
  isLoading: boolean;
  isSaving: boolean;
  isAuthenticated: boolean | null;
  bionicEnabled: boolean;
  streamingStatus: StreamingStatus;
  setBionicEnabled: (enabled: boolean) => void;
  sendMessage: (content: string) => Promise<void>;
  retryLastMessage: () => void;
  clearChat: () => void;
}

const TripPlannerChatContext = createContext<TripPlannerChatContextValue | null>(null);

interface TripPlannerChatProviderProps {
  children: ReactNode;
  initialVendors?: HostVendor[];
}

// Timeout thresholds in ms
const SLOW_THRESHOLD = 8000;
const TIMEOUT_THRESHOLD = 30000;

export function TripPlannerChatProvider({ children, initialVendors = [] }: TripPlannerChatProviderProps) {
  const { toast } = useToast();
  
  const [hostVendors, setHostVendors] = useState<HostVendor[]>(initialVendors);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [bionicEnabled, setBionicEnabled] = useState(false);
  const [streamingStatus, setStreamingStatus] = useState<StreamingStatus>("idle");
  const hasInitialized = useRef(false);
  const lastUserMessageRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isSendingRef = useRef(false); // Synchronous guard against double-send
  
  const [messages, setMessages] = useState<Message[]>(() => [
    { role: "assistant", content: getInitialMessage(initialVendors.length) }
  ]);

  // Fetch vendors from database if none passed
  useEffect(() => {
    if (initialVendors.length === 0) {
      const fetchVendors = async () => {
        const { data, error } = await supabase
          .from('vendor_profiles')
          .select('id, name, category, description, price_per_person, google_rating, duration, max_guests, included_items')
          .eq('is_published', true);
        
        if (!error && data) {
          const mapped: HostVendor[] = data.map((v) => ({
            id: v.id,
            name: v.name,
            category: v.category,
            vendor: v.name,
            price: v.price_per_person || 0,
            rating: v.google_rating && v.google_rating > 0 ? v.google_rating : null,
            description: v.description || '',
            duration: v.duration || undefined,
            maxGuests: v.max_guests || undefined,
            included: v.included_items || [],
          }));
          setHostVendors(mapped);
          
          // Update the initial greeting message with the vendor count
          setMessages(prev => {
            if (prev.length === 1 && prev[0].role === "assistant") {
              return [{ role: "assistant", content: getInitialMessage(mapped.length) }];
            }
            return prev;
          });
        }
      };
      fetchVendors();
    }
  }, [initialVendors.length]);

  // Check auth status and load history only for authenticated users
  useEffect(() => {
    const checkAuthAndLoadHistory = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const isLoggedIn = !!session?.user;
      setIsAuthenticated(isLoggedIn);
      
      if (isLoggedIn && !hasInitialized.current) {
        const stored = localStorage.getItem(CHAT_HISTORY_KEY);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
              // Cap loaded messages
              const capped = parsed.length > MAX_STORED_MESSAGES
                ? [parsed[0], ...parsed.slice(-(MAX_STORED_MESSAGES - 1))]
                : parsed;
              setMessages(capped);
            }
          } catch {
            // Invalid JSON, use default
          }
        }
      } else if (!isLoggedIn) {
        localStorage.removeItem(CHAT_HISTORY_KEY);
        sessionStorage.removeItem(CHAT_HISTORY_KEY);
      }
      
      hasInitialized.current = true;
    };
    
    checkAuthAndLoadHistory();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const isLoggedIn = !!session?.user;
      setIsAuthenticated(isLoggedIn);
      
      if (!isLoggedIn) {
        localStorage.removeItem(CHAT_HISTORY_KEY);
        sessionStorage.removeItem(CHAT_HISTORY_KEY);
        setMessages([{ role: "assistant", content: getInitialMessage(hostVendors.length) }]);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [hostVendors.length]);

  // Persist messages when they change (for authenticated users), with cap
  useEffect(() => {
    if (isAuthenticated && hasInitialized.current && messages.length > 1) {
      setIsSaving(true);
      // Cap stored messages to prevent localStorage overflow
      const toStore = messages.length > MAX_STORED_MESSAGES
        ? [messages[0], ...messages.slice(-(MAX_STORED_MESSAGES - 1))]
        : messages;
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(toStore));
      const timer = setTimeout(() => setIsSaving(false), 800);
      return () => clearTimeout(timer);
    }
  }, [messages, isAuthenticated]);

  const clearChat = useCallback(() => {
    localStorage.removeItem(CHAT_HISTORY_KEY);
    sessionStorage.removeItem(CHAT_HISTORY_KEY);
    setMessages([{ role: "assistant", content: getInitialMessage(hostVendors.length) }]);
    setStreamingStatus("idle");
    lastUserMessageRef.current = null;
    isSendingRef.current = false;
  }, [hostVendors.length]);

  const sendMessage = useCallback(async (content: string) => {
    const trimmedInput = content.trim();
    if (!trimmedInput || isSendingRef.current) return;

    if (trimmedInput.length > MAX_MESSAGE_LENGTH) {
      toast({
        title: "Message too long",
        description: `Please limit your message to ${MAX_MESSAGE_LENGTH} characters.`,
        variant: "destructive",
      });
      return;
    }

    // Synchronous guard set BEFORE any async work
    isSendingRef.current = true;

    // Store for retry
    lastUserMessageRef.current = trimmedInput;

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const userMessage: Message = { role: "user", content: trimmedInput };
    let outgoingMessages: Message[] = [];

    setMessages((prev) => {
      outgoingMessages = [...prev, userMessage];
      return outgoingMessages;
    });

    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);
    setIsLoading(true);
    setStreamingStatus("streaming");

    // Timeout timers
    let slowTimer: ReturnType<typeof setTimeout> | null = null;
    let timeoutTimer: ReturnType<typeof setTimeout> | null = null;
    let receivedContent = false;

    const clearTimers = () => {
      if (slowTimer) clearTimeout(slowTimer);
      if (timeoutTimer) clearTimeout(timeoutTimer);
    };

    slowTimer = setTimeout(() => {
      if (!receivedContent) {
        setStreamingStatus("slow");
      }
    }, SLOW_THRESHOLD);

    timeoutTimer = setTimeout(() => {
      if (!receivedContent) {
        setStreamingStatus("timeout");
        abortControllerRef.current?.abort();
      }
    }, TIMEOUT_THRESHOLD);

    // Optimized update function with throttling
    const updateAssistant = (nextContent: string) => {
      if (nextContent.trim()) {
        receivedContent = true;
        setStreamingStatus("streaming");
      }
      setMessages((prev) => {
        if (prev.length === 0) return prev;
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last?.role === "assistant") {
          updated[updated.length - 1] = { ...last, content: nextContent };
        }
        return updated;
      });
    };

    const parseFullSse = (sseText: string) => {
      let text = "";
      for (let line of sseText.split("\n")) {
        line = line.trim();
        if (!line || line.startsWith(":")) continue;
        if (!line.startsWith("data:")) continue;
        const dataStr = line.replace(/^data:\s*/, "").trim();
        if (!dataStr || dataStr === "[DONE]") continue;
        try {
          const json = JSON.parse(dataStr);
          const chunkContent = json.choices?.[0]?.delta?.content as string | undefined;
          if (typeof chunkContent === "string" && chunkContent.length) {
            text += chunkContent.replace(/[¡¿]/g, "");
          }
        } catch {
          // ignore malformed lines
        }
      }
      return text;
    };

    try {
      const CHAT_URL = `${SUPABASE_URL}/functions/v1/trip-planner-chat`;
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { "Authorization": `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          messages: outgoingMessages,
          hostVendors: hostVendors.length > 0 ? hostVendors : undefined,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok || !response.body) {
        const raw = await response.text().catch(() => "");
        let message = `API error: ${response.status}`;
        try {
          const parsed = JSON.parse(raw);
          message = parsed?.error || message;
        } catch {
          // ignore
        }

        // Specific error messages for rate limit and payment errors
        if (response.status === 429) {
          toast({
            title: "Slow down",
            description: "You're sending messages too quickly. Please wait a moment and try again.",
            variant: "destructive",
          });
          // Remove the empty assistant bubble
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant" && last.content === "") return prev.slice(0, -1);
            return prev;
          });
          clearTimers();
          setStreamingStatus("idle");
          return;
        }

        if (response.status === 402) {
          toast({
            title: "Service unavailable",
            description: "The AI service is temporarily unavailable. Please try again later.",
            variant: "destructive",
          });
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant" && last.content === "") return prev.slice(0, -1);
            return prev;
          });
          clearTimers();
          setStreamingStatus("idle");
          return;
        }

        throw new Error(message);
      }

      const responseClone = response.clone();
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let assistantText = "";
      let gotAnyChunk = false;
      let textBuffer = "";
      let streamDone = false;
      
      // Throttling control
      let lastUpdateTime = 0;
      const THROTTLE_MS = 50;

      const processDataStr = (dataStr: string) => {
        if (dataStr === "[DONE]") return true;

        try {
          const json = JSON.parse(dataStr);
          const chunkContent = json.choices?.[0]?.delta?.content as string | undefined;
          if (typeof chunkContent === "string" && chunkContent.length) {
            gotAnyChunk = true;
            assistantText += chunkContent.replace(/[¡¿]/g, "");
            
            // Throttled update
            const now = Date.now();
            if (now - lastUpdateTime > THROTTLE_MS) {
              updateAssistant(assistantText);
              lastUpdateTime = now;
            }
          }
        } catch {
          // Ignore any malformed partial line
        }

        return false;
      };

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);

          if (line.endsWith("\r")) line = line.slice(0, -1);
          const trimmed = line.trim();

          if (!trimmed || trimmed.startsWith(":")) continue;
          if (!trimmed.startsWith("data:")) continue;

          const dataStr = trimmed.replace(/^data:\s*/, "").trim();
          if (!dataStr) continue;

          if (processDataStr(dataStr)) {
            streamDone = true;
            break;
          }
        }
      }

      // Flush leftovers
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split("\n")) {
          raw = raw.trim();
          if (!raw || raw.startsWith(":")) continue;
          if (!raw.startsWith("data:")) continue;
          const dataStr = raw.replace(/^data:\s*/, "").trim();
          if (!dataStr) continue;
          if (processDataStr(dataStr)) break;
        }
      }
      
      // Ensure final state is updated
      updateAssistant(assistantText);

      // Fallback: if we somehow got no content from the stream, parse the full SSE payload.
      if (!gotAnyChunk) {
        const full = await responseClone.text();
        const parsed = parseFullSse(full);
        if (parsed) {
          assistantText = parsed;
          updateAssistant(assistantText);
        }
      }

      // Final safety: never leave an empty assistant bubble
      if (!assistantText.trim()) {
        updateAssistant("Sorry — I didn't get a response. Please try again.");
      }

      clearTimers();
      setStreamingStatus("idle");
    } catch (error: unknown) {
      clearTimers();
      
      // Don't show error toast for aborted requests (user-initiated or timeout)
      if (error instanceof Error && error.name === "AbortError") {
        // Keep timeout status if that's what triggered the abort
        if (streamingStatus !== "timeout") {
          setStreamingStatus("idle");
        }
        return;
      }

      const errorMessage = error instanceof Error ? error.message : "Failed to get AI response";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });

      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.content === "") {
          return prev.slice(0, -1);
        }
        return prev;
      });
      setStreamingStatus("idle");
    } finally {
      setIsLoading(false);
      isSendingRef.current = false; // Release guard
    }
  }, [hostVendors, streamingStatus, toast]);

  const retryLastMessage = useCallback(() => {
    if (!lastUserMessageRef.current) return;
    
    // Remove the last user message and empty assistant response for clean retry
    setMessages((prev) => {
      const newMessages = [...prev];
      // Remove last assistant (empty or error)
      if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === "assistant") {
        newMessages.pop();
      }
      // Remove last user message
      if (newMessages.length > 0 && newMessages[newMessages.length - 1].role === "user") {
        newMessages.pop();
      }
      return newMessages;
    });
    
    setStreamingStatus("idle");
    isSendingRef.current = false; // Reset guard for retry
    
    // Retry with stored message
    const messageToRetry = lastUserMessageRef.current;
    setTimeout(() => {
      sendMessage(messageToRetry);
    }, 100);
  }, [sendMessage]);

  const value: TripPlannerChatContextValue = {
    messages,
    hostVendors,
    isLoading,
    isSaving,
    isAuthenticated,
    bionicEnabled,
    streamingStatus,
    setBionicEnabled,
    sendMessage,
    retryLastMessage,
    clearChat,
  };

  return (
    <TripPlannerChatContext.Provider value={value}>
      {children}
    </TripPlannerChatContext.Provider>
  );
}

export function useTripPlannerChatContext(): TripPlannerChatContextValue {
  const context = useContext(TripPlannerChatContext);
  if (!context) {
    throw new Error("useTripPlannerChatContext must be used within a TripPlannerChatProvider");
  }
  return context;
}
