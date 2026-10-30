import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Mail, CheckCircle2 } from "lucide-react";

interface PasswordResetOTPDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
}

export function PasswordResetOTPDialog({ 
  open, 
  onOpenChange, 
  email 
}: PasswordResetOTPDialogProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<"sending" | "verify" | "success">("sending");
  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [hasSent, setHasSent] = useState(false);

  // Send OTP when dialog opens
  useEffect(() => {
    if (open && email && !hasSent) {
      sendOTP();
    }
    if (!open) {
      setHasSent(false);
    }
  }, [open, email]);

  const sendOTP = async () => {
    setStep("sending");
    setHasSent(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-reset-otp', {
        body: { email }
      });

      if (error) throw error;

      // For development, show the OTP
      if (data?.dev_otp) {
        setDevOtp(data.dev_otp);
      }

      setStep("verify");
      toast({
        title: "Code sent",
        description: "Check your email for the 6-digit verification code.",
      });
    } catch (err) {
      console.error("Send OTP error:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to send verification code",
        variant: "destructive",
      });
      onOpenChange(false);
    }
  };

  // Verify OTP and get reset link
  const verifyOTP = async () => {
    if (otp.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter the 6-digit code.",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-reset-otp', {
        body: { email, otp }
      });

      if (error) throw error;

      if (data?.redirectUrl) {
        setStep("success");
        toast({
          title: "Verified!",
          description: "Opening password reset page...",
        });
        
        // Small delay then redirect via the recovery link
        setTimeout(() => {
          window.location.href = data.redirectUrl;
        }, 1000);
      } else {
        throw new Error("Could not generate reset link");
      }
    } catch (err) {
      toast({
        title: "Invalid code",
        description: err instanceof Error ? err.message : "Please check your code and try again",
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle dialog open state
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset state when closing
      setStep("sending");
      setOtp("");
      setDevOtp(null);
      setHasSent(false);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Verify Your Email
          </DialogTitle>
          <DialogDescription>
            {step === "sending" 
              ? "Sending verification code..." 
              : step === "success"
              ? "Email verified successfully!"
              : `Enter the 6-digit code sent to ${email}`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-6 py-4">
          {step === "sending" && (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Sending code to your email...</p>
            </div>
          )}

          {step === "verify" && (
            <>
              <InputOTP 
                maxLength={6} 
                value={otp} 
                onChange={setOtp}
                disabled={isVerifying}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>

              {/* Development only - show OTP */}
              {devOtp && (
                <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                  <span className="font-medium">Dev mode:</span> Your code is <span className="font-mono font-bold">{devOtp}</span>
                </div>
              )}

              <div className="flex flex-col gap-2 w-full">
                <Button 
                  onClick={verifyOTP} 
                  disabled={otp.length !== 6 || isVerifying}
                  className="w-full"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify & Reset Password"
                  )}
                </Button>
                
                <Button 
                  variant="ghost" 
                  onClick={sendOTP}
                  disabled={isVerifying}
                  className="text-sm"
                >
                  Resend code
                </Button>
              </div>
            </>
          )}

          {step === "success" && (
            <div className="flex flex-col items-center gap-4">
              <CheckCircle2 className="h-12 w-12 text-success" />
              <p className="text-sm text-muted-foreground">Opening password reset page...</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
