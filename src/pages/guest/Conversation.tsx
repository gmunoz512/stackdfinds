import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, AlertTriangle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useSmartBack } from "@/hooks/use-smart-back";
import { PageTransition } from "@/components/PageTransition";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_flagged: boolean;
  flag_reason: string | null;
  created_at: string;
}

interface Conversation {
  id: string;
  booking_id: string;
  guest_user_id: string;
  host_user_id: string;
  is_flagged: boolean;
  flag_reason: string | null;
}

const Conversation = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const goBack = useSmartBack("/bookings");
  const { user } = useAuthContext();
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get or create conversation
  const { data: conversation, isLoading } = useQuery({
    queryKey: ["conversation", bookingId],
    queryFn: async () => {
      if (!user || !bookingId) return null;

      // Try to find existing conversation
      const { data: existing } = await supabase
        .from("conversations")
        .select("*")
        .eq("booking_id", bookingId)
        .maybeSingle();

      if (existing) return existing as Conversation;

      // Get booking to find host
      const { data: booking } = await supabase
        .from("bookings")
        .select("user_id, host_user_id")
        .eq("id", bookingId)
        .single();

      if (!booking?.host_user_id) return null;

      // Create conversation
      const { data: created, error } = await supabase
        .from("conversations")
        .insert({
          booking_id: bookingId,
          guest_user_id: booking.user_id,
          host_user_id: booking.host_user_id,
        })
        .select()
        .single();

      if (error) {
        console.error("Error creating conversation:", error);
        return null;
      }
      return created as Conversation;
    },
    enabled: !!user && !!bookingId,
  });

  // Fetch messages
  const { data: initialMessages } = useQuery({
    queryKey: ["messages", conversation?.id],
    queryFn: async () => {
      if (!conversation) return [];
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversation.id)
        .order("created_at", { ascending: true });
      return (data || []) as Message[];
    },
    enabled: !!conversation?.id,
  });

  useEffect(() => {
    if (initialMessages) setMessages(initialMessages);
  }, [initialMessages]);

  // Realtime subscription
  useEffect(() => {
    if (!conversation?.id) return;

    const channel = supabase
      .channel(`messages-${conversation.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversation.id}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversation?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !conversation || !user || isSending) return;

    setIsSending(true);
    const content = newMessage.trim();
    setNewMessage("");

    const { error } = await supabase.from("messages").insert({
      conversation_id: conversation.id,
      sender_id: user.id,
      content,
    });

    if (error) {
      toast.error("Failed to send message");
      setNewMessage(content);
    }
    setIsSending(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-6 text-center space-y-4">
          <p className="font-semibold">Sign in to access messages</p>
          <Button onClick={() => navigate("/auth")} variant="gradient">Sign In</Button>
        </Card>
      </div>
    );
  }

  return (
    <PageTransition className="min-h-screen bg-background flex flex-col">
      <div className="max-w-[375px] mx-auto w-full flex flex-col h-screen">
        {/* Header */}
        <div className="px-4 py-3 border-b flex items-center gap-3">
          <button aria-label="Go back" onClick={goBack} className="p-1">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-semibold text-sm">Booking Chat</h1>
            {conversation?.is_flagged && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" /> Flagged for review
              </p>
            )}
          </div>
        </div>

        {/* Warning banner */}
        {conversation?.is_flagged && (
          <div className="px-4 py-2 bg-destructive/10 border-b border-destructive/20">
            <p className="text-xs text-destructive">
              ⚠️ This conversation has been flagged. Keep all payments on-platform for your protection.
            </p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-12">
              No messages yet. Start the conversation!
            </p>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.sender_id === user.id;
              return (
                <div key={msg.id} className={cn("flex", isOwn ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                    isOwn
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted rounded-bl-md",
                    msg.is_flagged && "ring-2 ring-destructive/50"
                  )}>
                    {msg.is_flagged && (
                      <p className="text-xs text-destructive mb-1 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Flagged
                      </p>
                    )}
                    <p>{msg.content}</p>
                    <p className={cn(
                      "text-[10px] mt-1",
                      isOwn ? "text-primary-foreground/60" : "text-muted-foreground"
                    )}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t">
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex gap-2"
          >
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
              maxLength={2000}
            />
            <Button type="submit" size="icon" aria-label="Send message" disabled={!newMessage.trim() || isSending}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </PageTransition>
  );
};

export default Conversation;
