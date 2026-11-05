import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Calendar, Clock, Users, CalendarPlus, ChevronDown, Loader2, MessageSquare, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSmartBack } from "@/hooks/use-smart-back";
import { PageTransition } from "@/components/PageTransition";
import { SignInPrompt } from "@/components/SignInPrompt";

interface Booking {
  id: string;
  experience_name: string;
  booking_date: string;
  booking_time: string;
  guests: number;
  total_amount: number;
  status: string;
  vendor_name: string | null;
  host_user_id: string | null;
}

const MyBookings = () => {
  const navigate = useNavigate();
  const goBack = useSmartBack("/appview");
  const { user } = useAuthContext();

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['myBookings', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('booking_date', { ascending: false });

      if (error) {
        console.error('Error fetching bookings:', error);
        return [];
      }

      return data as Booking[];
    },
    enabled: !!user,
  });

  const formatDateForCalendar = (dateStr: string, timeStr: string) => {
    const date = new Date(dateStr);
    const [hours, minutes] = timeStr.split(':').map(Number);
    date.setHours(hours || 9, minutes || 0, 0, 0);
    return date;
  };

  const generateGoogleCalendarUrl = (booking: Booking) => {
    const startDate = formatDateForCalendar(booking.booking_date, booking.booking_time);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

    const formatDate = (date: Date) => 
      date.toISOString().replace(/-|:|\.\d{3}/g, '');

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: booking.experience_name,
      dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
      details: `${booking.vendor_name ? `Booked with ${booking.vendor_name}\n` : ''}Guests: ${booking.guests}\nTotal: $${booking.total_amount}`,
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  const generateICSContent = (booking: Booking) => {
    const startDate = formatDateForCalendar(booking.booking_date, booking.booking_time);
    const endDate = new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

    const formatDate = (date: Date) => 
      date.toISOString().replace(/-|:|\.\d{3}/g, '').slice(0, 15) + 'Z';

    return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Stackd//Booking//EN
BEGIN:VEVENT
UID:${booking.id}@stackd.app
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startDate)}
DTEND:${formatDate(endDate)}
SUMMARY:${booking.experience_name}
DESCRIPTION:${booking.vendor_name ? `Booked with ${booking.vendor_name}\\n` : ''}Guests: ${booking.guests}\\nTotal: $${booking.total_amount}
END:VEVENT
END:VCALENDAR`;
  };

  const downloadICS = (booking: Booking) => {
    const icsContent = generateICSContent(booking);
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${booking.experience_name.replace(/\s+/g, '-')}-booking.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const openGoogleCalendar = (booking: Booking) => {
    window.open(generateGoogleCalendarUrl(booking), '_blank');
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return 'bg-info';
      case 'completed':
        return 'bg-success';
      case 'pending':
        return 'bg-rating';
      case 'cancelled':
        return 'bg-danger';
      case 'refunded':
        return 'bg-brand';
      default:
        return 'bg-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  const isUpcoming = (dateStr: string, timeStr: string) => {
    const bookingDate = formatDateForCalendar(dateStr, timeStr);
    return bookingDate > new Date();
  };

  if (!user) {
    return (
      <SignInPrompt
        title="Sign in to view your bookings"
        description="Track upcoming trips, message hosts and request refunds."
      />
    );
  }


  return (
    <PageTransition className="min-h-screen bg-background pb-8">
      <div className="max-w-[375px] mx-auto px-4 py-6 space-y-6">
        <button 
          onClick={goBack}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors active:scale-95"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </button>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold">My Bookings</h1>
          <p className="text-sm text-muted-foreground">Your booking history</p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : bookings.length === 0 ? (
          <Card className="p-6 text-center space-y-4">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground" />
            <div className="space-y-2">
              <h2 className="font-semibold">No bookings yet</h2>
              <p className="text-sm text-muted-foreground">
                When you book an experience, it will appear here.
              </p>
            </div>
            <Button onClick={() => navigate('/appview')} variant="gradient">
              Explore Experiences
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <Card key={booking.id} className="p-5 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold mb-1">{booking.experience_name}</p>
                      {booking.vendor_name && (
                        <p className="text-sm text-muted-foreground">{booking.vendor_name}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-lg bg-gradient-to-r from-brand to-hot bg-clip-text text-transparent">
                        ${booking.total_amount}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      <span>{booking.booking_date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      <span>{booking.booking_time}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      <span>{booking.guests} {booking.guests === 1 ? 'guest' : 'guests'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${getStatusColor(booking.status)}`} />
                      <p className="text-xs font-medium">{getStatusText(booking.status)}</p>
                      {isUpcoming(booking.booking_date, booking.booking_time) && booking.status !== 'cancelled' && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          Upcoming
                        </span>
                      )}
                    </div>

                    {booking.status !== 'cancelled' && booking.status !== 'refunded' && (
                      <div className="flex gap-1">
                        {booking.host_user_id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 h-8 px-2"
                            onClick={() => navigate(`/bookings/${booking.id}/chat`)}
                          >
                            <MessageSquare className="h-4 w-4" />
                            <span className="text-xs">Chat</span>
                          </Button>
                        )}
                        {(booking.status === 'completed' || booking.status === 'confirmed') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 h-8 px-2 text-destructive hover:text-destructive"
                            onClick={() => navigate(`/bookings/${booking.id}/refund`)}
                          >
                            <ShieldCheck className="h-4 w-4" />
                            <span className="text-xs">Refund</span>
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="gap-1 h-8 px-2">
                              <CalendarPlus className="h-4 w-4" />
                              <ChevronDown className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openGoogleCalendar(booking)} className="cursor-pointer">
                              <span className="mr-2">📅</span>
                              Google Calendar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => downloadICS(booking)} className="cursor-pointer">
                              <span className="mr-2">🍎</span>
                              Apple Calendar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default MyBookings;
