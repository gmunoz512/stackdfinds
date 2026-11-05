import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle, CheckCircle, Loader2, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface FlaggedConversation {
  id: string;
  booking_id: string;
  guest_user_id: string;
  host_user_id: string;
  is_flagged: boolean;
  flag_reason: string | null;
  created_at: string;
}

interface FlaggedMessage {
  id: string;
  content: string;
  sender_id: string;
  is_flagged: boolean;
  flag_reason: string | null;
  created_at: string;
}

const MessageModeration = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["flaggedConversations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("is_flagged", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as FlaggedConversation[];
    },
  });

  const [selectedConvo, setSelectedConvo] = useState<string | null>(null);

  const { data: messages = [] } = useQuery({
    queryKey: ["convoMessages", selectedConvo],
    queryFn: async () => {
      if (!selectedConvo) return [];
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", selectedConvo)
        .order("created_at", { ascending: true });
      return (data || []) as FlaggedMessage[];
    },
    enabled: !!selectedConvo,
  });

  const dismissFlag = useMutation({
    mutationFn: async (convoId: string) => {
      const { error } = await supabase
        .from("conversations")
        .update({ is_flagged: false, flag_reason: null })
        .eq("id", convoId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["flaggedConversations"] });
      toast.success("Flag dismissed");
      setSelectedConvo(null);
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="max-w-lg mx-auto">
        <div className="bg-gradient-to-br from-danger-strong to-brand-strong px-4 pt-6 pb-8 rounded-b-3xl shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => navigate("/admin/settings")} className="p-2 rounded-xl bg-paper/10 backdrop-blur-sm hover:bg-paper/20 transition-all">
              <ArrowLeft className="h-5 w-5 text-paper" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-paper">Message Moderation</h1>
              <p className="text-sm text-paper/70">{conversations.length} flagged conversations</p>
            </div>
          </div>
        </div>

        <div className="px-4 py-6 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : conversations.length === 0 ? (
            <Card className="p-8 text-center">
              <CheckCircle className="h-12 w-12 mx-auto text-success mb-4" />
              <h2 className="font-semibold mb-1">All Clear</h2>
              <p className="text-sm text-muted-foreground">No flagged conversations</p>
            </Card>
          ) : (
            conversations.map((convo) => (
              <Card key={convo.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      <Badge variant="destructive" className="text-xs">Flagged</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{convo.flag_reason}</p>
                    <p className="text-xs text-muted-foreground">{new Date(convo.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => setSelectedConvo(selectedConvo === convo.id ? null : convo.id)} className="gap-1">
                    <MessageSquare className="h-3.5 w-3.5" />
                    {selectedConvo === convo.id ? "Hide" : "View Messages"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => dismissFlag.mutate(convo.id)} disabled={dismissFlag.isPending}>
                    Dismiss Flag
                  </Button>
                </div>

                {selectedConvo === convo.id && (
                  <div className="border-t pt-3 space-y-2 max-h-60 overflow-y-auto">
                    {messages.map((msg) => (
                      <div key={msg.id} className={`p-2 rounded-lg text-sm ${msg.is_flagged ? "bg-destructive/10 border border-destructive/20" : "bg-muted"}`}>
                        <p>{msg.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(msg.created_at).toLocaleTimeString()}
                          {msg.is_flagged && <span className="text-destructive ml-2">⚠️ {msg.flag_reason}</span>}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageModeration;
