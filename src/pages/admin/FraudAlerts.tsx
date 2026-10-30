import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldAlert, CheckCircle, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

interface FraudAlert {
  id: string;
  alert_type: string;
  target_user_id: string;
  target_listing_id: string | null;
  details: Record<string, any>;
  status: string;
  admin_notes: string | null;
  created_at: string;
}

const alertTypeLabels: Record<string, { label: string; color: string }> = {
  multiple_listings: { label: "Multiple Listings", color: "bg-rating" },
  suspicious_pricing: { label: "Suspicious Pricing", color: "bg-brand" },
  rapid_bookings: { label: "Rapid Bookings", color: "bg-danger" },
  multiple_accounts: { label: "Multiple Accounts", color: "bg-iris" },
};

const FraudAlerts = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [notes, setNotes] = useState<Record<string, string>>({});

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ["fraudAlerts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fraud_alerts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as FraudAlert[];
    },
  });

  const updateAlert = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("fraud_alerts")
        .update({
          status,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: notes[id] || null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fraudAlerts"] });
      toast.success("Alert updated");
    },
  });

  const pendingAlerts = alerts.filter((a) => a.status === "pending");
  const reviewedAlerts = alerts.filter((a) => a.status !== "pending");

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="max-w-lg mx-auto">
        <div className="bg-gradient-to-br from-warning-strong to-danger-strong px-4 pt-6 pb-8 rounded-b-3xl shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => navigate("/admin/settings")} className="p-2 rounded-xl bg-paper/10 backdrop-blur-sm hover:bg-paper/20 transition-all">
              <ArrowLeft className="h-5 w-5 text-paper" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-paper">Fraud Alerts</h1>
              <p className="text-sm text-paper/70">{pendingAlerts.length} pending alerts</p>
            </div>
          </div>
        </div>

        <div className="px-4 py-6 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
          ) : pendingAlerts.length === 0 && reviewedAlerts.length === 0 ? (
            <Card className="p-8 text-center">
              <CheckCircle className="h-12 w-12 mx-auto text-success mb-4" />
              <h2 className="font-semibold mb-1">No Fraud Alerts</h2>
              <p className="text-sm text-muted-foreground">All clear</p>
            </Card>
          ) : (
            <>
              {pendingAlerts.length > 0 && (
                <div className="space-y-3">
                  <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Pending Review</h2>
                  {pendingAlerts.map((alert) => {
                    const typeInfo = alertTypeLabels[alert.alert_type] || { label: alert.alert_type, color: "bg-muted-foreground" };
                    return (
                      <Card key={alert.id} className="p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <ShieldAlert className="h-4 w-4 text-warning" />
                              <Badge className={`text-xs text-paper ${typeInfo.color}`}>{typeInfo.label}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{new Date(alert.created_at).toLocaleDateString()}</p>
                          </div>
                        </div>

                        <div className="bg-muted rounded-lg p-3 text-sm space-y-1">
                          {Object.entries(alert.details).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}</span>
                              <span className="font-medium">{String(value)}</span>
                            </div>
                          ))}
                        </div>

                        <Textarea
                          placeholder="Admin notes (optional)"
                          value={notes[alert.id] || ""}
                          onChange={(e) => setNotes({ ...notes, [alert.id]: e.target.value })}
                          className="min-h-[60px] text-sm"
                        />

                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" onClick={() => updateAlert.mutate({ id: alert.id, status: "reviewed" })} disabled={updateAlert.isPending}>
                            Mark Reviewed
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => updateAlert.mutate({ id: alert.id, status: "dismissed" })} disabled={updateAlert.isPending}>
                            Dismiss
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}

              {reviewedAlerts.length > 0 && (
                <div className="space-y-3">
                  <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Resolved</h2>
                  {reviewedAlerts.slice(0, 10).map((alert) => {
                    const typeInfo = alertTypeLabels[alert.alert_type] || { label: alert.alert_type, color: "bg-muted-foreground" };
                    return (
                      <Card key={alert.id} className="p-4 opacity-60">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">{typeInfo.label}</Badge>
                            <Badge variant="outline" className="text-xs">{alert.status}</Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">{new Date(alert.created_at).toLocaleDateString()}</span>
                        </div>
                        {alert.admin_notes && <p className="text-xs text-muted-foreground mt-2">{alert.admin_notes}</p>}
                      </Card>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FraudAlerts;
