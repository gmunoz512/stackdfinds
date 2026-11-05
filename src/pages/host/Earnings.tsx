import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, DollarSign, TrendingUp } from "lucide-react";
import HostBottomNav from "@/components/HostBottomNav";
import { useSmartBack } from "@/hooks/use-smart-back";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";

const HostEarnings = () => {
  const goBack = useSmartBack("/host/dashboard");
  const { user } = useAuthContext();

  const { data: earnings = [], isLoading } = useQuery({
    queryKey: ['hostEarnings', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data } = await supabase
        .from('bookings')
        .select('id, experience_name, vendor_name, host_payout_amount, booking_date, guests')
        .eq('host_user_id', user.id)
        .eq('status', 'completed')
        .order('booking_date', { ascending: false });

      return data?.map((b) => ({
        id: b.id,
        service: b.experience_name,
        vendor: b.vendor_name || 'Unknown',
        amount: b.host_payout_amount || 0,
        bookings: b.guests || 1,
        date: new Date(b.booking_date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }),
      })) || [];
    },
    enabled: !!user,
  });

  const totalEarnings = earnings.reduce((sum, item) => sum + item.amount, 0);
  const totalBookings = earnings.length;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-[375px] mx-auto px-4 py-6 space-y-6">
        <button 
          onClick={goBack}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors active:scale-95"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </button>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Total Earnings</h1>
          <p className="text-sm text-muted-foreground">Detailed earnings breakdown</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 bg-gradient-to-br from-brand/10 to-hot/10 border-brand/20">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-brand" />
                <p className="text-xs text-muted-foreground">Total Earnings</p>
              </div>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-2xl font-bold">${totalEarnings.toFixed(0)}</p>
              )}
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-info/10 to-iris/10 border-info/20">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-info" />
                <p className="text-xs text-muted-foreground">Total Bookings</p>
              </div>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold">{totalBookings}</p>
              )}
            </div>
          </Card>
        </div>

        {/* Earnings List */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Earnings History</h2>
          
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : earnings.length === 0 ? (
            <Card className="p-8 text-center">
              <DollarSign className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium text-foreground">No earnings yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your commission earnings will appear here once guests complete bookings through your referrals
              </p>
            </Card>
          ) : (
            <div className="space-y-3 max-h-[calc(100vh-400px)] overflow-y-auto">
              {earnings.map((item) => (
                <Card
                  key={item.id}
                  className="p-4 hover:shadow-lg transition-all duration-200 hover:scale-[1.01] active:scale-95"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm leading-tight">{item.service}</h3>
                        <p className="text-xs text-muted-foreground mt-1">{item.vendor}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-base font-bold bg-gradient-to-r from-brand to-hot bg-clip-text text-transparent">
                          ${item.amount.toFixed(0)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                      <span>{item.bookings} {item.bookings === 1 ? 'guest' : 'guests'}</span>
                      <span>{item.date}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <HostBottomNav />
    </div>
  );
};

export default HostEarnings;
