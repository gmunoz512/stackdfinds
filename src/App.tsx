import { useState, useEffect, lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UserProvider } from "./contexts/UserContext";
import { AuthProvider, useAuthContext } from "./contexts/AuthContext";
import { ProfileProvider } from "./contexts/ProfileContext";
import { ThemeProvider } from "./components/ThemeProvider";
import { ScrollToTop } from "./components/ScrollToTop";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { RouteSeo } from "./components/RouteSeo";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

// Landing page is eager so the first paint is instant
import SplashPage from "./pages/marketing/SplashPage";

// Guest pages (lazy)
const Explore = lazy(() => import("./pages/guest/Explore"));
const ExperienceDetailsPage = lazy(() => import("./pages/guest/ExperienceDetailsPage"));
const BookingForm = lazy(() => import("./pages/guest/BookingForm"));
const PaymentPage = lazy(() => import("./pages/guest/PaymentPage"));
const BookingConfirmation = lazy(() => import("./pages/guest/BookingConfirmation"));
const AppView = lazy(() => import("./pages/guest/AppView"));
const Profile = lazy(() => import("./pages/guest/Profile"));
const TripPlannerChat = lazy(() => import("./pages/guest/TripPlannerChat"));
const RestaurantDetail = lazy(() => import("./pages/guest/RestaurantDetail"));
const Wishlists = lazy(() => import("./pages/guest/Wishlists"));
const AllRestaurants = lazy(() => import("./pages/guest/AllRestaurants"));
const AllExperiences = lazy(() => import("./pages/guest/AllExperiences"));
const GuestGuide = lazy(() => import("./pages/guest/GuestGuide"));
const MyBookings = lazy(() => import("./pages/guest/MyBookings"));
const Conversation = lazy(() => import("./pages/guest/Conversation"));
const RequestRefund = lazy(() => import("./pages/guest/RequestRefund"));
const Itinerary = lazy(() => import("./pages/guest/Itinerary"));
const SharedItinerary = lazy(() => import("./pages/guest/SharedItinerary"));
const TripItinerary = lazy(() => import("./pages/guest/TripItinerary"));
const PaymentSuccess = lazy(() => import("./pages/guest/PaymentSuccess"));

// Host pages (lazy)
const HostDashboard = lazy(() => import("./pages/host/Dashboard"));
const HostVendors = lazy(() => import("./pages/host/Vendors"));
const AddVendor = lazy(() => import("./pages/host/AddVendor"));
const HostProfile = lazy(() => import("./pages/host/Profile"));
const HostAuth = lazy(() => import("./pages/host/Auth"));
const EditHostProfile = lazy(() => import("./pages/host/EditProfile"));
const PaymentSettings = lazy(() => import("./pages/host/PaymentSettings"));
const PayoutHistory = lazy(() => import("./pages/host/PayoutHistory"));
const HostBookings = lazy(() => import("./pages/host/Bookings"));
const HostActiveVendors = lazy(() => import("./pages/host/ActiveVendors"));
const HostEarnings = lazy(() => import("./pages/host/Earnings"));
const HostRatings = lazy(() => import("./pages/host/Ratings"));
const HostStorefront = lazy(() => import("./pages/host/Storefront"));
const HostVendorManagement = lazy(() => import("./pages/host/VendorManagement"));

// Vendor pages (lazy)
const VendorDashboard = lazy(() => import("./pages/vendor/Dashboard"));
const AddService = lazy(() => import("./pages/vendor/AddService"));
const VendorProfile = lazy(() => import("./pages/vendor/Profile"));
const VendorSettings = lazy(() => import("./pages/vendor/Settings"));
const VendorPaymentSettings = lazy(() => import("./pages/vendor/PaymentSettings"));
const VendorPayoutHistory = lazy(() => import("./pages/vendor/PayoutHistory"));
const AllBookings = lazy(() => import("./pages/vendor/AllBookings"));
const ActiveHosts = lazy(() => import("./pages/vendor/ActiveHosts"));
const RevenueBreakdown = lazy(() => import("./pages/vendor/RevenueBreakdown"));
const VendorRatings = lazy(() => import("./pages/vendor/Ratings"));
const CreateVendorProfile = lazy(() => import("./pages/vendor/CreateProfile"));
const VendorProfilePreview = lazy(() => import("./pages/vendor/ProfilePreview"));
const VendorPublicProfile = lazy(() => import("./pages/vendor/PublicProfile"));
const VendorBookingForm = lazy(() => import("./pages/vendor/BookingForm"));
const TestInstagramScrape = lazy(() => import("./pages/vendor/UploadPhotos"));

