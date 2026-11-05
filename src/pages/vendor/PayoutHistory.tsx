import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Receipt, TrendingUp, Calendar, DollarSign, Users } from "lucide-react";
import VendorBottomNav from "@/components/VendorBottomNav";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface BookingPayout {
  id: string;
  booking_date: string;
  experience_name: string;
  total_amount: number;
  vendor_payout_amount: number | null;
  payout_status: string | null;
  currency: string;
  created_at: string;
  guests: number;
}

const VendorPayoutHistory = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [payouts, setPayouts] = useState<BookingPayout[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [vendorProfileId, setVendorProfileId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchVendorProfile();
    }
  }, [user]);

  useEffect(() => {
    if (vendorProfileId) {
      fetchPayoutHistory();
    }
  }, [vendorProfileId]);

  const fetchVendorProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('vendor_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setVendorProfileId(data?.id);
    } catch (error) {
      console.error('Error fetching vendor profile:', error);
      setIsLoading(false);
    }
  };

  const fetchPayoutHistory = async () => {
    if (!vendorProfileId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('id, booking_date, experience_name, total_amount, vendor_payout_amount, payout_status, currency, created_at, guests')
        .eq('vendor_profile_id', vendorProfileId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPayouts(data || []);
      
      // Calculate total earnings
      const total = (data || []).reduce((sum, payout) => {
        return sum + (payout.vendor_payout_amount || 0);
      }, 0);
      setTotalEarnings(total);
    } catch (error) {
      console.error('Error fetching payout history:', error);
      toast({
        title: "Error",
        description: "Failed to load payout history. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'completed':
      case 'paid':
      case 'processed':
        return <Badge variant="outline" className="bg-success/10 text-success-strong border-success/20">Paid</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-rating/10 text-rating-strong border-rating/20">Pending</Badge>;
      case 'failed':
        return <Badge variant="outline" className="bg-danger/10 text-danger-strong border-danger/20">Failed</Badge>;
      default:
        return <Badge variant="outline" className="bg-info/10 text-info-strong border-info/20">Processing</Badge>;
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100); // Assuming amounts are in cents
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-[375px] mx-auto px-4 py-6 space-y-6">
        <button 
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors active:scale-95"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Payout History</h1>
          <p className="text-sm text-muted-foreground">Track your earnings from bookings</p>
        </div>

        {/* Total Earnings Card */}
        {!isLoading && payouts.length > 0 && (
          <Card className="p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/20 rounded-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
                <p className="text-2xl font-bold">{formatCurrency(totalEarnings)}</p>
              </div>
            </div>
          </Card>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4">
                <div className="space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : payouts.length === 0 ? (
          <Card className="p-8 text-center space-y-4">
            <div className="flex justify-center">
              <Receipt className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No Payouts Yet</h3>
            <p className="text-sm text-muted-foreground">
              Your payout history will appear here once guests start booking your experiences.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {payouts.map((payout) => (
              <Card key={payout.id} className="p-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{payout.experience_name}</h3>
                    </div>
                    {getStatusBadge(payout.payout_status)}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{format(new Date(payout.booking_date), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      <span>{payout.guests} guest{payout.guests !== 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-border/50">
                    <div className="text-sm text-muted-foreground">
                      Booking: {formatCurrency(payout.total_amount, payout.currency)}
                    </div>
                    <div className="flex items-center gap-1 font-semibold text-success-strong">
                      <DollarSign className="h-4 w-4" />
                      <span>+{formatCurrency(payout.vendor_payout_amount || 0, payout.currency)}</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <VendorBottomNav />
    </div>
  );
};

export default VendorPayoutHistory;
