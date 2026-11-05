import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarCheck, X } from "lucide-react";
import VendorBottomNav from "@/components/VendorBottomNav";
import { useSmartBack } from "@/hooks/use-smart-back";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { SkeletonCardList } from "@/components/ui/skeleton-card";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";

const AllBookings = () => {
  const goBack = useSmartBack("/vendor/dashboard");
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [cancelReason, setCancelReason] = useState("");

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['vendorAllBookings', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get vendor profile
      const { data: vendorProfile } = await supabase
        .from('vendor_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!vendorProfile) return [];

      // Fetch all bookings for this vendor
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('*')
        .eq('vendor_profile_id', vendorProfile.id)
        .order('booking_date', { ascending: false });

      return bookingsData?.map(b => ({
        id: b.id,
        service: b.experience_name,
        date: b.booking_date,
        time: b.booking_time,
        guests: b.guests,
        status: b.status,
        amount: b.total_amount,
        host: b.vendor_name || 'Direct Booking',
      })) || [];
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });

  const cancelMutation = useMutation({
    mutationFn: async ({ bookingId, reason }: { bookingId: string; reason: string }) => {
      const response = await supabase.functions.invoke('cancel-booking', {
        body: { bookingId, reason },
      });
      
      if (response.error) {
        throw new Error(response.error.message || 'Failed to cancel booking');
      }
      
      return response.data;
    },
    onSuccess: () => {
      toast.success('Booking cancelled successfully');
      queryClient.invalidateQueries({ queryKey: ['vendorAllBookings'] });
      setCancelDialogOpen(false);
      setSelectedBooking(null);
      setCancelReason("");
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel booking');
    },
  });

  const handleCancelClick = (booking: any) => {
    setSelectedBooking(booking);
    setCancelDialogOpen(true);
  };

  const handleConfirmCancel = () => {
    if (selectedBooking) {
      cancelMutation.mutate({ bookingId: selectedBooking.id, reason: cancelReason });
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
          Back to Dashboard
        </button>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold">All Bookings</h1>
          <p className="text-sm text-muted-foreground">Complete list of your bookings</p>
        </div>

        <div className="space-y-3 max-h-[calc(100vh-240px)] overflow-y-auto">
          {isLoading ? (
            <SkeletonCardList count={4} variant="booking" />
          ) : bookings.length === 0 ? (
            <Card className="p-6 text-center">
              <CalendarCheck className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No bookings yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Bookings will appear here once customers make reservations
              </p>
            </Card>
          ) : (
            bookings.map((booking) => (
              <Card
                key={booking.id}
                className="p-4 hover:shadow-xl transition-all duration-200 hover:scale-[1.01]"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm leading-tight">{booking.service}</h3>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">{booking.date}</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">Time:</span> {booking.time}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">Guests:</span> {booking.guests}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">Amount:</span> ${booking.amount?.toLocaleString() || '0'}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Source:</span> {booking.host}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        booking.status === 'completed' 
                          ? 'bg-success/10 text-success-strong' 
                          : booking.status === 'pending'
                          ? 'bg-rating/10 text-rating-strong'
                          : booking.status === 'cancelled'
                          ? 'bg-danger/10 text-danger-strong'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                  {booking.status !== 'cancelled' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full mt-2 text-danger-strong border-danger-muted hover:bg-danger-wash hover:border-danger-soft"
                      onClick={() => handleCancelClick(booking)}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Cancel Booking
                    </Button>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this booking for "{selectedBooking?.service}"? 
              This action cannot be undone and notifications will be sent to the guest.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2">
            <Textarea
              placeholder="Reason for cancellation (optional)"
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCancelReason("")}>Keep Booking</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmCancel}
              className="bg-danger-strong hover:bg-danger-deep"
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? "Cancelling..." : "Cancel Booking"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <VendorBottomNav />
    </div>
  );
};

export default AllBookings;