import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/PageTransition";
import type { Vendor } from "@/types";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Heart, User, Search, Star, Sparkles, Store, ChevronRight, ChevronDown, Megaphone, Monitor, MapPin, CalendarDays, LogIn, UserPlus, CheckCircle, DollarSign, Zap, Home, Settings, LogOut, Check } from "lucide-react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useSearch } from "@/contexts/SearchContext";
import { Card } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
// Real data + curated restaurants
import { supabase } from "@/integrations/supabase/client";
import { mockRestaurants } from "@/data/mockRestaurants";
import stackdLogo from "@/assets/stackd-logo-new.png";
import heroImage from "@/assets/hero-beach.jpg";
import { ThemeToggle } from "@/components/ThemeToggle";

import { BlurImage } from "@/components/BlurImage";
import { GoogleRating } from "@/components/GoogleRating";
import { resolveGoogleRating } from "@/lib/googleRating";
import { useRequireSignIn } from "@/hooks/useRequireSignIn";
import { GuestExploreTab } from "@/pages/guest/app-view/GuestExploreTab";
import { GuestAboutTab, GuestServicesTab } from "@/pages/guest/app-view/GuestInfoTabs";
import { GuestAppNav } from "@/pages/guest/app-view/GuestAppNav";


const categories = [
  { id: "all", name: "All", icon: "✨" },
  { id: "Water Sports", name: "Water", icon: "🌊" },
  { id: "Tours & Activities", name: "Tours", icon: "🗺️" },
  { id: "Transportation", name: "Transport", icon: "🚴" },
  { id: "Food & Dining", name: "Food", icon: "🍷" },
  { id: "Wellness", name: "Wellness", icon: "💆" },
  { id: "Photography", name: "Photo", icon: "📸" },
];

interface VendorProfile {
  id: string;
  name: string;
  category: string;
  description: string | null;
  photos: string[] | null;
  price_per_person: number | null;
  google_rating: number | null;
  is_published: boolean | null;
  listing_type: 'restaurant' | 'experience';
}

