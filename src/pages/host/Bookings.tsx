import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, DollarSign } from "lucide-react";
import HostBottomNav from "@/components/HostBottomNav";
import { useSmartBack } from "@/hooks/use-smart-back";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";

const HostBookings = () => {
  const goBack = useSmartBack("/host/dashboard");
  const { user } = useAuthContext();

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['hostAllBookings', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('host_user_id', user.id)
        .order('booking_date', { ascending: false });

      return data || [];
    },
    enabled: !!user,
  });

  const totalRevenue = bookings.reduce((sum, b) => sum + (b.host_payout_amount || 0), 0);

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
          <h1 className="text-2xl font-bold">All Bookings</h1>
          <p className="text-sm text-muted-foreground">Complete booking history</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <p className="text-xs text-muted-foreground">Total Bookings</p>
              </div>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold">{bookings.length}</p>
              )}
            </div>
          </Card>
          <Card className="p-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                <p className="text-xs text-muted-foreground">Total Revenue</p>
              </div>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
              )}
            </div>
          </Card>
        </div>

        {/* All Bookings List */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Booking History</h2>
          
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
              ))}
            </div>
          ) : bookings.length === 0 ? (
            <Card className="p-8 text-center">
              <Calendar className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium text-foreground">No bookings yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your bookings will appear here once guests book through your referrals
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {bookings.map((booking) => (
                <Card
                  key={booking.id}
                  className="p-5 hover:shadow-lg transition-all duration-200"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold mb-1">{booking.experience_name}</p>
                        <p className="text-sm text-muted-foreground">{booking.vendor_name || 'Unknown Vendor'}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-lg bg-gradient-to-r from-brand to-hot bg-clip-text text-transparent">
                          ${(booking.host_payout_amount || 0).toFixed(0)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">
                          {new Date(booking.booking_date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${
                          booking.status === 'completed' ? 'bg-success' :
                          booking.status === 'cancelled' ? 'bg-danger' :
                          'bg-rating'
                        }`}></div>
                        <p className={`text-xs font-medium ${
                          booking.status === 'completed' ? 'text-success-strong' :
                          booking.status === 'cancelled' ? 'text-danger-strong' :
                          'text-rating-strong'
                        }`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </p>
                      </div>
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

export default HostBookings;
