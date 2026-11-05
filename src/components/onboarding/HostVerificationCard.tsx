import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ShieldCheck,
  Upload,
  Camera,
  FileCheck,
  Loader2,
  ChevronUp,
  ChevronDown,
  X,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";

type VerificationStatus = "unverified" | "pending_verification" | "verified" | "rejected";

interface HostVerificationCardProps {
  verificationStatus: VerificationStatus;
  verificationNotes?: string | null;
  existingIdUrl?: string | null;
  existingSelfieUrl?: string | null;
  onStatusChange?: () => void;
}

const statusConfig: Record<VerificationStatus, { label: string; icon: React.ReactNode; badgeClass: string; description: string }> = {
  unverified: {
    label: "Not Verified",
    icon: <AlertCircle className="h-5 w-5 text-rating" />,
    badgeClass: "bg-rating/10 text-rating-strong border-rating/20",
    description: "Upload your documents to get verified and unlock publishing.",
  },
  pending_verification: {
    label: "Under Review",
    icon: <Clock className="h-5 w-5 text-info" />,
    badgeClass: "bg-info/10 text-info-strong border-info/20",
    description: "Your documents are being reviewed. This usually takes 1-2 business days.",
  },
  verified: {
    label: "Verified",
    icon: <CheckCircle2 className="h-5 w-5 text-success" />,
    badgeClass: "bg-success/10 text-success-strong border-success/20",
    description: "You're verified! You can now publish experiences.",
  },
  rejected: {
    label: "Rejected",
    icon: <XCircle className="h-5 w-5 text-destructive" />,
    badgeClass: "bg-destructive/10 text-destructive border-destructive/20",
    description: "Your verification was rejected. Please re-upload your documents.",
  },
};

