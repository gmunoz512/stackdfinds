import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard, CheckCircle2, AlertCircle, ExternalLink, Loader2 } from "lucide-react";
import HostBottomNav from "@/components/HostBottomNav";
import { useSmartBack } from "@/hooks/use-smart-back";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const PaymentSettings = () => {
  const goBack = useSmartBack("/host/profile");
  const { user } = useAuthContext();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isOpeningDashboard, setIsOpeningDashboard] = useState(false);
  const [connectStatus, setConnectStatus] = useState<{
    connected: boolean;
    onboardingComplete: boolean;
    accountId?: string;
  } | null>(null);

  useEffect(() => {
    if (user) {
      checkConnectStatus();
    }
  }, [user]);

  const checkConnectStatus = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('check-connect-status', {
        body: { accountType: 'host' }
      });

      if (error) throw error;
      setConnectStatus(data);
    } catch (error) {
      console.error('Error checking connect status:', error);
      toast({
        title: "Error",
        description: "Failed to check payment status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnectStripe = async () => {
    setIsConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-connect-account', {
        body: { accountType: 'host' }
      });

      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
        toast({
          title: "Stripe Setup",
          description: "Complete your setup in the new tab, then refresh this page.",
        });
      }
    } catch (error) {
      console.error('Error connecting Stripe:', error);
      toast({
        title: "Error",
        description: "Failed to start Stripe setup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleOpenDashboard = async () => {
    setIsOpeningDashboard(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-stripe-login-link', {
        body: { accountType: 'host' }
      });

      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Error opening Stripe dashboard:', error);
      toast({
        title: "Error",
        description: error?.message || "Failed to open payment dashboard. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsOpeningDashboard(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-[375px] mx-auto px-4 py-6 space-y-6">
        <button 
          onClick={goBack}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors active:scale-95"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Profile
        </button>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Payment Settings</h1>
          <p className="text-sm text-muted-foreground">Manage how you receive your commissions</p>
        </div>

        {isLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64 mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ) : connectStatus?.onboardingComplete ? (
          // Connected State
          <Card className="border-success/20 bg-success/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success-strong" />
                <CardTitle className="text-lg">Payouts Enabled</CardTitle>
              </div>
              <CardDescription>
                Your bank account is connected and ready to receive commissions from vendor bookings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium">How payouts work:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• When guests book through your link, you earn commission</li>
                  <li>• Stripe automatically deposits to your bank</li>
                  <li>• Payouts are processed on Stripe's schedule (usually daily)</li>
                </ul>
              </div>

              <Button 
                onClick={handleOpenDashboard}
                disabled={isOpeningDashboard}
                className="w-full"
                variant="outline"
              >
                {isOpeningDashboard ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Opening...
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Manage Payout Settings
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                View balance, update bank details, and change payout schedule
              </p>
            </CardContent>
          </Card>
        ) : connectStatus?.connected ? (
          // Partially Connected - Needs to complete onboarding
          <Card className="border-rating/20 bg-rating/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-rating-strong" />
                <CardTitle className="text-lg">Complete Setup</CardTitle>
              </div>
              <CardDescription>
                You've started the setup but need to complete a few more steps to receive payouts.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                onClick={handleConnectStripe}
                disabled={isConnecting}
                className="w-full"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Opening Setup...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Continue Setup
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ) : (
          // Not Connected State
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Set Up Payouts</CardTitle>
              </div>
              <CardDescription>
                Connect your bank account to start receiving commissions when guests book through your profile.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-medium">What you'll need:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Bank account or debit card details</li>
                  <li>• Personal identification (for verification)</li>
                  <li>• About 5 minutes to complete</li>
                </ul>
              </div>

              <Button 
                onClick={handleConnectStripe}
                disabled={isConnecting}
                className="w-full"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Starting Setup...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Connect Bank Account
                  </>
                )}
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Powered by Stripe for secure payments
              </p>
            </CardContent>
          </Card>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={checkConnectStatus}
          className="w-full text-muted-foreground"
        >
          Refresh Status
        </Button>
      </div>

      <HostBottomNav />
    </div>
  );
};

export default PaymentSettings;
