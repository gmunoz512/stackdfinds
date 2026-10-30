import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MapPin, ArrowLeft, User, Sparkles, LogIn, UserPlus, Star, Store, Plus, Check, Loader2, Settings, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-beach.jpg";
import stackdLogo from "@/assets/stackd-logo-new.png";
import { ThemeToggle } from "@/components/ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { GoogleRating } from "@/components/GoogleRating";
import { resolveGoogleRating } from "@/lib/googleRating";
import { toast } from "@/hooks/use-toast";
import { useProfile } from "@/contexts/ProfileContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthContext } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface VendorProfile {
  id: string;
  name: string;
  category: string;
  description: string | null;
  photos: string[] | null;
  price_per_person: number | null;
  google_rating: number | null;
  is_published: boolean | null;
  listing_type: string;
}

const experienceCategories = [
  { id: "all", name: "All", icon: "✨" },
  { id: "Water Sports", name: "Water", icon: "🌊" },
  { id: "Tours & Activities", name: "Tours", icon: "🗺️" },
  { id: "Transportation", name: "Transport", icon: "🚴" },
  { id: "Food & Dining", name: "Food", icon: "🍷" },
  { id: "Wellness", name: "Wellness", icon: "💆" },
  { id: "Photography", name: "Photo", icon: "📸" },
  { id: "Private Chef", name: "Chef", icon: "👨‍🍳" },
];

const restaurantCategories = [
  { id: "all", name: "All", icon: "✨" },
  { id: "Seafood", name: "Seafood", icon: "🦞" },
  { id: "Italian", name: "Italian", icon: "🍝" },
  { id: "Mexican", name: "Mexican", icon: "🌮" },
  { id: "Japanese", name: "Japanese", icon: "🍣" },
  { id: "American", name: "American", icon: "🍔" },
  { id: "Mediterranean", name: "Mediterranean", icon: "🥗" },
];

