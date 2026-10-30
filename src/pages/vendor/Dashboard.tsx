import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DollarSign, CalendarCheck, Users, StarIcon, LogOut, TrendingUp, ArrowUpRight, Eye, CreditCard, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import VendorBottomNav from "@/components/VendorBottomNav";
import { PageTransition } from "@/components/PageTransition";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuthContext } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { VendorOnboardingWizard } from "@/components/onboarding";
import HostVerificationCard from "@/components/onboarding/HostVerificationCard";
import { resolveGoogleRating } from "@/lib/googleRating";

const VendorDashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isConnecting, setIsConnecting] = useState(false);
  const [showOnboardingWizard, setShowOnboardingWizard] = useState(false);
  const { user } = useAuthContext();

  // Fetch real vendor stats from database
  const { data: stats = [], isLoading: isLoadingStats } = useQuery({
    queryKey: ['vendorDashboardStats', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Fetch bookings for this vendor
      const { data: vendorProfile } = await supabase
        .from('vendor_profiles')
        .select('id, google_rating')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!vendorProfile) {
        return [
          { label: "Total Revenue", value: "$0", icon: "DollarSign" },
          { label: "Bookings", value: "0", icon: "Calendar" },
          { label: "Active Hosts", value: "0", icon: "Users" },
          { label: "Rating", value: "N/A", icon: "Star" },
        ];
      }

      // Fetch bookings for this vendor profile
      const { data: bookings } = await supabase
        .from('bookings')
        .select('total_amount, vendor_payout_amount')
        .eq('vendor_profile_id', vendorProfile.id)
        .eq('status', 'completed');

      const totalRevenue = bookings?.reduce((sum, b) => sum + (b.vendor_payout_amount || b.total_amount || 0), 0) || 0;
      const bookingCount = bookings?.length || 0;

      // Fetch host links count
      const { count: hostCount } = await supabase
        .from('host_vendor_links')
        .select('*', { count: 'exact', head: true })
        .eq('vendor_profile_id', vendorProfile.id);

      const resolved = resolveGoogleRating({ googleRating: vendorProfile.google_rating });
      const rating = resolved ? resolved.rating.toFixed(1) : "No rating yet";

      return [
        { label: "Total Revenue", value: `$${totalRevenue.toLocaleString()}`, icon: "DollarSign" },
        { label: "Bookings", value: bookingCount.toString(), icon: "Calendar" },
        { label: "Active Hosts", value: (hostCount || 0).toString(), icon: "Users" },
        { label: "Rating", value: rating, icon: "Star" },
      ];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch real upcoming bookings from database
  const { data: bookings = [], isLoading: isLoadingBookings } = useQuery({
    queryKey: ['vendorUpcomingBookings', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: vendorProfile } = await supabase
        .from('vendor_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!vendorProfile) return [];

      const { data: bookingsData } = await supabase
        .from('bookings')
        .select('*')
        .eq('vendor_profile_id', vendorProfile.id)
        .gte('booking_date', new Date().toISOString().split('T')[0])
        .order('booking_date', { ascending: true })
        .limit(5);

      return bookingsData?.map(b => ({
        service: b.experience_name,
        date: b.booking_date,
        time: b.booking_time,
        guest: `${b.guests} guest${b.guests > 1 ? 's' : ''}`,
        host: b.vendor_name || 'Direct Booking',
      })) || [];
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
  });

  // Check Stripe Connect status
  const { data: connectStatus, refetch: refetchConnectStatus } = useQuery({
    queryKey: ['vendorConnectStatus'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { connected: false, onboardingComplete: false };

      const { data, error } = await supabase.functions.invoke('check-connect-status', {
        body: { accountType: 'vendor' },
      });

      if (error) {
        console.error('Error checking connect status:', error);
        return { connected: false, onboardingComplete: false };
      }
      return data;
    },
    staleTime: 30 * 1000,
  });

  // Fetch identity verification status
  const { data: profileStatus, refetch: refetchProfile } = useQuery({
    queryKey: ['vendorProfileStatus', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('host_verification_status, host_verification_notes, government_id_url, selfie_url')
        .eq('user_id', user.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  // Handle Stripe Connect return
  useEffect(() => {
    if (searchParams.get('stripe_success') === 'true') {
      toast.success('Stripe account connected successfully!');
      refetchConnectStatus();
      window.history.replaceState({}, '', '/vendor/dashboard');
    } else if (searchParams.get('stripe_refresh') === 'true') {
      toast.info('Please complete your Stripe account setup');
      window.history.replaceState({}, '', '/vendor/dashboard');
    }
  }, [searchParams, refetchConnectStatus]);

  // Check if vendor profile exists, if not show onboarding wizard
  useEffect(() => {
    const checkVendorProfile = async () => {
      if (!user) return;
      
      const { data: vendorProfile } = await supabase
        .from('vendor_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      // Show wizard if no vendor profile exists
      if (!vendorProfile) {
        // Check if they've previously dismissed
        const dismissed = sessionStorage.getItem('vendorOnboardingDismissed');
        if (!dismissed) {
          setShowOnboardingWizard(true);
        }
      }
    };
    
    checkVendorProfile();
  }, [user]);

  const handleConnectStripe = async () => {
    setIsConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-connect-account', {
        body: { accountType: 'vendor' },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error connecting Stripe:', error);
      toast.error('Failed to start Stripe onboarding');
      setIsConnecting(false);
    }
  };
  
  const iconMap = {
    DollarSign,
    Calendar: CalendarCheck,
    Users,
    Star: StarIcon,
  };

  return (
    <>
      <VendorOnboardingWizard 
        open={showOnboardingWizard} 
        onOpenChange={(open) => {
          setShowOnboardingWizard(open);
          if (!open) {
            sessionStorage.setItem('vendorOnboardingDismissed', 'true');
          }
        }} 
      />
      <PageTransition className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 pb-24">
        <div className="max-w-[375px] mx-auto">
        {/* Hero Header with Gradient */}
        <div className="bg-gradient-to-br from-brand to-hot px-4 pt-6 pb-20 rounded-b-3xl shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-paper">Welcome Back</h1>
                <p className="text-sm text-paper/80">Your business overview today</p>
              </div>
              <button
                onClick={() => navigate('/signout')}
                className="p-2 rounded-xl bg-paper/10 backdrop-blur-sm hover:bg-paper/20 transition-all active:scale-95"
                aria-label="Sign out"
              >
                <LogOut className="h-5 w-5 text-paper" />
              </button>
            </div>
            
            {/* Preview Profile Button */}
            <Button
              onClick={() => navigate('/vendor/preview')}
              className="w-full bg-paper/20 backdrop-blur-sm hover:bg-paper/30 text-paper border-paper/30 gap-2"
              variant="outline"
            >
              <Eye className="h-4 w-4" />
              Preview Your Profile
            </Button>

            {/* Stripe Connect Status Card */}
            <Card className="mt-4 p-4 bg-paper/10 backdrop-blur-sm border-paper/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${connectStatus?.onboardingComplete ? 'bg-success/20' : 'bg-rating/20'}`}>
                    {connectStatus?.onboardingComplete ? (
                      <CheckCircle2 className="h-5 w-5 text-success-light" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-rating-light" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-paper">
                      {connectStatus?.onboardingComplete ? 'Payments Active' : 'Set Up Payments'}
                    </p>
                    <p className="text-xs text-paper/70">
                      {connectStatus?.onboardingComplete 
                        ? 'Receive payouts directly to your bank' 
                        : 'Connect your bank to receive earnings'}
                    </p>
                  </div>
                </div>
                {!connectStatus?.onboardingComplete && (
                  <Button
                    onClick={handleConnectStripe}
                    disabled={isConnecting}
                    size="sm"
                    className="bg-paper text-brand-strong hover:bg-paper/90 gap-1"
                  >
                    {isConnecting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CreditCard className="h-4 w-4" />
                    )}
                    {isConnecting ? 'Loading...' : 'Connect'}
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>

        <div className="px-4 mt-6">
          {profileStatus && profileStatus.host_verification_status !== 'verified' && (
            <HostVerificationCard
              verificationStatus={profileStatus.host_verification_status as any}
              verificationNotes={profileStatus.host_verification_notes}
              existingIdUrl={profileStatus.government_id_url}
              existingSelfieUrl={profileStatus.selfie_url}
              onStatusChange={() => refetchProfile()}
            />
          )}
        </div>

        {/* Stats Cards - Overlapping Hero */}
        <div className="px-4 relative z-20 space-y-3 mt-4">
          {isLoadingStats ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="p-5 bg-card/80 backdrop-blur-sm border-2">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-2xl" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                  </div>
                </Card>
              ))}
            </>
          ) : (
            stats.map((stat) => {
              const Icon = iconMap[stat.icon as keyof typeof iconMap];
              
              const getNavigationRoute = () => {
                switch(stat.label) {
                  case "Total Revenue":
                    return "/vendor/revenue";
                  case "Bookings":
                    return "/vendor/bookings";
                  case "Active Hosts":
                    return "/vendor/hosts";
                  case "Rating":
                    return "/vendor/ratings";
                  default:
                    return null;
                }
              };
              
              const route = getNavigationRoute();
              const CardWrapper = route ? 'button' : 'div';
              
              return (
                <Card 
                  key={stat.label} 
                  className="p-5 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] active:scale-95 bg-card/80 backdrop-blur-sm border-2"
                >
                  <CardWrapper
                    onClick={route ? () => navigate(route) : undefined}
                    className={route ? 'w-full text-left' : ''}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-brand/20 to-hot/20 ring-1 ring-brand/20">
                          <Icon className="h-6 w-6 text-brand" />
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                          <p className="text-3xl font-bold mt-1 bg-gradient-to-r from-brand to-hot bg-clip-text text-transparent">
                            {stat.value}
                          </p>
                        </div>
                      </div>
                      {route && (
                        <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardWrapper>
                </Card>
              );
            })
          )}
        </div>

        {/* Upcoming Bookings Section */}
        <div className="px-4 mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-brand" />
              <h2 className="text-xl font-bold">Upcoming Bookings</h2>
            </div>
            <button 
              onClick={() => navigate('/vendor/bookings')}
              className="text-sm font-medium text-primary hover:text-primary/80 active:scale-95 flex items-center gap-1"
            >
              View All
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
          
          <div className="space-y-3">
            {isLoadingBookings ? (
              <>
                {[1, 2].map((i) => (
                  <Card key={i} className="p-4">
                    <div className="space-y-2">
                      <Skeleton className="h-5 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                  </Card>
                ))}
              </>
            ) : bookings.length === 0 ? (
              <Card className="p-6 text-center">
                <CalendarCheck className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">No upcoming bookings yet</p>
                <p className="text-xs text-muted-foreground mt-1">Bookings will appear here once customers make reservations</p>
              </Card>
            ) : (
              bookings.map((booking, index) => (
                <Card
                  key={index}
                  className="p-4 hover:shadow-lg transition-all duration-200 hover:scale-[1.01] active:scale-95 group border-l-4 border-l-transparent hover:border-l-brand"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-base leading-tight group-hover:text-brand transition-colors">{booking.service}</h3>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{booking.date}</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Time:</span> {booking.time}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Guest:</span> {booking.guest}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">Host:</span> {booking.host}
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

        <VendorBottomNav />
      </PageTransition>
    </>
  );
};

export default VendorDashboard;
