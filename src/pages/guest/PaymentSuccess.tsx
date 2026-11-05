import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, Calendar, Clock, Users, Mail, Loader2, XCircle, AlertTriangle, Star, CalendarPlus, ChevronDown } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useBooking } from "@/contexts/BookingContext";
import { useEffect, useState } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import confetti from "canvas-confetti";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { ReviewDialog } from "@/components/ReviewDialog";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { bookingData, guestData, clearBookingData, updateBookingData } = useBooking();
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const sessionId = searchParams.get("session_id");

  useEffect(() => {
    const fetchBookingData = async () => {
      if (!sessionId) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch the booking using the stripe session ID
        const { data: booking, error: bookingError } = await supabase
          .from('bookings')
          .select('id, vendor_profile_id')
          .eq('stripe_session_id', sessionId)
          .maybeSingle();

        if (booking) {
          // Fetch vendor cancellation hours if we have a vendor profile
          let cancellationHours = 24; // default
          if (booking.vendor_profile_id) {
            const { data: vendorProfile } = await supabase
              .from('vendor_profiles')
              .select('cancellation_hours')
              .eq('id', booking.vendor_profile_id)
              .single();
            
            if (vendorProfile?.cancellation_hours) {
              cancellationHours = vendorProfile.cancellation_hours;
            }
          }

          // Update booking context with the booking ID and cancellation info
          updateBookingData({
            bookingId: booking.id,
            vendorProfileId: booking.vendor_profile_id || undefined,
            cancellationHours,
          });
        }
      } catch (error) {
        console.error("Error fetching booking data:", error);
      }

      // Small delay then show content with confetti
      setTimeout(() => {
        setIsLoading(false);
        setTimeout(() => {
          setShowContent(true);
          
          const duration = 3000;
          const end = Date.now() + duration;
          const colors = ['#f97316', '#ec4899', '#22c55e', '#3b82f6'];

          (function frame() {
            confetti({
              particleCount: 4,
              angle: 60,
              spread: 55,
              origin: { x: 0 },
              colors: colors
            });
            confetti({
              particleCount: 4,
              angle: 120,
              spread: 55,
              origin: { x: 1 },
              colors: colors
            });

            if (Date.now() < end) {
              requestAnimationFrame(frame);
            }
          }());
        }, 100);
      }, 500);
    };

    fetchBookingData();
  }, [sessionId, updateBookingData]);

  // Calculate if cancellation is still allowed
  const canCancel = () => {
    if (!bookingData.bookingId || !bookingData.date || !bookingData.time) return false;
    
    const cancellationHours = bookingData.cancellationHours ?? 24;
    const bookingDateTime = new Date(`${bookingData.date}T${bookingData.time}:00`);
    const now = new Date();
    const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    return hoursUntilBooking >= cancellationHours;
  };

  const getHoursUntilBooking = () => {
    if (!bookingData.date || !bookingData.time) return 0;
    const bookingDateTime = new Date(`${bookingData.date}T${bookingData.time}:00`);
    const now = new Date();
    return Math.floor((bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60));
  };

  const handleCancelBooking = async () => {
    if (!bookingData.bookingId) {
      toast({
        title: "Error",
        description: "No booking ID found. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    setIsCancelling(true);

    try {
      const { data, error } = await supabase.functions.invoke('cancel-booking', {
        body: {
          bookingId: bookingData.bookingId,
          reason: "Cancelled by guest",
          guestCancellation: true,
        },
      });

      if (error) throw error;

      if (data?.success === false) {
        toast({
          title: "Cannot Cancel",
          description: data.message,
          variant: "destructive",
        });
        return;
      }

      setIsCancelled(true);
      toast({
        title: "Booking Cancelled",
        description: "Your booking has been cancelled. You will receive a confirmation email shortly.",
      });
      clearBookingData();
    } catch (error: any) {
      console.error("Cancellation error:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to cancel booking. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  // Calendar helper functions
  const formatDateForCalendar = (dateStr: string, timeStr: string) => {
    const date = new Date(dateStr);
    const [hours, minutes] = timeStr.split(':').map(Number);
    date.setHours(hours || 9, minutes || 0, 0, 0);
    return date;
  };

  const generateGoogleCalendarUrl = () => {
    if (!bookingData.date || !bookingData.time) return '';
    const startDate = formatDateForCalendar(bookingData.date, bookingData.time);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

    const formatDate = (date: Date) => 
      date.toISOString().replace(/-|:|\.\d{3}/g, '');

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: bookingData.experienceName || 'Experience Booking',
      dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
      details: `Guests: ${bookingData.guests}\nTotal: $${bookingData.totalPrice}`,
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  const generateICSContent = () => {
    if (!bookingData.date || !bookingData.time) return '';
    const startDate = formatDateForCalendar(bookingData.date, bookingData.time);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

    const formatDate = (date: Date) => 
      date.toISOString().replace(/-|:|\.\d{3}/g, '').slice(0, 15) + 'Z';

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Stackd//Booking//EN
BEGIN:VEVENT
UID:${Date.now()}@stackd.app
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${bookingData.experienceName || 'Experience Booking'}
DESCRIPTION:Guests: ${bookingData.guests}\\nTotal: $${bookingData.totalPrice}
END:VEVENT
END:VCALENDAR`;
  };

  const downloadICS = () => {
    const icsContent = generateICSContent();
    if (!icsContent) return;
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(bookingData.experienceName || 'booking').replace(/\s+/g, '-')}-booking.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const openGoogleCalendar = () => {
    const url = generateGoogleCalendarUrl();
    if (url) window.open(url, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Confirming your payment...</p>
        </div>
      </div>
    );
  }

  const hasBookingDetails = Boolean(bookingData.experienceName);
  if (!hasBookingDetails && !sessionId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="p-8 text-center max-w-sm space-y-4 rounded-2xl">
          <div className="mx-auto w-14 h-14 rounded-full bg-muted flex items-center justify-center">
            <CheckCircle className="h-7 w-7 text-muted-foreground" />
          </div>
          <h1 className="text-xl">No confirmation to show</h1>
          <p className="text-sm text-muted-foreground">
            Book an experience to see your confirmation here.
          </p>
          <Button variant="gradient" className="rounded-full" onClick={() => navigate('/appview')}>
            Back to Explore
          </Button>
        </Card>
      </div>
    );
  }

  // If booking was cancelled, show cancelled state
  if (isCancelled) {
    return (
      <div className="min-h-screen bg-background pb-8">
        <div className="max-w-[375px] mx-auto">
          <div className="bg-card border-b p-4">
            <div className="text-center text-sm text-muted-foreground mb-2">Booking Cancelled</div>
          </div>

          <div className="px-4 py-8 space-y-6">
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-danger-light to-danger-strong">
                <XCircle className="h-12 w-12 text-paper" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-medium">Booking Cancelled</h1>
                <p className="text-muted-foreground">
                  Your booking has been successfully cancelled
                </p>
              </div>
            </div>

            <Card className="p-5 bg-muted/30">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-medium text-sm">Cancellation Confirmed</p>
                  <p className="text-xs text-muted-foreground">
                    A cancellation confirmation email has been sent. If you paid for this booking, a refund will be processed within 5-10 business days.
                  </p>
                </div>
              </div>
            </Card>

            <Button 
              variant="gradient" 
              className="w-full" 
              size="lg"
              onClick={() => navigate('/appview')}
            >
              Back to Experiences
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="shot-frame sm:border-x sm:border-border sm:shadow-2xl">
        {/* Progress Indicator */}
        <div className="bg-card/80 border-b border-border p-4">
          <div className="text-center text-xs uppercase tracking-widest text-muted-foreground mb-2">Confirmed</div>
          <div className="flex gap-1">
            <div className="h-1 flex-1 bg-gradient-to-r from-brand to-hot rounded-full" />
            <div className="h-1 flex-1 bg-gradient-to-r from-brand to-hot rounded-full" />
            <div className="h-1 flex-1 bg-gradient-to-r from-brand to-hot rounded-full" />
          </div>
        </div>

        <div className={`px-4 py-8 space-y-6 transition-all duration-500 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Success Icon */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-success-light to-success-strong animate-scale-in">
              <CheckCircle className="h-12 w-12 text-paper" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl">
                {sessionId ? 'Payment successful' : 'Booking confirmed'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {sessionId
                  ? 'Your booking is confirmed. Details are below.'
                  : 'Preview of your booking details'}
              </p>
            </div>
          </div>

          {/* Booking Details */}
          <Card className="p-5 space-y-4 rounded-2xl border-border/80">
            <div className="space-y-3">
              <h2 className="font-semibold text-lg">{bookingData.experienceName || "Experience Booked"}</h2>
              
              <div className="space-y-3 text-sm">
                {bookingData.date && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Date</p>
                      <p className="text-muted-foreground">{bookingData.date}</p>
                    </div>
                  </div>
                )}

                {bookingData.time && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center flex-shrink-0">
                      <Clock className="h-5 w-5 text-secondary" />
                    </div>
                    <div>
                      <p className="font-medium">Time</p>
                      <p className="text-muted-foreground">{bookingData.time}</p>
                    </div>
                  </div>
                )}

                {bookingData.guests > 0 && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Guests</p>
                      <p className="text-muted-foreground">{bookingData.guests} {bookingData.guests === 1 ? 'person' : 'people'}</p>
                    </div>
                  </div>
                )}
              </div>

              {bookingData.totalPrice > 0 && (
                <div className="pt-4 mt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">{sessionId ? 'Total paid' : 'Total'}</span>
                    <span className="text-2xl font-bold bg-gradient-to-r from-brand to-hot bg-clip-text text-transparent">
                      ${bookingData.totalPrice}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Cancellation Policy */}
          {bookingData.bookingId && (
            <Card className="p-5 space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Cancellation Policy
              </h3>
              <p className="text-sm text-muted-foreground">
                Free cancellation up to {bookingData.cancellationHours ?? 24} hours before your booking.
                {canCancel() ? (
                  <span className="block mt-1 text-success-strong dark:text-success-light">
                    You have {getHoursUntilBooking()} hours left to cancel.
                  </span>
                ) : (
                  <span className="block mt-1 text-danger-strong dark:text-danger-light">
                    Cancellation window has passed ({getHoursUntilBooking()} hours until booking).
                  </span>
                )}
              </p>
            </Card>
          )}

          {/* Email Confirmation */}
          <Card className="p-5 bg-muted/40 rounded-2xl border-border/60">
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium text-sm">
                  {user?.email || guestData.email ? 'Confirmation email' : 'Confirmation'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user?.email || guestData.email
                    ? <>Details will go to <span className="font-medium text-foreground">{user?.email || guestData.email}</span></>
                    : 'Sign in to receive a confirmation email after checkout.'}
                </p>
              </div>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            {/* Add to Calendar */}
            {bookingData.date && bookingData.time && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="w-full gap-2" 
                    size="lg"
                  >
                    <CalendarPlus className="h-5 w-5" />
                    Add to Calendar
                    <ChevronDown className="h-4 w-4 ml-auto" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[calc(100vw-2rem)] max-w-[343px]">
                  <DropdownMenuItem onClick={openGoogleCalendar} className="cursor-pointer">
                    <span className="mr-2">📅</span>
                    Google Calendar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={downloadICS} className="cursor-pointer">
                    <span className="mr-2">🍎</span>
                    Apple Calendar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Leave a Review Button */}
            {!hasReviewed && user && (
              <Button
                variant="outline"
                className="w-full"
                size="lg"
                onClick={() => setShowReviewDialog(true)}
              >
                <Star className="h-5 w-5 mr-2" />
                Leave a Review
              </Button>
            )}

            <Button 
              variant="gradient" 
              className="w-full" 
              size="lg"
              onClick={() => {
                clearBookingData();
                navigate('/appview');
              }}
            >
              Back to Experiences
            </Button>

            {/* Cancel Booking Button */}
            {bookingData.bookingId && canCancel() && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="w-full text-destructive hover:text-destructive hover:bg-destructive/10" 
                    size="lg"
                  >
                    <XCircle className="h-5 w-5 mr-2" />
                    Cancel Booking
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Cancel This Booking?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to cancel your booking for <strong>{bookingData.experienceName}</strong> on {bookingData.date} at {bookingData.time}?
                      <br /><br />
                      If you paid for this booking, a refund will be processed to your original payment method within 5-10 business days.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep Booking</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancelBooking}
                      disabled={isCancelling}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {isCancelling ? "Cancelling..." : "Yes, Cancel Booking"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </div>

      {/* Review Dialog */}
      <ReviewDialog
        open={showReviewDialog}
        onOpenChange={setShowReviewDialog}
        bookingId={bookingData.bookingId}
        vendorProfileId={bookingData.vendorProfileId}
        experienceName={bookingData.experienceName}
        userId={user?.id}
        onReviewSubmitted={() => setHasReviewed(true)}
      />
    </div>
  );
};

export default PaymentSuccess;