// Auth pages (lazy)
const Auth = lazy(() => import("./pages/auth/Auth"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));
const ChangePassword = lazy(() => import("./pages/auth/ChangePassword"));
const SignIn = lazy(() => import("./pages/auth/SignIn"));
const SignOut = lazy(() => import("./pages/auth/SignOut"));

// Marketing pages (lazy)
const ForHosts = lazy(() => import("./pages/marketing/ForHosts"));
const ForVendors = lazy(() => import("./pages/marketing/ForVendors"));

// Legal pages (lazy)
const PrivacyPolicy = lazy(() => import("./pages/legal/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/legal/TermsOfService"));
const HelpSupport = lazy(() => import("./pages/legal/HelpSupport"));

// Admin pages (lazy)
const PlatformSettings = lazy(() => import("./pages/admin/PlatformSettings"));
const AdminPromoCodes = lazy(() => import("./pages/admin/PromoCodes"));
const VendorApprovals = lazy(() => import("./pages/admin/VendorApprovals"));
const HostVerifications = lazy(() => import("./pages/admin/HostVerifications"));
const MessageModeration = lazy(() => import("./pages/admin/MessageModeration"));
const FraudAlerts = lazy(() => import("./pages/admin/FraudAlerts"));
const RefundRequests = lazy(() => import("./pages/admin/RefundRequests"));
const TrustScoreMonitoring = lazy(() => import("./pages/admin/TrustScoreMonitoring"));

// Standalone pages
const NotFound = lazy(() => import("./pages/NotFound"));

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-background">
    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
  </div>
);


// Protected route component for admins - checks user_roles table for admin role via DB
const ProtectedAdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, user } = useAuthContext();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) { setIsAdmin(false); return; }
      const { data } = await import('@/integrations/supabase/client').then(m => 
        m.supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' })
      );
      setIsAdmin(!!data);
    };
    if (isAuthenticated) checkAdmin();
  }, [user, isAuthenticated]);
  
  if (isLoading || isAdmin === null) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/appview" replace />;
  }
  
  return <>{children}</>;
};

const ProtectedHostRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, role } = useAuthContext();
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/auth/host" replace />;
  }
  
  // If user has vendor role, redirect to vendor dashboard
  if (role === 'vendor') {
    return <Navigate to="/vendor/dashboard" replace />;
  }
  
  return <>{children}</>;
};

// Protected route component for vendors - uses Supabase session for authentication
const ProtectedVendorRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading, role } = useAuthContext();
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/auth?role=vendor" replace />;
  }
  
  // If user has host role, redirect to host dashboard
  if (role === 'host') {
    return <Navigate to="/host/dashboard" replace />;
  }
  
  return <>{children}</>;
};