function ExploreVendorCard({
  vendor,
  isHostMode,
  isSaved,
  isLoading,
  onAdd,
  className,
}: {
  vendor: VendorProfile;
  isHostMode: boolean;
  isSaved: boolean;
  isLoading: boolean;
  onAdd: (e: React.MouseEvent) => void;
  className?: string;
}) {
  return (
    <Link
      to={`/vendor/${vendor.id}${isHostMode ? "?mode=host" : ""}`}
      className={cn("block", className)}
    >
      <div className="aspect-square rounded-xl overflow-hidden relative">
        {vendor.photos && vendor.photos.length > 0 ? (
          <img
            src={vendor.photos[0]}
            alt={vendor.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-brand/20 to-iris-strong/20 flex items-center justify-center">
            <Store className="h-8 w-8 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-transparent to-transparent" />

        {isHostMode && (
          <button
            type="button"
            aria-label={isSaved ? `Remove ${vendor.name} from your vendor list` : `Save ${vendor.name} to your vendor list`}
            onClick={onAdd}
            disabled={isLoading}
            className={`absolute top-2 left-2 z-20 p-2 rounded-full shadow-lg transition-all duration-200 ${
              isSaved
                ? "bg-success text-paper"
                : "bg-gradient-to-r from-brand to-hot text-paper hover:from-brand-strong hover:to-hot-strong"
            }`}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isSaved ? (
              <Check className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </button>
        )}

        <div className="absolute bottom-2 left-2 right-2">
          <p className="text-paper text-xs font-medium line-clamp-1">{vendor.name}</p>
          <div className="flex items-center gap-1 text-paper/80 text-[10px]">
            <GoogleRating
              value={resolveGoogleRating({ googleRating: vendor.google_rating })}
              showCount={false}
              className="text-[10px] text-inherit"
              starClassName="h-2.5 w-2.5"
            />
            <span>•</span>
            <span>${vendor.price_per_person || 0}</span>
          </div>
        </div>
      </div>
      <div className="mt-1.5">
        <p className="text-[10px] text-muted-foreground line-clamp-1">{vendor.category}</p>
      </div>
    </Link>
  );
}

const Explore = () => {
  const [selectedExperienceCategory, setSelectedExperienceCategory] = useState("all");
  const [selectedRestaurantCategory, setSelectedRestaurantCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [vendorProfiles, setVendorProfiles] = useState<VendorProfile[]>([]);
  const [loadingVendors, setLoadingVendors] = useState<Record<string, boolean>>({});
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated, role, isLoading: authLoading } = useAuthContext();
  const { hasRecommendation, addRecommendation, removeRecommendation } = useProfile();
  
  // Check if we're in host mode (came from host vendors page)
  const isHostMode = searchParams.get('mode') === 'host' || (isAuthenticated && role === 'host');

  useEffect(() => {
    fetchVendorProfiles();
  }, []);

  const fetchVendorProfiles = async () => {
    try {
      // Use the public view to avoid exposing sensitive fields
      const { data, error } = await supabase
        .from('vendor_profiles_public')
        .select('id, name, category, description, photos, price_per_person, google_rating, is_published, listing_type')
        .eq('is_published', true);

      if (error) throw error;
      setVendorProfiles(data || []);
    } catch (error) {
      console.error('Error fetching vendor profiles:', error);
    }
  };

  const handleAddVendor = async (vendorId: string, vendorName: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast({
        title: 'Sign in required',
        description: 'Redirecting to sign in...',
      });
      const returnUrl = encodeURIComponent(window.location.pathname + '?mode=host');
      navigate(`/auth?role=host&returnTo=${returnUrl}`);
      return;
    }
    
    // Wait for role to be loaded
    if (authLoading) {
      toast({
        title: 'Loading...',
        description: 'Please wait while we load your account.',
      });
      return;
    }
    
    if (role !== 'host') {
      toast({
        title: 'Host account required',
        description: 'Only hosts can add vendors to their list.',
      });
      return;
    }
    
    setLoadingVendors(prev => ({ ...prev, [vendorId]: true }));
    try {
      const isSaved = hasRecommendation(vendorId, 'vendor');
      if (isSaved) {
        await removeRecommendation(vendorId, 'vendor');
        toast({
          title: 'Removed from Vendor List',
          description: `${vendorName} has been removed from your vendors.`,
        });
      } else {
        await addRecommendation({ id: vendorId, type: 'vendor' });
        toast({
          title: 'Added to Vendor List',
          description: `${vendorName} has been added to your vendors.`,
        });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update your vendor list. Please try again.';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setLoadingVendors(prev => ({ ...prev, [vendorId]: false }));
    }
  };

  // Filter vendor profiles (experiences)
  const vendorExperiences = vendorProfiles.filter(v => v.listing_type === 'experience');
  const vendorRestaurants = vendorProfiles.filter(v => v.listing_type === 'restaurant');

  const filteredVendorExperiences = vendorExperiences.filter((vendor) => {
    const matchesCategory = selectedExperienceCategory === "all" || 
      vendor.category.toLowerCase().includes(selectedExperienceCategory.toLowerCase());
    const matchesSearch = searchQuery === "" || 
      vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (vendor.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    return matchesCategory && matchesSearch;
  });

  const filteredVendorRestaurants = vendorRestaurants.filter((vendor) => {
    const matchesCategory = selectedRestaurantCategory === "all" || 
      vendor.category.toLowerCase().includes(selectedRestaurantCategory.toLowerCase());
    const matchesSearch = searchQuery === "" || 
      vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (vendor.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    return matchesCategory && matchesSearch;
  });

  // Split vendors into two rows
  const experienceMidPoint = Math.ceil(filteredVendorExperiences.length / 2);
  const experiencesRow1 = filteredVendorExperiences.slice(0, experienceMidPoint);
  const experiencesRow2 = filteredVendorExperiences.slice(experienceMidPoint);

  const restaurantMidPoint = Math.ceil(filteredVendorRestaurants.length / 2);
  const restaurantsRow1 = filteredVendorRestaurants.slice(0, restaurantMidPoint);
  const restaurantsRow2 = filteredVendorRestaurants.slice(restaurantMidPoint);

  return (
    <div className="min-h-screen h-screen w-screen bg-background flex justify-center overflow-hidden lg:h-auto lg:min-h-screen lg:overflow-x-hidden">
      {/* Phone container on mobile; full-width website shell on md/lg+ */}
      <div className="w-full max-w-[430px] h-full flex flex-col bg-background overflow-hidden relative md:max-w-5xl lg:max-w-6xl lg:h-auto lg:min-h-screen lg:overflow-visible">
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden pb-20 lg:overflow-visible lg:pb-8">
          {/* Hero Section */}
          <div className="relative">
            {/* Background image */}
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ 
                backgroundImage: `url(${heroImage})`,
                filter: 'blur(1px)',
              }}
            />
            <div className="absolute inset-0 bg-background/70" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background" />

            {/* Header */}
            <div className="relative z-10 flex items-center justify-between px-4 pt-3 pb-2">
              <button
                onClick={() => isHostMode ? navigate('/host/vendors') : navigate(-1)}
                className="p-2 rounded-full bg-background/80 border border-border text-foreground hover:bg-accent transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <DropdownMenu>
                  <DropdownMenuTrigger className="p-2 rounded-full bg-background/80 border border-border text-foreground hover:bg-accent transition-colors">
                    <User className="h-4 w-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40 bg-background border border-border">
                    {isAuthenticated ? (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to="/host/dashboard" className="flex items-center gap-2 cursor-pointer">
                            <User className="h-4 w-4" />
                            Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/host/profile" className="flex items-center gap-2 cursor-pointer">
                            <Settings className="h-4 w-4" />
                            Settings
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={async () => {
                            const { signOut } = await import('@/integrations/supabase/client').then(m => ({ signOut: m.supabase.auth.signOut.bind(m.supabase.auth) }));
                            await signOut();
                            navigate('/explore');
                          }} 
                          className="flex items-center gap-2 cursor-pointer text-destructive"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to="/auth" className="flex items-center gap-2 cursor-pointer">
                            <LogIn className="h-4 w-4" />
                            Sign In
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to="/auth?signup=true" className="flex items-center gap-2 cursor-pointer">
                            <UserPlus className="h-4 w-4" />
                            Sign Up
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Link
                  to="/trip-planner"
                  className="p-2 rounded-full bg-gradient-to-r from-brand to-iris-strong text-paper"
                >
                  <Sparkles className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* Hero Content */}
            <div className="relative z-10 px-4 pb-4 pt-4 text-center">
              <img src={stackdLogo} alt="stackd" className="h-40 w-40 mx-auto mb-3" />
              <h1 className="text-xl font-bold text-foreground mb-1">
                {isHostMode ? "Explore Vendors" : "Discover Experiences"}
              </h1>
              <p className="text-xs text-muted-foreground mb-3">
                {isHostMode ? "Add vendors to your guest guide by tapping the +" : "Find amazing experiences nearby"}
              </p>

              {/* Search Section - Single Bar */}
              <div className="relative md:max-w-2xl md:mx-auto">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-brand/20 to-iris-strong/20 rounded-full blur-sm"></div>
                <div className="relative bg-card/90 rounded-full border border-border/50 backdrop-blur-sm flex items-center px-3 py-2 gap-2">
                  <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                  <Input
                    placeholder="Search vendors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="border-0 bg-transparent text-sm h-6 shadow-none focus-visible:ring-0 px-0 placeholder:text-muted-foreground flex-1 min-w-0"
                  />
                  <button aria-label="Search" className="bg-gradient-to-r from-brand to-iris-strong text-paper rounded-full p-1.5 flex-shrink-0">
                    <Search className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs for Experiences and Restaurants */}
          <Tabs defaultValue="experiences" className="px-3 py-3 md:px-6">
            <TabsList className="w-full justify-start rounded-none bg-transparent h-10 p-0 border-b border-border mb-4">
              <TabsTrigger 
                value="experiences" 
                className="flex-1 rounded-none text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                Experiences
              </TabsTrigger>
              <TabsTrigger 
                value="restaurants" 
                className="flex-1 rounded-none text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                Restaurants
              </TabsTrigger>
            </TabsList>

            {/* Experiences Tab */}
            <TabsContent value="experiences" className="mt-0 space-y-4">
              {/* Category Filters */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {experienceCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedExperienceCategory(category.id)}
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-full border whitespace-nowrap text-xs
                      transition-all duration-300 
                      ${selectedExperienceCategory === category.id 
                        ? 'bg-gradient-to-r from-brand to-hot text-paper border-transparent shadow-lg' 
                        : 'bg-card hover:border-primary/50 border-border'
                      }
                    `}
                  >
                    <span className="text-sm">{category.icon}</span>
                    <span className="font-medium">{category.name}</span>
                  </button>
                ))}
              </div>

              {/* Mobile: two horizontal rows. md+: multi-column grid */}
              <div className="space-y-4 md:hidden">
                {experiencesRow1.length > 0 && (
                  <div className="overflow-x-auto scrollbar-hide -mx-3 px-3">
                    <div className="flex gap-3 w-max pb-2">
                      {experiencesRow1.map((vendor) => (
                        <ExploreVendorCard
                          key={vendor.id}
                          vendor={vendor}
                          isHostMode={isHostMode}
                          isSaved={hasRecommendation(vendor.id, "vendor")}
                          isLoading={!!loadingVendors[vendor.id]}
                          onAdd={(e) => handleAddVendor(vendor.id, vendor.name, e)}
                          className="flex-shrink-0 w-40"
                        />
                      ))}
                    </div>
                  </div>
                )}
                {experiencesRow2.length > 0 && (
                  <div className="overflow-x-auto scrollbar-hide -mx-3 px-3">
                    <div className="flex gap-3 w-max pb-2">
                      {experiencesRow2.map((vendor) => (
                        <ExploreVendorCard
                          key={vendor.id}
                          vendor={vendor}
                          isHostMode={isHostMode}
                          isSaved={hasRecommendation(vendor.id, "vendor")}
                          isLoading={!!loadingVendors[vendor.id]}
                          onAdd={(e) => handleAddVendor(vendor.id, vendor.name, e)}
                          className="flex-shrink-0 w-40"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {filteredVendorExperiences.length > 0 && (
                <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredVendorExperiences.map((vendor) => (
                    <ExploreVendorCard
                      key={vendor.id}
                      vendor={vendor}
                      isHostMode={isHostMode}
                      isSaved={hasRecommendation(vendor.id, "vendor")}
                      isLoading={!!loadingVendors[vendor.id]}
                      onAdd={(e) => handleAddVendor(vendor.id, vendor.name, e)}
                    />
                  ))}
                </div>
              )}

              {filteredVendorExperiences.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm">No experiences found</p>
                </div>
              )}
            </TabsContent>

            {/* Restaurants Tab */}
            <TabsContent value="restaurants" className="mt-0 space-y-4">
              {/* Category Filters */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {restaurantCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedRestaurantCategory(category.id)}
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-full border whitespace-nowrap text-xs
                      transition-all duration-300 
                      ${selectedRestaurantCategory === category.id 
                        ? 'bg-gradient-to-r from-brand to-hot text-paper border-transparent shadow-lg' 
                        : 'bg-card hover:border-primary/50 border-border'
                      }
                    `}
                  >
                    <span className="text-sm">{category.icon}</span>
                    <span className="font-medium">{category.name}</span>
                  </button>
                ))}
              </div>

              {/* Mobile: two horizontal rows. md+: multi-column grid */}
              <div className="space-y-4 md:hidden">
                {restaurantsRow1.length > 0 && (
                  <div className="overflow-x-auto scrollbar-hide -mx-3 px-3">
                    <div className="flex gap-3 w-max pb-2">
                      {restaurantsRow1.map((vendor) => (
                        <ExploreVendorCard
                          key={vendor.id}
                          vendor={vendor}
                          isHostMode={isHostMode}
                          isSaved={hasRecommendation(vendor.id, "vendor")}
                          isLoading={!!loadingVendors[vendor.id]}
                          onAdd={(e) => handleAddVendor(vendor.id, vendor.name, e)}
                          className="flex-shrink-0 w-40"
                        />
                      ))}
                    </div>
                  </div>
                )}
                {restaurantsRow2.length > 0 && (
                  <div className="overflow-x-auto scrollbar-hide -mx-3 px-3">
                    <div className="flex gap-3 w-max pb-2">
                      {restaurantsRow2.map((vendor) => (
                        <ExploreVendorCard
                          key={vendor.id}
                          vendor={vendor}
                          isHostMode={isHostMode}
                          isSaved={hasRecommendation(vendor.id, "vendor")}
                          isLoading={!!loadingVendors[vendor.id]}
                          onAdd={(e) => handleAddVendor(vendor.id, vendor.name, e)}
                          className="flex-shrink-0 w-40"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {filteredVendorRestaurants.length > 0 && (
                <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {filteredVendorRestaurants.map((vendor) => (
                    <ExploreVendorCard
                      key={vendor.id}
                      vendor={vendor}
                      isHostMode={isHostMode}
                      isSaved={hasRecommendation(vendor.id, "vendor")}
                      isLoading={!!loadingVendors[vendor.id]}
                      onAdd={(e) => handleAddVendor(vendor.id, vendor.name, e)}
                    />
                  ))}
                </div>
              )}

              {filteredVendorRestaurants.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground text-sm">No restaurants found</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Explore;
