import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Eye,
  Loader2,
  ShieldCheck,
  User,
  FileCheck,
  Camera,
  Phone,
  Mail,
  ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type HostVerificationStatus = "unverified" | "pending_verification" | "verified" | "rejected";

interface HostProfile {
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  host_verification_status: HostVerificationStatus;
  host_verification_notes: string | null;
  government_id_url: string | null;
  selfie_url: string | null;
  verified_phone: string | null;
  host_verified_at: string | null;
  created_at: string;
}

const statusConfig: Record<HostVerificationStatus, { label: string; color: string; icon: React.ReactNode }> = {
  unverified: { label: "Unverified", color: "bg-neutral", icon: <Clock className="h-3 w-3" /> },
  pending_verification: { label: "Pending Review", color: "bg-warning", icon: <Clock className="h-3 w-3" /> },
  verified: { label: "Verified", color: "bg-success", icon: <CheckCircle className="h-3 w-3" /> },
  rejected: { label: "Rejected", color: "bg-danger", icon: <XCircle className="h-3 w-3" /> },
};

const HostVerifications = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<HostVerificationStatus | "all">("pending_verification");
  const [selectedHost, setSelectedHost] = useState<HostProfile | null>(null);
  const [actionDialog, setActionDialog] = useState<{ type: "verify" | "reject" | null; host: HostProfile | null }>({
    type: null,
    host: null,
  });
  const [notes, setNotes] = useState("");

  // Check if user is admin
  const { data: isAdmin, isLoading: isCheckingAdmin } = useQuery({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return false;
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();
      return !!data;
    },
  });

  // Fetch host profiles for review
  const { data: hosts, isLoading: isLoadingHosts } = useQuery({
    queryKey: ["hostVerifications", filterStatus],
    queryFn: async () => {
      let query = supabase
        .from("profiles")
        .select(
          "user_id, full_name, email, phone, city, host_verification_status, host_verification_notes, government_id_url, selfie_url, verified_phone, host_verified_at, created_at"
        )
        .not("government_id_url", "is", null) // Only show hosts who've submitted docs
        .order("created_at", { ascending: false });

      if (filterStatus !== "all") {
        query = query.eq("host_verification_status", filterStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as HostProfile[];
    },
    enabled: isAdmin === true,
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ hostUserId, status, notes }: { hostUserId: string; status: string; notes?: string }) => {
      const { error } = await supabase.functions.invoke("verify-host", {
        body: { action: "review", hostUserId, status, notes },
      });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["hostVerifications"] });
      setActionDialog({ type: null, host: null });
      setNotes("");
      toast.success(variables.status === "verified" ? "Host verified successfully!" : "Host verification rejected");
    },
    onError: (error) => {
      console.error("Error updating verification:", error);
      toast.error("Failed to update verification status");
    },
  });

  const confirmAction = () => {
    if (!actionDialog.host || !actionDialog.type) return;
    reviewMutation.mutate({
      hostUserId: actionDialog.host.user_id,
      status: actionDialog.type === "verify" ? "verified" : "rejected",
      notes: actionDialog.type === "reject" ? notes : undefined,
    });
  };

  if (isCheckingAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-lg mx-auto px-4 py-8">
          <Card className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 mx-auto text-rating mb-4" />
            <h1 className="text-xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground mb-6">This page is only available to administrators.</p>
            <Button onClick={() => navigate(-1)}>Go Back</Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-br from-info-strong to-indigo-strong px-4 pt-6 pb-8 rounded-b-3xl shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate("/admin/settings")}
              className="p-2 rounded-xl bg-paper/10 backdrop-blur-sm hover:bg-paper/20 transition-all"
            >
              <ArrowLeft className="h-5 w-5 text-paper" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-paper">Host Verifications</h1>
              <p className="text-sm text-paper/70">Review host identity documents</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="bg-paper/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-paper">
                {hosts?.filter((h) => h.host_verification_status === "pending_verification").length || 0}
              </p>
              <p className="text-xs text-paper/70">Pending</p>
            </div>
            <div className="bg-paper/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-paper">
                {hosts?.filter((h) => h.host_verification_status === "verified").length || 0}
              </p>
              <p className="text-xs text-paper/70">Verified</p>
            </div>
            <div className="bg-paper/10 backdrop-blur-sm rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-paper">
                {hosts?.filter((h) => h.host_verification_status === "rejected").length || 0}
              </p>
              <p className="text-xs text-paper/70">Rejected</p>
            </div>
          </div>
        </div>

        <div className="px-4 py-6 space-y-6">
          {/* Filter */}
          <div className="flex items-center gap-4">
            <Label className="text-sm font-medium">Filter:</Label>
            <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as HostVerificationStatus | "all")}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending_verification">Pending Review</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Host List */}
          {isLoadingHosts ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-4">
                  <div className="flex gap-4">
                    <Skeleton className="w-16 h-16 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-1/3" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : hosts && hosts.length > 0 ? (
            <div className="space-y-4">
              {hosts.map((host) => {
                const status = statusConfig[host.host_verification_status];
                return (
                  <Card key={host.user_id} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex gap-4">
                      <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <User className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-semibold">{host.full_name || "Unnamed Host"}</h3>
                            <p className="text-sm text-muted-foreground">{host.email}</p>
                          </div>
                          <Badge className={`${status.color} text-paper flex items-center gap-1`}>
                            {status.icon}
                            {status.label}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          {host.city && <span>{host.city}</span>}
                          {host.verified_phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {host.verified_phone}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <FileCheck className="h-3 w-3" />
                            ID uploaded
                          </span>
                          {host.selfie_url && (
                            <span className="flex items-center gap-1">
                              <Camera className="h-3 w-3" />
                              Selfie uploaded
                            </span>
                          )}
                        </div>

                        {host.host_verification_notes && host.host_verification_status === "rejected" && (
                          <p className="text-xs text-destructive mt-2 italic">Note: {host.host_verification_notes}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                      <Button variant="outline" size="sm" onClick={() => setSelectedHost(host)} className="gap-1">
                        <Eye className="h-3 w-3" />
                        Review Documents
                      </Button>

                      {host.host_verification_status === "pending_verification" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => setActionDialog({ type: "verify", host })}
                            className="gap-1 bg-success-strong hover:bg-success-deep"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Verify
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setActionDialog({ type: "reject", host })}
                            className="gap-1"
                          >
                            <XCircle className="h-3 w-3" />
                            Reject
                          </Button>
                        </>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <ShieldCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold mb-2">No hosts found</h3>
              <p className="text-sm text-muted-foreground">
                {filterStatus === "pending_verification"
                  ? "No hosts are currently waiting for identity review."
                  : "No hosts match the selected filter."}
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Document Review Dialog */}
      <Dialog open={!!selectedHost} onOpenChange={() => setSelectedHost(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedHost && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  Review: {selectedHost.full_name || "Unnamed Host"}
                </DialogTitle>
                <DialogDescription>Review identity verification documents</DialogDescription>
              </DialogHeader>

              <div className="space-y-6 py-4">
                {/* Host Info */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Contact Info</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      {selectedHost.email || "N/A"}
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      {selectedHost.verified_phone || "Not provided"}
                    </div>
                  </div>
                </div>

                {/* Government ID */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <FileCheck className="h-4 w-4" />
                    Government ID
                  </h4>
                  {selectedHost.government_id_url ? (
                    <div className="border rounded-xl overflow-hidden">
                      <img
                        src={selectedHost.government_id_url}
                        alt="Government ID"
                        className="w-full max-h-80 object-contain bg-muted"
                      />
                      <div className="p-2">
                        <a
                          href={selectedHost.government_id_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary flex items-center gap-1 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Open full size
                        </a>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not uploaded</p>
                  )}
                </div>

                {/* Selfie */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    Selfie with ID
                  </h4>
                  {selectedHost.selfie_url ? (
                    <div className="border rounded-xl overflow-hidden">
                      <img
                        src={selectedHost.selfie_url}
                        alt="Selfie"
                        className="w-full max-h-80 object-contain bg-muted"
                      />
                      <div className="p-2">
                        <a
                          href={selectedHost.selfie_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary flex items-center gap-1 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Open full size
                        </a>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not uploaded</p>
                  )}
                </div>
              </div>

              <DialogFooter className="gap-2">
                {selectedHost.host_verification_status === "pending_verification" && (
                  <>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setSelectedHost(null);
                        setActionDialog({ type: "reject", host: selectedHost });
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      className="bg-success-strong hover:bg-success-deep"
                      onClick={() => {
                        setSelectedHost(null);
                        setActionDialog({ type: "verify", host: selectedHost });
                      }}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Verify
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Confirmation Dialog */}
      <Dialog open={!!actionDialog.type} onOpenChange={() => setActionDialog({ type: null, host: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === "verify" ? "Verify Host Identity" : "Reject Host Verification"}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.type === "verify"
                ? `Are you sure you want to verify ${actionDialog.host?.full_name || "this host"}? They will be able to publish experiences.`
                : `Provide a reason for rejecting ${actionDialog.host?.full_name || "this host"}'s verification.`}
            </DialogDescription>
          </DialogHeader>

          {actionDialog.type === "reject" && (
            <div className="space-y-2">
              <Label>Rejection reason</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., ID photo is blurry, name doesn't match..."
                className="min-h-[100px]"
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ type: null, host: null })}>
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              disabled={reviewMutation.isPending || (actionDialog.type === "reject" && !notes.trim())}
              className={actionDialog.type === "verify" ? "bg-success-strong hover:bg-success-deep" : ""}
              variant={actionDialog.type === "reject" ? "destructive" : "default"}
            >
              {reviewMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {actionDialog.type === "verify" ? "Confirm Verification" : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HostVerifications;
