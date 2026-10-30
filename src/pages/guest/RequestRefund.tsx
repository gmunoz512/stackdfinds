import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSmartBack } from "@/hooks/use-smart-back";
import { PageTransition } from "@/components/PageTransition";

const reasons = [
  { value: "no_show", label: "Vendor didn't show up" },
  { value: "not_as_described", label: "Experience not as described" },
  { value: "cancelled_by_host", label: "Cancelled by host" },
  { value: "other", label: "Other" },
];

const RequestRefund = () => {
  const { bookingId } = useParams<{ bookingId: string }>();
  const navigate = useNavigate();
  const goBack = useSmartBack("/bookings");
  const { user } = useAuthContext();
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files).slice(0, 5));
    }
  };

  const handleSubmit = async () => {
    if (!user || !bookingId || !reason || !description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload evidence files
      const evidenceUrls: string[] = [];
      for (const file of files) {
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${bookingId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("refund-evidence")
          .upload(path, file);

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("refund-evidence")
            .getPublicUrl(path);
          evidenceUrls.push(urlData.publicUrl);
        }
      }

      const { error } = await supabase.from("refund_requests").insert({
        booking_id: bookingId,
        user_id: user.id,
        reason,
        description: description.trim(),
        evidence_urls: evidenceUrls,
      });

      if (error) throw error;

      toast.success("Refund request submitted. We'll review it shortly.");
      navigate("/bookings");
    } catch (error: any) {
      console.error("Refund request error:", error);
      toast.error(error?.message || "Failed to submit refund request");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-6 text-center">
          <p>Please sign in first.</p>
          <Button onClick={() => navigate("/auth")} className="mt-4" variant="gradient">Sign In</Button>
        </Card>
      </div>
    );
  }

  return (
    <PageTransition className="min-h-screen bg-background pb-8">
      <div className="max-w-[375px] mx-auto px-4 py-6 space-y-6">
        <button onClick={goBack} className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors active:scale-95">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </button>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Request a Refund</h1>
          <p className="text-sm text-muted-foreground">We're sorry things didn't go as planned</p>
        </div>

        {/* Guarantee badge */}
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-8 w-8 text-primary flex-shrink-0" />
            <div>
              <p className="font-semibold text-sm">Stackd Experience Guarantee</p>
              <p className="text-xs text-muted-foreground">
                If your experience doesn't match what was described, we'll make it right.
              </p>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Reason for refund *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {reasons.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>What happened? *</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please describe what went wrong..."
              className="min-h-[120px]"
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground text-right">{description.length}/2000</p>
          </div>

          <div className="space-y-2">
            <Label>Supporting evidence (optional)</Label>
            <div className="border-2 border-dashed rounded-xl p-6 text-center">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-2">Upload photos or screenshots</p>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
                id="evidence-upload"
              />
              <label htmlFor="evidence-upload">
                <Button variant="outline" size="sm" asChild>
                  <span>Choose Files</span>
                </Button>
              </label>
              {files.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">{files.length} file(s) selected</p>
              )}
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !reason || !description.trim()}
            className="w-full"
            variant="gradient"
          >
            {isSubmitting ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</>
            ) : (
              "Submit Refund Request"
            )}
          </Button>
        </div>
      </div>
    </PageTransition>
  );
};

export default RequestRefund;
