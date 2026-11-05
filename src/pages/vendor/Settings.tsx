import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import VendorBottomNav from "@/components/VendorBottomNav";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const CANCELLATION_OPTIONS = [
  { value: "6", label: "6 hours before" },
  { value: "12", label: "12 hours before" },
  { value: "24", label: "24 hours before" },
  { value: "48", label: "48 hours before (2 days)" },
  { value: "72", label: "72 hours before (3 days)" },
  { value: "168", label: "168 hours before (7 days)" },
];

const VendorSettings = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [cancellationHours, setCancellationHours] = useState("24");
  const [vendorProfileId, setVendorProfileId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchVendorSettings();
    }
  }, [user]);

  const fetchVendorSettings = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('vendor_profiles')
        .select('id, cancellation_hours')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      if (data) {
        setVendorProfileId(data.id);
        setCancellationHours(data.cancellation_hours?.toString() || "24");
      }
    } catch (error) {
      console.error('Error fetching vendor settings:', error);
      toast({
        title: "Error",
        description: "Failed to load settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!vendorProfileId) {
      toast({
        title: "Error",
        description: "No vendor profile found. Please create a profile first.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('vendor_profiles')
        .update({ cancellation_hours: parseInt(cancellationHours) })
        .eq('id', vendorProfileId);
      
      if (error) throw error;
      
      toast({
        title: "Settings saved",
        description: "Your cancellation policy has been updated.",
      });
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-[375px] mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-muted transition-colors active:scale-95"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-sm text-muted-foreground">Configure your business policies</p>
          </div>
        </div>

        {/* Cancellation Policy Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Cancellation Policy</CardTitle>
            </div>
            <CardDescription>
              Set how far in advance guests must cancel their booking to receive a refund.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="cancellation-hours">Cancellation window</Label>
                  <Select
                    value={cancellationHours}
                    onValueChange={setCancellationHours}
                  >
                    <SelectTrigger id="cancellation-hours">
                      <SelectValue placeholder="Select cancellation window" />
                    </SelectTrigger>
                    <SelectContent>
                      {CANCELLATION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground">
                  <p>
                    Guests will be able to cancel their booking up to{" "}
                    <span className="font-medium text-foreground">
                      {cancellationHours} hours
                    </span>{" "}
                    before the scheduled time. Cancellations made after this window will not be eligible for a refund.
                  </p>
                </div>

                <Button
                  onClick={handleSave}
                  disabled={isSaving || !vendorProfileId}
                  className="w-full"
                >
                  {isSaving ? (
                    "Saving..."
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Settings
                    </>
                  )}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <VendorBottomNav />
    </div>
  );
};

export default VendorSettings;
