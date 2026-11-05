import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, CheckCircle, XCircle, DollarSign, Image as ImageIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

interface RefundRequest {
  id: string;
  booking_id: string;
  user_id: string;
  reason: string;
  description: string;
  evidence_urls: string[];
  status: string;
  admin_notes: string | null;
  created_at: string;
}

const reasonLabels: Record<string, string> = {
  no_show: "Vendor No-Show",
  not_as_described: "Not As Described",
  cancelled_by_host: "Cancelled by Host",
  other: "Other",
};

const RefundRequests = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["refundRequests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("refund_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as RefundRequest[];
    },
  });

  const processRefund = useMutation({
    mutationFn: async ({ requestId, action }: { requestId: string; action: "approved" | "denied" }) => {
      const { data: { user } } = await supabase.auth.getUser();

      if (action === "approved") {
        // Call process-refund edge function
        const { data, error } = await supabase.functions.invoke("process-refund", {
          body: { refundRequestId: requestId, adminNotes: adminNotes[requestId] || "" },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
      } else {
        const { error } = await supabase
          .from("refund_requests")
          .update({
            status: "denied",
            admin_notes: adminNotes[requestId] || null,
            reviewed_by: user?.id,
            reviewed_at: new Date().toISOString(),
          })
          .eq("id", requestId);
        if (error) throw error;
      }
    },
    onSuccess: (_, { action }) => {
      queryClient.invalidateQueries({ queryKey: ["refundRequests"] });
      toast.success(action === "approved" ? "Refund approved and processed" : "Refund denied");
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to process refund");
    },
  });

  const pending = requests.filter((r) => r.status === "pending");
  const resolved = requests.filter((r) => r.status !== "pending");

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="max-w-lg mx-auto">
        <div className="bg-gradient-to-br from-success-strong to-mint-strong px-4 pt-6 pb-8 rounded-b-3xl shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => navigate("/admin/settings")} className="p-2 rounded-xl bg-paper/10 backdrop-blur-sm hover:bg-paper/20 transition-all">
              <ArrowLeft className="h-5 w-5 text-paper" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-paper">Refund Requests</h1>
              <p className="text-sm text-paper/70">{pending.length} pending</p>
            </div>
          </div>
        </div>

        <div className="px-4 py-6 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : requests.length === 0 ? (
            <Card className="p-8 text-center">
              <CheckCircle className="h-12 w-12 mx-auto text-success mb-4" />
              <h2 className="font-semibold mb-1">No Refund Requests</h2>
              <p className="text-sm text-muted-foreground">All clear</p>
            </Card>
          ) : (
            <>
              {pending.length > 0 && (
                <div className="space-y-3">
                  <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Pending Review</h2>
                  {pending.map((req) => (
                    <Card key={req.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <Badge variant="secondary">{reasonLabels[req.reason] || req.reason}</Badge>
                          <p className="text-xs text-muted-foreground">{new Date(req.created_at).toLocaleDateString()}</p>
                        </div>
                        <Badge variant="outline">Pending</Badge>
                      </div>

                      <p className="text-sm">{req.description}</p>

                      {req.evidence_urls.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                          {req.evidence_urls.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline">
                              <ImageIcon className="h-3 w-3" /> Evidence {i + 1}
                            </a>
                          ))}
                        </div>
                      )}

                      <Textarea
                        placeholder="Admin notes"
                        value={adminNotes[req.id] || ""}
                        onChange={(e) => setAdminNotes({ ...adminNotes, [req.id]: e.target.value })}
                        className="min-h-[60px] text-sm"
                      />

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="gap-1 bg-success-strong hover:bg-success-deep"
                          onClick={() => processRefund.mutate({ requestId: req.id, action: "approved" })}
                          disabled={processRefund.isPending}
                        >
                          <DollarSign className="h-3.5 w-3.5" /> Approve & Refund
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1"
                          onClick={() => processRefund.mutate({ requestId: req.id, action: "denied" })}
                          disabled={processRefund.isPending}
                        >
                          <XCircle className="h-3.5 w-3.5" /> Deny
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}

              {resolved.length > 0 && (
                <div className="space-y-3">
                  <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Resolved</h2>
                  {resolved.slice(0, 10).map((req) => (
                    <Card key={req.id} className="p-4 opacity-60">
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary">{reasonLabels[req.reason] || req.reason}</Badge>
                        <Badge variant={req.status === "approved" ? "default" : "destructive"} className="text-xs">
                          {req.status}
                        </Badge>
                      </div>
                      {req.admin_notes && <p className="text-xs text-muted-foreground mt-2">{req.admin_notes}</p>}
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RefundRequests;