// Generic protected route that just checks authentication
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAuthContext();
  
  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => (
  <Suspense fallback={<PageLoader />}>
  <Routes>
    <Route path="/" element={<SplashPage />} />
    {/* Legacy route - redirect to unified auth */}
    <Route path="/select-role" element={<Navigate to="/auth" replace />} />
    
    <Route path="/appview" element={<AppView />} />
    
    {/* Guest/Public Routes */}
    <Route path="/explore" element={<Explore />} />
    <Route path="/experience/:id" element={<ExperienceDetailsPage />} />
    <Route path="/booking/:id" element={<BookingForm />} />
    <Route path="/booking/:id/payment" element={<PaymentPage />} />
    <Route path="/booking/:id/confirmed" element={<BookingConfirmation />} />
    <Route path="/storefront/:hostId" element={<HostStorefront />} />
    <Route path="/auth" element={<Auth />} />
    <Route path="/reset-password" element={<ResetPassword />} />
    <Route path="/profile" element={<Profile />} />
    <Route path="/bookings" element={<MyBookings />} />
    <Route path="/bookings/:bookingId/chat" element={<ProtectedRoute><Conversation /></ProtectedRoute>} />
    <Route path="/bookings/:bookingId/refund" element={<ProtectedRoute><RequestRefund /></ProtectedRoute>} />
    <Route path="/for-hosts" element={<ForHosts />} />
    <Route path="/for-vendors" element={<ForVendors />} />
    <Route path="/trip-planner" element={<TripPlannerChat />} />
    <Route path="/trip-planner/itinerary" element={<TripItinerary />} />
    <Route path="/itinerary" element={<Itinerary />} />
    <Route path="/itinerary/shared/:token" element={<SharedItinerary />} />
    <Route path="/shared/:token" element={<SharedItinerary />} />
    <Route path="/restaurant/:id" element={<RestaurantDetail />} />
    <Route path="/restaurants" element={<AllRestaurants />} />
    <Route path="/experiences" element={<AllExperiences />} />
    <Route path="/wishlists" element={<Wishlists />} />
    <Route path="/guide/:hostId" element={<GuestGuide />} />
    <Route path="/privacy" element={<PrivacyPolicy />} />
    <Route path="/terms" element={<TermsOfService />} />
    <Route path="/vendor/upload-photos" element={<ProtectedVendorRoute><TestInstagramScrape /></ProtectedVendorRoute>} />
    <Route path="/vendor/create-profile" element={<ProtectedVendorRoute><CreateVendorProfile /></ProtectedVendorRoute>} />
    <Route path="/vendor/edit-profile" element={<ProtectedVendorRoute><CreateVendorProfile /></ProtectedVendorRoute>} />
    <Route path="/vendor/preview" element={<ProtectedVendorRoute><VendorProfilePreview /></ProtectedVendorRoute>} />
    <Route path="/vendor/preview/:id" element={<ProtectedVendorRoute><VendorProfilePreview /></ProtectedVendorRoute>} />
    <Route path="/vendor/:id" element={<VendorPublicProfile />} />
    <Route path="/vendor/:id/book" element={<VendorBookingForm />} />
    <Route path="/vendor/:id/payment" element={<PaymentPage />} />
    <Route path="/booking/:id/success" element={<PaymentSuccess />} />
    <Route path="/vendor/:id/confirmed" element={<BookingConfirmation />} />
    
    {/* Admin Routes */}
    <Route path="/admin/settings" element={<ProtectedAdminRoute><PlatformSettings /></ProtectedAdminRoute>} />
    <Route path="/admin/promo-codes" element={<ProtectedAdminRoute><AdminPromoCodes /></ProtectedAdminRoute>} />
    <Route path="/admin/vendor-approvals" element={<ProtectedAdminRoute><VendorApprovals /></ProtectedAdminRoute>} />
    <Route path="/admin/host-verifications" element={<ProtectedAdminRoute><HostVerifications /></ProtectedAdminRoute>} />
    <Route path="/admin/message-moderation" element={<ProtectedAdminRoute><MessageModeration /></ProtectedAdminRoute>} />
    <Route path="/admin/fraud-alerts" element={<ProtectedAdminRoute><FraudAlerts /></ProtectedAdminRoute>} />
    <Route path="/admin/refund-requests" element={<ProtectedAdminRoute><RefundRequests /></ProtectedAdminRoute>} />
    <Route path="/admin/trust-scores" element={<ProtectedAdminRoute><TrustScoreMonitoring /></ProtectedAdminRoute>} />
    
    {/* Host Routes */}
    <Route path="/auth/host" element={<HostAuth />} />
    {/* Legacy signup routes redirect to unified auth */}
    <Route path="/signup/host" element={<Navigate to="/auth?role=host" replace />} />
    <Route path="/signup/host/property" element={<Navigate to="/auth?role=host" replace />} />
    
    {/* Host Profile Sub-pages */}
    <Route path="/host/edit-profile" element={<ProtectedHostRoute><EditHostProfile /></ProtectedHostRoute>} />
    <Route path="/host/payment-settings" element={<ProtectedHostRoute><PaymentSettings /></ProtectedHostRoute>} />
    <Route path="/host/payout-history" element={<ProtectedHostRoute><PayoutHistory /></ProtectedHostRoute>} />
    <Route path="/host/change-password" element={<ProtectedHostRoute><ChangePassword /></ProtectedHostRoute>} />
    <Route path="/host/help-support" element={<ProtectedHostRoute><HelpSupport /></ProtectedHostRoute>} />
    <Route path="/host/bookings" element={<ProtectedHostRoute><HostBookings /></ProtectedHostRoute>} />
    <Route path="/host/vendors/active" element={<ProtectedHostRoute><HostActiveVendors /></ProtectedHostRoute>} />
    <Route path="/host/vendors/manage" element={<ProtectedHostRoute><HostVendorManagement /></ProtectedHostRoute>} />
    <Route path="/host/earnings" element={<ProtectedHostRoute><HostEarnings /></ProtectedHostRoute>} />
    <Route path="/host/ratings" element={<ProtectedHostRoute><HostRatings /></ProtectedHostRoute>} />
    <Route 
      path="/host/dashboard" 
      element={
        <ProtectedHostRoute>
          <HostDashboard />
        </ProtectedHostRoute>
      } 
    />
    <Route 
      path="/host/vendors" 
      element={
        <ProtectedHostRoute>
          <HostVendors />
        </ProtectedHostRoute>
      } 
    />
    <Route 
      path="/host/vendors/add" 
      element={
        <ProtectedHostRoute>
          <AddVendor />
        </ProtectedHostRoute>
      } 
    />
    <Route 
      path="/host/profile" 
      element={
        <ProtectedHostRoute>
          <HostProfile />
        </ProtectedHostRoute>
      } 
    />
    
    {/* Vendor Routes */}
    {/* Legacy signup routes redirect to unified auth */}
    <Route path="/signup/vendor" element={<Navigate to="/auth?role=vendor" replace />} />
    <Route path="/signup/vendor/business" element={<Navigate to="/auth?role=vendor" replace />} />
    <Route 
      path="/vendor/dashboard" 
      element={
        <ProtectedVendorRoute>
          <VendorDashboard />
        </ProtectedVendorRoute>
      } 
    />
    <Route 
      path="/vendor/services/add" 
      element={
        <ProtectedVendorRoute>
          <AddService />
        </ProtectedVendorRoute>
      } 
    />
    <Route 
      path="/vendor/bookings" 
      element={
        <ProtectedVendorRoute>
          <AllBookings />
        </ProtectedVendorRoute>
      } 
    />
    <Route 
      path="/vendor/hosts" 
      element={
        <ProtectedVendorRoute>
          <ActiveHosts />
        </ProtectedVendorRoute>
      } 
    />
    <Route 
      path="/vendor/revenue" 
      element={
        <ProtectedVendorRoute>
          <RevenueBreakdown />
        </ProtectedVendorRoute>
      } 
    />
    <Route 
      path="/vendor/profile" 
      element={
        <ProtectedVendorRoute>
          <VendorProfile />
        </ProtectedVendorRoute>
      } 
    />
    <Route 
      path="/vendor/settings" 
      element={
        <ProtectedVendorRoute>
          <VendorSettings />
        </ProtectedVendorRoute>
      } 
    />
    <Route 
      path="/vendor/payment-settings" 
      element={
        <ProtectedVendorRoute>
          <VendorPaymentSettings />
        </ProtectedVendorRoute>
      } 
    />
    <Route 
      path="/vendor/payout-history" 
      element={
        <ProtectedVendorRoute>
          <VendorPayoutHistory />
        </ProtectedVendorRoute>
      } 
    />
    <Route 
      path="/vendor/ratings" 
      element={
        <ProtectedVendorRoute>
          <VendorRatings />
        </ProtectedVendorRoute>
      } 
    />
    
    <Route path="/signin" element={<SignIn />} />
    <Route path="/signout" element={<SignOut />} />
    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
    <Route path="*" element={<NotFound />} />
  </Routes>
  </Suspense>
);

const App = () => {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <AuthProvider>
            <ProfileProvider>
              <UserProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
                  <BrowserRouter>
                    <RouteSeo />
                    <ScrollToTop />
                    <AppRoutes />
                  </BrowserRouter>
                </TooltipProvider>
              </UserProvider>
            </ProfileProvider>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
