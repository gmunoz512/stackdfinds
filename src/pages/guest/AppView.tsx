import { previewExperiences } from "@/data/previewExperiences";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import type { Vendor } from "@/types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthContext } from "@/contexts/AuthContext";
import { useSearch } from "@/contexts/SearchContext";
import { toast } from "@/hooks/use-toast";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { mockRestaurants } from "@/data/mockRestaurants";
import { useRequireSignIn } from "@/hooks/useRequireSignIn";
import { GuestExploreTab } from "./app-view/GuestExploreTab";
import { GuestAboutTab, GuestServicesTab } from "./app-view/GuestInfoTabs";
import { DestinationShell } from "@/components/destination/DestinationShell";

interface VendorProfile {
  id: string;
  name: string;
  category: string;
  description: string | null;
  photos: string[] | null;
  price_per_person: number | null;
  google_rating: number | null;
  is_published: boolean | null;
  listing_type: "restaurant" | "experience";
}

const AppView = () => {
  const { isAuthenticated, signOut, role } = useAuthContext();
  const { requireSignIn } = useRequireSignIn();
  const {
    selectedDate,
    setSelectedDate,
    destination,
    setDestination,
    supportedCities,
  } = useSearch();
  const [cityDropdownOpen, setCityDropdownOpen] = useState(false);

  // Get profile route based on user role
  const profileRoute = useMemo(() => {
    if (role === "host") return "/host/dashboard";
    if (role === "vendor") return "/vendor/dashboard";
    return "/profile";
  }, [role]);
  const navigate = useNavigate();
  const [favorites] = useState<number[]>(() => {
    const saved = localStorage.getItem("favorites");
    return saved ? JSON.parse(saved) : [];
  });
  const [vendorFavorites, setVendorFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem("vendorFavorites");
    return saved ? JSON.parse(saved) : [];
  });
  const [myBusinesses, setMyBusinesses] = useState<Vendor[]>([]);
  const [vendorRestaurants, setVendorRestaurants] = useState<VendorProfile[]>(
    [],
  );
  const [vendorExperiences, setVendorExperiences] = useState<VendorProfile[]>(
    [],
  );
  const [isLoadingVendors, setIsLoadingVendors] = useState(true);
  const [catalogError, setCatalogError] = useState(false);
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

  // Enrich the curated home cards with live Google photos when available.
  useEffect(() => {
    const fetchPhotosForRestaurants = async () => {
      const curatedForCity = mockRestaurants.filter(
        (r) => r.city.toLowerCase() === destination.toLowerCase(),
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
        setGooglePhotos((prev) => ({ ...prev, ...photosMap }));
      }

      // Fetch missing ones in parallel with simplified search queries
      await Promise.all(
        toFetch.map(async (r) => {
          try {
            // Use just name + city for better Google match rates
            const query = `${r.name} ${r.city}`;
            const { data } = await supabase.functions.invoke("google-reviews", {
              body: {
                searchQuery: query,
                lat: r.coordinates?.lat,
                lng: r.coordinates?.lng,
              },
            });
            if (data?.photos?.length > 0) {
              try {
                localStorage.setItem(
                  `google_reviews_detail_${r.id}`,
                  JSON.stringify({ ...data, timestamp: Date.now() }),
                );
              } catch {
                // Ignore quota errors when caching review photos.
              }
              setGooglePhotos((prev) => ({ ...prev, [r.id]: data.photos[0] }));
            } else {
              // Keep the labeled illustrative fallback when no live photo is available.
              setGooglePhotos((prev) => ({ ...prev, [r.id]: "" }));
            }
          } catch {
            setGooglePhotos((prev) => ({ ...prev, [r.id]: "" }));
          }
        }),
      );
    };
    // Live image enrichment is enabled in the production implementation.
  }, [destination]);

  const fetchMyBusinesses = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("vendors")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      setMyBusinesses((data as Vendor[]) || []);
    } catch (error) {
      console.error("Error fetching businesses:", error);
    }
  };

  const fetchPublishedVendors = async () => {
    setIsLoadingVendors(true);
    setCatalogError(false);

    if (!isSupabaseConfigured) {
      setVendorRestaurants([]);
      setVendorExperiences(previewExperiences);
      setIsLoadingVendors(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("vendor_profiles_public")
        .select("id,name,category,description,photos,price_per_person,google_rating,listing_type")
        .eq("is_published", true);

      if (error) throw error;

      const published = (data || []) as VendorProfile[];
      setVendorRestaurants(published.filter((vendor) => vendor.listing_type === "restaurant"));
      setVendorExperiences(published.filter((vendor) => vendor.listing_type === "experience"));
    } catch (error) {
      console.error("Error fetching published services:", error);
      setVendorRestaurants([]);
      setVendorExperiences([]);
      setCatalogError(true);
    } finally {
      setIsLoadingVendors(false);
    }
  };

  // Get curated restaurants for the selected city
  const curatedRestaurants = useMemo(() => {
    return mockRestaurants.filter(
      (r) => r.city.toLowerCase() === destination.toLowerCase(),
    );
  }, [destination]);

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
        title: prev.includes(id)
          ? "Removed from favorites"
          : "Added to favorites",
        duration: 2000,
      });

      return newFavorites;
    });
  };

  return (
    <DestinationShell>
      <Tabs defaultValue="explore" className="flex flex-col">
        <TabsList className="destination-tools w-full h-auto rounded-none justify-end">
          <TabsTrigger value="explore">Discover Tulum</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="about">About</TabsTrigger>
        </TabsList>
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
          catalogError={catalogError}
          onRetryCatalog={fetchPublishedVendors}
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
    </DestinationShell>
  );
};

export default AppView;
