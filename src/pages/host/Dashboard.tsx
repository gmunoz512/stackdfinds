import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, CalendarCheck, Users, StarIcon, LogOut, TrendingUp, ArrowUpRight, Handshake, Store, CreditCard, CheckCircle2, AlertCircle, Loader2, Calendar } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import HostBottomNav from "@/components/HostBottomNav";
import { PageTransition } from "@/components/PageTransition";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuthContext } from "@/contexts/AuthContext";
import { HostOnboardingCard, HostVerificationCard } from "@/components/onboarding";
import { TrustScoreBadge } from "@/components/TrustScoreBadge";
import { GoogleRating } from "@/components/GoogleRating";
import { resolveGoogleRating } from "@/lib/googleRating";

interface VendorWithCommission {
  id: string;
  name: string;
  category: string;
  commission_percentage: number | null;
  photos: string[] | null;
  google_rating: number | null;
}

const HostDashboard = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [vendors, setVendors] = useState<VendorWithCommission[]>([]);
  const [isLoadingVendors, setIsLoadingVendors] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const { user } = useAuthContext();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Fetch real dashboard stats
  const { data: dashboardStats = [], isLoading: isLoadingStats } = useQuery({
    queryKey: ['hostDashboardStats', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Fetch bookings where this host referred the customer
      const { data: bookings } = await supabase
        .from('bookings')
        .select('total_amount, host_payout_amount')
        .eq('host_user_id', user.id)
        .eq('status', 'completed');

      const totalEarnings = bookings?.reduce((sum, b) => sum + (b.host_payout_amount || 0), 0) || 0;
      const bookingCount = bookings?.length || 0;

      // Count linked vendors
      const { count: vendorCount } = await supabase
        .from('host_vendor_links')
        .select('*', { count: 'exact', head: true })
        .eq('host_user_id', user.id);

      // Calculate average rating from reviews on linked vendors
      const { data: linkedVendors } = await supabase
        .from('host_vendor_links')
        .select('vendor_profile_id')
        .eq('host_user_id', user.id);

      let avgRating = 'N/A';
      if (linkedVendors && linkedVendors.length > 0) {
        const vendorIds = linkedVendors.map(v => v.vendor_profile_id);
        const { data: reviews } = await supabase
          .from('reviews')
          .select('rating')
          .in('vendor_profile_id', vendorIds);
        
        if (reviews && reviews.length > 0) {
          const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
          avgRating = avg.toFixed(1) + '★';
        }
      }

      return [
        { label: "Total Earnings", value: `$${totalEarnings.toLocaleString()}`, icon: "DollarSign" },
        { label: "Bookings", value: bookingCount.toString(), icon: "Calendar" },
        { label: "Active Vendors", value: (vendorCount || 0).toString(), icon: "Users" },
        { label: "Avg Rating", value: avgRating, icon: "Star" },
      ];
    },
    enabled: !!user,
  });

  // Fetch real recent bookings
  const { data: recentBookings = [], isLoading: isLoadingBookings } = useQuery({
    queryKey: ['hostRecentBookings', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data } = await supabase
        .from('bookings')
        .select('experience_name, vendor_name, booking_date, host_payout_amount')
        .eq('host_user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      return data?.map(b => ({
        service: b.experience_name,
        vendor: b.vendor_name || 'Unknown Vendor',
        date: new Date(b.booking_date).toLocaleDateString('en-US', { 
          month: 'short', day: 'numeric', year: 'numeric' 
        }),
        amount: `$${(b.host_payout_amount || 0).toFixed(0)}`,
      })) || [];
    },
    enabled: !!user,
  });

  // Check if host profile is complete
  const { data: profileData, refetch: refetchProfile } = useQuery({
    queryKey: ['hostProfileComplete', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from('profiles')
        .select('full_name, city, recommendations, host_verification_status, government_id_url, selfie_url, host_verification_notes, host_trust_score')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    // Show onboarding if profile is incomplete (no property name set)
    if (profileData !== undefined) {
      const hasPropertyInfo = profileData?.recommendations && 
        typeof profileData.recommendations === 'object' && 
        'property' in (profileData.recommendations as object);
      setShowOnboarding(!hasPropertyInfo && !profileData?.full_name);
    }
  }, [profileData]);

  // Check Stripe Connect status
  const { data: connectStatus, refetch: refetchConnectStatus } = useQuery({
    queryKey: ['hostConnectStatus'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return { connected: false, onboardingComplete: false };

      const { data, error } = await supabase.functions.invoke('check-connect-status', {
        body: { accountType: 'host' },
      });

      if (error) {
        console.error('Error checking connect status:', error);
        return { connected: false, onboardingComplete: false };
      }
      return data;
    },
    staleTime: 30 * 1000,
  });

  // Handle Stripe Connect return
  useEffect(() => {
    if (searchParams.get('stripe_success') === 'true') {
      toast.success('Stripe account connected successfully!');
      refetchConnectStatus();
      window.history.replaceState({}, '', '/host/dashboard');
    } else if (searchParams.get('stripe_refresh') === 'true') {
      toast.info('Please complete your Stripe account setup');
      window.history.replaceState({}, '', '/host/dashboard');
    }
  }, [searchParams, refetchConnectStatus]);

  const handleConnectStripe = async () => {
    setIsConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-connect-account', {
        body: { accountType: 'host' },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
        toast.success('Stripe setup opened in a new tab. Complete the setup there, then refresh this page.');
        setIsConnecting(false);
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

  useEffect(() => {
    fetchVendorsWithCommission();
  }, []);

  const fetchVendorsWithCommission = async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_profiles')
        .select('id, name, category, commission_percentage, photos, google_rating')
        .eq('is_published', true)
        .not('commission_percentage', 'is', null)
        .order('commission_percentage', { ascending: false });

      if (error) throw error;
      setVendors(data || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
    } finally {
      setIsLoadingVendors(false);
    }
  };

  return (
    <PageTransition className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 pb-24">
      <div className="max-w-[375px] mx-auto">
        {/* Hero Header with Gradient */}
        <div className="bg-gradient-to-br from-brand to-hot px-4 pt-6 pb-20 rounded-b-3xl shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-paper">Welcome Back</h1>
                <p className="text-sm text-paper/80">Here's your performance today</p>
                {profileData && typeof profileData.host_trust_score === 'number' && (
                  <div className="mt-2">
                    <TrustScoreBadge score={profileData.host_trust_score} size="sm" />
                  </div>
                )}
              </div>
              <button
                onClick={() => navigate('/signout')}
                className="p-2 rounded-xl bg-paper/10 backdrop-blur-sm hover:bg-paper/20 transition-all active:scale-95"
                aria-label="Sign out"
              >
                <LogOut className="h-5 w-5 text-paper" />
              </button>
            </div>

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
                      {connectStatus?.onboardingComplete ? 'Commissions Active' : 'Set Up Payouts'}
                    </p>
                    <p className="text-xs text-paper/70">
                      {connectStatus?.onboardingComplete 
                        ? 'Receive commissions directly to your bank' 
                        : 'Connect your bank to receive commissions'}
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

        {/* Host Onboarding Card */}
        {showOnboarding && (
          <div className="px-4 -mt-12 relative z-20 mb-3">
            <HostOnboardingCard onComplete={() => {
              setShowOnboarding(false);
              refetchProfile();
            }} />
          </div>
        )}

        {/* Host Verification Card */}
        {profileData && (
          <div className={`px-4 ${showOnboarding ? '' : '-mt-12'} relative z-20 mb-3`}>
            <HostVerificationCard
              verificationStatus={(profileData.host_verification_status as any) || 'unverified'}
              verificationNotes={profileData.host_verification_notes}
              existingIdUrl={profileData.government_id_url}
              existingSelfieUrl={profileData.selfie_url}
              onStatusChange={() => refetchProfile()}
            />
          </div>
        )}

        {/* Stats Cards - Overlapping Hero */}
        <div className={`px-4 ${(showOnboarding || profileData) ? '' : '-mt-12'} relative z-20 space-y-3`}>
          {isLoadingStats ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </>
          ) : (
            dashboardStats.map((stat) => {
              const Icon = iconMap[stat.icon as keyof typeof iconMap];
              
              // Define navigation routes for each stat
              const getNavigationRoute = () => {
                switch(stat.label) {
                  case "Total Earnings":
                    return "/host/earnings";
                  case "Bookings":
                    return "/host/bookings";
                  case "Active Vendors":
                    return "/host/vendors/active";
                  case "Avg Rating":
                    return "/host/ratings";
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

        {/* Recent Activity Section */}
        <div className="px-4 mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-brand" />
              <h2 className="text-xl font-bold">Recent Activity</h2>
            </div>
            <button 
              onClick={() => navigate('/host/bookings')}
              className="text-sm font-medium text-primary hover:text-primary/80 active:scale-95 flex items-center gap-1"
            >
              View All
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
          
          {isLoadingBookings ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : recentBookings.length === 0 ? (
            <Card className="p-8 text-center">
              <Calendar className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium text-foreground">No bookings yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your earnings will appear here once guests book through your referrals
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((booking, index) => (
                <Card
                  key={index}
                  className="p-4 hover:shadow-lg transition-all duration-200 hover:scale-[1.01] active:scale-95 group border-l-4 border-l-transparent hover:border-l-brand"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-base truncate group-hover:text-brand transition-colors">
                        {booking.service}
                      </p>
                      <p className="text-sm text-muted-foreground truncate mt-1">{booking.vendor}</p>
                      <p className="text-xs text-muted-foreground mt-2">{booking.date}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="px-3 py-1.5 rounded-full bg-gradient-to-r from-brand to-hot">
                        <p className="font-bold text-sm text-paper">{booking.amount}</p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Vendor Commission Rates Section */}
        <div className="px-4 mt-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Handshake className="h-5 w-5 text-warning" />
              <h2 className="text-xl font-bold">Partner Commissions</h2>
            </div>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Earn commissions when you refer guests to these vendors
          </p>

          {isLoadingVendors ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : vendors.length === 0 ? (
            <Card className="p-6 text-center rounded-2xl">
              <Store className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium mb-1">No partner rates yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Published vendors with a commission % will show here after you apply the demo seed.
              </p>
              <Button variant="outline" size="sm" className="rounded-full" onClick={() => navigate('/explore?mode=host')}>
                Browse vendors
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {vendors.map((vendor) => (
                <Card
                  key={vendor.id}
                  className="p-4 rounded-2xl border-border/80 hover:shadow-lg transition-all duration-200 hover:scale-[1.01] active:scale-95 cursor-pointer group"
                  onClick={() => navigate(`/vendor/${vendor.id}?mode=host`)}
                >
                  <div className="flex items-center gap-3">
                    {/* Vendor Photo */}
                    <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-brand/20 to-hot/20 ring-1 ring-border/60">
                      {vendor.photos && vendor.photos.length > 0 ? (
                        <img
                          src={vendor.photos[0]}
                          alt={vendor.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Store className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    
                    {/* Vendor Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate group-hover:text-brand transition-colors">
                        {vendor.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{vendor.category}</p>
                      <div className="mt-1">
                        <GoogleRating
                          value={resolveGoogleRating({ googleRating: vendor.google_rating })}
                          showCount={false}
                          className="text-xs text-muted-foreground"
                          starClassName="h-3 w-3"
                        />
                      </div>
                    </div>
                    
                    {/* Commission Badge */}
                    <div className="flex-shrink-0 text-right">
                      <Badge className="bg-gradient-to-r from-warning to-brand text-paper text-lg px-3 py-1 font-bold">
                        {vendor.commission_percentage}%
                      </Badge>
                      <p className="text-[10px] text-muted-foreground mt-1">per booking</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <HostBottomNav />
    </PageTransition>
  );
};

export default HostDashboard;