const HostVerificationCard = ({
  verificationStatus,
  verificationNotes,
  existingIdUrl,
  existingSelfieUrl,
  onStatusChange,
}: HostVerificationCardProps) => {
  const { user } = useAuthContext();
  const [isExpanded, setIsExpanded] = useState(verificationStatus === "unverified" || verificationStatus === "rejected");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [phone, setPhone] = useState("");
  const idInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  const status = statusConfig[verificationStatus];
  const canSubmit = verificationStatus === "unverified" || verificationStatus === "rejected";

  const handleFileSelect = (type: "id" | "selfie", file: File | null) => {
    if (!file) return;
    // Validate file type
    const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a JPG, PNG, WebP, or PDF file");
      return;
    }
    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File must be less than 10MB");
      return;
    }
    if (type === "id") setIdFile(file);
    else setSelfieFile(file);
  };

  const handleSubmit = async () => {
    if (!user || !idFile || !selfieFile) {
      toast.error("Please upload both your government ID and selfie");
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload government ID
      const idExt = idFile.name.split(".").pop();
      const idPath = `${user.id}/government-id.${idExt}`;
      const { error: idError } = await supabase.storage
        .from("host-verification-docs")
        .upload(idPath, idFile, { upsert: true });
      if (idError) throw idError;

      // Upload selfie
      const selfieExt = selfieFile.name.split(".").pop();
      const selfiePath = `${user.id}/selfie.${selfieExt}`;
      const { error: selfieError } = await supabase.storage
        .from("host-verification-docs")
        .upload(selfiePath, selfieFile, { upsert: true });
      if (selfieError) throw selfieError;

      // Get signed URLs (private bucket)
      const { data: idUrlData } = await supabase.storage
        .from("host-verification-docs")
        .createSignedUrl(idPath, 60 * 60 * 24 * 365); // 1 year

      const { data: selfieUrlData } = await supabase.storage
        .from("host-verification-docs")
        .createSignedUrl(selfiePath, 60 * 60 * 24 * 365);

      // Update profile with document URLs and set status to pending
      // Note: host_verification_status is admin-only, so we use an edge function
      const { error: fnError } = await supabase.functions.invoke("verify-host", {
        body: {
          action: "submit",
          governmentIdUrl: idUrlData?.signedUrl || idPath,
          selfieUrl: selfieUrlData?.signedUrl || selfiePath,
          phone: phone || undefined,
        },
      });

      if (fnError) throw fnError;

      toast.success("Documents submitted for verification!");
      onStatusChange?.();
    } catch (error) {
      console.error("Error submitting verification:", error);
      toast.error("Failed to submit documents. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (verificationStatus === "verified") {
    return (
      <Card className="p-4 rounded-2xl border border-success/20 bg-success/5 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-success" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm">Identity Verified</span>
              <Badge variant="outline" className={status.badgeClass}>
                {status.label}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Your identity has been verified. You can publish experiences.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm mb-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-info-strong to-indigo flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-6 h-6 text-paper" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">Identity Verification</h3>
              <Badge variant="outline" className={status.badgeClass}>
                {status.icon}
                <span className="ml-1">{status.label}</span>
              </Badge>
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 rounded-lg hover:bg-muted/50 transition-colors"
              aria-label={isExpanded ? "Collapse" : "Expand"}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          </div>
          <p className="text-sm text-muted-foreground mb-4">{status.description}</p>

          {verificationNotes && verificationStatus === "rejected" && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 mb-4">
              <p className="text-sm text-destructive font-medium">Reason: {verificationNotes}</p>
            </div>
          )}

          {isExpanded && canSubmit && (
            <div className="space-y-4">
              {/* Government ID Upload */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground flex items-center gap-1">
                  <FileCheck className="h-4 w-4" />
                  Government ID *
                </Label>
                <p className="text-xs text-muted-foreground">
                  Upload a photo of your passport, driver's license, or national ID card.
                </p>
                <input
                  ref={idInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  className="hidden"
                  onChange={(e) => handleFileSelect("id", e.target.files?.[0] || null)}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start gap-2 rounded-xl"
                  onClick={() => idInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" />
                  {idFile ? idFile.name : existingIdUrl ? "Replace existing ID" : "Upload Government ID"}
                </Button>
                {(idFile || existingIdUrl) && (
                  <p className="text-xs text-success-strong flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {idFile ? "File selected" : "Previously uploaded"}
                  </p>
                )}
              </div>

              {/* Selfie Upload */}
              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground flex items-center gap-1">
                  <Camera className="h-4 w-4" />
                  Selfie / Photo *
                </Label>
                <p className="text-xs text-muted-foreground">
                  Take a clear selfie holding your ID next to your face.
                </p>
                <input
                  ref={selfieInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => handleFileSelect("selfie", e.target.files?.[0] || null)}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="w-full justify-start gap-2 rounded-xl"
                  onClick={() => selfieInputRef.current?.click()}
                >
                  <Camera className="h-4 w-4" />
                  {selfieFile ? selfieFile.name : existingSelfieUrl ? "Replace existing selfie" : "Upload Selfie"}
                </Button>
                {(selfieFile || existingSelfieUrl) && (
                  <p className="text-xs text-success-strong flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {selfieFile ? "File selected" : "Previously uploaded"}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="verifyPhone" className="text-sm text-muted-foreground">
                  Phone Number
                </Label>
                <Input
                  id="verifyPhone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                  className="rounded-xl border-border/50"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleSubmit}
                  variant="gradient"
                  size="sm"
                  disabled={isSubmitting || (!idFile && !existingIdUrl) || (!selfieFile && !existingSelfieUrl)}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    "Submit for Verification"
                  )}
                </Button>
              </div>
            </div>
          )}

          {isExpanded && verificationStatus === "pending_verification" && (
            <div className="p-4 rounded-xl bg-info/5 border border-info/20">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-4 w-4 animate-spin text-info" />
                <span className="text-sm font-medium text-info-strong">Review in progress</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Our team is reviewing your documents. You'll receive a notification once the review is complete.
              </p>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default HostVerificationCard;