const AppView = () => {
  const { isAuthenticated, signOut, role } = useAuthContext();
  const { requireSignIn } = useRequireSignIn();
  const { selectedDate, setSelectedDate, destination, setDestination, selectedCity, supportedCities } = useSearch();
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);
  
  // Get profile route based on user role
  const profileRoute = useMemo(() => {
    if (role === 'host') return '/host/dashboard';
    if (role === 'vendor') return '/vendor/dashboard';
    return '/profile';
  }, [role]);
  const navigate = useNavigate();
  const location = useLocation();
  const [favorites, setFavorites] = useState<number[]>(() => {
    const saved = localStorage.getItem("favorites");
    return saved ? JSON.parse(saved) : [];
  });
  const [vendorFavorites, setVendorFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem("vendorFavorites");
    return saved ? JSON.parse(saved) : [];
  });
  const [myBusinesses, setMyBusinesses] = useState<Vendor[]>([]);
  const [vendorRestaurants, setVendorRestaurants] = useState<VendorProfile[]>([]);
  const [vendorExperiences, setVendorExperiences] = useState<VendorProfile[]>([]);
  const [isLoadingVendors, setIsLoadingVendors] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [googlePhotos, setGooglePhotos] = useState<Record<string, string>>({});

  const handleSignOut = async () => {
    await signOut();
    navigate("/appview");
  };

  useEffect(() => {
    fetchMyBusinesses();
  }, []);

  // Re-fetch vendors when city changes
  useEffect(() => {
    fetchPublishedVendors();
  }, [destination]);

  // Fetch Google photos for curated restaurants (no mock fallback)
  useEffect(() => {
    const fetchPhotosForRestaurants = async () => {
      const curatedForCity = mockRestaurants.filter(
        r => r.city.toLowerCase() === destination.toLowerCase()
      );
      const photosMap: Record<string, string> = {};
      const toFetch: typeof curatedForCity = [];

      for (const r of curatedForCity) {
        try {
          const cached = localStorage.getItem(`google_reviews_detail_${r.id}`);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed.photos?.length > 0) {
              photosMap[r.id] = parsed.photos[0];
              continue;
            }
          }
        } catch {
          // Ignore unreadable cached review payloads.
        }
        toFetch.push(r);
      }

      if (Object.keys(photosMap).length > 0) {
        setGooglePhotos(prev => ({ ...prev, ...photosMap }));
      }

      // Fetch missing ones in parallel with simplified search queries
      await Promise.all(
        toFetch.map(async (r) => {
          try {
            // Use just name + city for better Google match rates
            const query = `${r.name} ${r.city}`;
            const { data } = await supabase.functions.invoke('google-reviews', {
              body: { searchQuery: query, lat: r.coordinates?.lat, lng: r.coordinates?.lng }
            });
            if (data?.photos?.length > 0) {
              try {
                localStorage.setItem(
                  `google_reviews_detail_${r.id}`,
                  JSON.stringify({ ...data, timestamp: Date.now() })
                );
              } catch {
                // Ignore quota errors when caching review photos.
              }
              setGooglePhotos(prev => ({ ...prev, [r.id]: data.photos[0] }));
            } else {
              // Mark as "no photo" so we can hide the card
              setGooglePhotos(prev => ({ ...prev, [r.id]: '' }));
            }
          } catch {
            setGooglePhotos(prev => ({ ...prev, [r.id]: '' }));
          }
        })
      );
    };
    fetchPhotosForRestaurants();
  }, [destination]);

  const fetchMyBusinesses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setMyBusinesses((data as Vendor[]) || []);
    } catch (error) {
      console.error('Error fetching businesses:', error);
    }
  };

  const fetchPublishedVendors = async () => {
    try {
      setIsLoadingVendors(true);
      // Use the public view to avoid exposing sensitive fields
      const { data, error } = await supabase
        .from('vendor_profiles_public')
        .select('id, name, category, description, photos, price_per_person, google_rating, is_published, listing_type')
        .eq('is_published', true);

      if (error) throw error;
      
      const vendors = (data as VendorProfile[]) || [];
      // Filter by city client-side since the public view doesn't include city
      setVendorRestaurants(vendors.filter(v => v.listing_type === 'restaurant'));
      setVendorExperiences(vendors.filter(v => v.listing_type === 'experience'));
    } catch (error) {
      console.error('Error fetching published vendors:', error);
    } finally {
      setIsLoadingVendors(false);
    }
  };

  // Get curated restaurants for the selected city
  const curatedRestaurants = useMemo(() => {
    return mockRestaurants.filter(r => 
      r.city.toLowerCase() === destination.toLowerCase()
    );
  }, [destination]);

  const toggleFavorite = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!requireSignIn("save")) return;
    setFavorites((prev) => {
      const newFavorites = prev.includes(id)
        ? prev.filter((fav) => fav !== id)
        : [...prev, id];
      
      localStorage.setItem("favorites", JSON.stringify(newFavorites));
      
      toast({
        title: prev.includes(id) ? "Removed from favorites" : "Added to favorites",
        duration: 2000,
      });
      
      return newFavorites;
    });
  };

  const toggleVendorFavorite = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!requireSignIn("save")) return;
    setVendorFavorites((prev) => {
      const newFavorites = prev.includes(id)
        ? prev.filter((fav) => fav !== id)
        : [...prev, id];
      
      localStorage.setItem("vendorFavorites", JSON.stringify(newFavorites));
      
      toast({
        title: prev.includes(id) ? "Removed from favorites" : "Added to favorites",
        duration: 2000,
      });
      
      return newFavorites;
    });
  };

  // Filter vendor experiences by category and search
  const filteredVendorExperiences = vendorExperiences.filter((vendor) => {
    const matchesCategory = selectedCategory === "all" || vendor.category === selectedCategory;
    const matchesSearch = searchQuery === "" || 
      vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (vendor.description && vendor.description.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  return (
    <PageTransition className="min-h-screen h-screen w-screen bg-background flex justify-center overflow-hidden lg:h-auto lg:min-h-screen lg:overflow-visible">
      {/* Phone container on mobile; full-width website shell on md/lg+ */}
      <div className="w-full max-w-[430px] h-full flex flex-col bg-background overflow-hidden relative md:max-w-5xl lg:max-w-6xl lg:h-auto lg:min-h-screen lg:overflow-visible">
        <div className="hidden lg:block h-14 shrink-0" aria-hidden="true" />
        
        <Tabs defaultValue="explore" className="flex-1 flex flex-col overflow-hidden lg:overflow-visible">
          {/* Sticky Tabs Header */}
          <div className="flex-shrink-0 sticky top-0 z-20 bg-background/95 backdrop-blur-sm border-b border-border lg:top-14 lg:bg-background lg:z-30">
            <TabsList className="w-full justify-start rounded-none bg-transparent h-10 p-0">
              <TabsTrigger 
                value="explore" 
                className="flex-1 rounded-none text-xs data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                Explore
              </TabsTrigger>
              <TabsTrigger 
                value="services" 
                className="flex-1 rounded-none text-xs data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                Services
              </TabsTrigger>
              <TabsTrigger 
                value="about" 
                className="flex-1 rounded-none text-xs data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                About
              </TabsTrigger>
            </TabsList>
          </div>

          <GuestExploreTab
            role={role}
            isAuthenticated={isAuthenticated}
            profileRoute={profileRoute}
            handleSignOut={handleSignOut}
            cityDropdownOpen={cityDropdownOpen}
            setCityDropdownOpen={setCityDropdownOpen}
            destination={destination}
            setDestination={setDestination}
            supportedCities={supportedCities}
            calendarOpen={calendarOpen}
            setCalendarOpen={setCalendarOpen}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            navigate={navigate}
            myBusinesses={myBusinesses}
            isLoadingVendors={isLoadingVendors}
            vendorRestaurants={vendorRestaurants}
            curatedRestaurants={curatedRestaurants}
            googlePhotos={googlePhotos}
            vendorFavorites={vendorFavorites}
            toggleVendorFavorite={toggleVendorFavorite}
            vendorExperiences={vendorExperiences}
            favorites={favorites}
          />

          <GuestServicesTab />
          <GuestAboutTab />
        </Tabs>

        <GuestAppNav
          favorites={favorites}
          profileRoute={profileRoute}
          role={role}
          location={location}
        />
      </div>
    </PageTransition>
  );
};

export default AppView;
