import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { GoogleRating } from "@/components/GoogleRating";
import { resolveGoogleRating } from "@/lib/googleRating";
import { useRequireSignIn } from "@/hooks/useRequireSignIn";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Heart, Trash2, MoreHorizontal, Star, Utensils, Compass } from "lucide-react";
import { toast } from "sonner";
import { experiences } from "@/data/mockData";
import { mockRestaurants, type Restaurant } from "@/data/mockRestaurants";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageTransition } from "@/components/PageTransition";

// Experience images
import kayakingImg from "@/assets/experiences/kayaking.jpg";
import bikesImg from "@/assets/experiences/bikes.jpg";
import snorkelingImg from "@/assets/experiences/snorkeling.jpg";
import photographyImg from "@/assets/experiences/photography.jpg";
import spaImg from "@/assets/experiences/spa.jpg";
import diningImg from "@/assets/experiences/dining.jpg";
import atvImg from "@/assets/experiences/atv.jpg";
import boatImg from "@/assets/experiences/boat.jpg";
import ziplineImg from "@/assets/experiences/zipline.jpg";
import horsebackImg from "@/assets/experiences/horseback.jpg";
import scubaImg from "@/assets/experiences/scuba.jpg";
import hikingImg from "@/assets/experiences/hiking.jpg";
import parasailingImg from "@/assets/experiences/parasailing.jpg";
import yogaImg from "@/assets/experiences/yoga.jpg";
import fishingImg from "@/assets/experiences/fishing.jpg";
import cookingImg from "@/assets/experiences/cooking.jpg";
import balloonImg from "@/assets/experiences/balloon.jpg";
import wineImg from "@/assets/experiences/wine.jpg";

const getExperienceImage = (experienceId: number) => {
  const imageMap: Record<number, string> = {
    1: kayakingImg, 2: bikesImg, 3: snorkelingImg, 4: photographyImg,
    5: spaImg, 6: diningImg, 7: atvImg, 8: boatImg, 9: ziplineImg,
    10: horsebackImg, 11: scubaImg, 12: hikingImg, 13: parasailingImg,
    14: yogaImg, 15: fishingImg, 16: cookingImg, 17: balloonImg, 18: wineImg,
  };
  return imageMap[experienceId] || kayakingImg;
};

interface Wishlist {
  id: string;
  name: string;
  created_at: string;
  items?: WishlistItem[];
}

interface WishlistItem {
  id: string;
  experience_id: number;
}

interface FavoriteRestaurant extends Restaurant {
  favoriteId: string;
}

interface FavoriteVendor {
  id: string;
  name: string;
  category: string;
  description: string | null;
  photos: string[] | null;
  price_per_person: number | null;
  google_rating: number | null;
}

const Wishlists = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthContext();
  const { requireSignIn } = useRequireSignIn();
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [favoriteRestaurants, setFavoriteRestaurants] = useState<FavoriteRestaurant[]>([]);
  const [favoriteVendors, setFavoriteVendors] = useState<FavoriteVendor[]>([]);
  const [selectedWishlist, setSelectedWishlist] = useState<Wishlist | null>(null);
  const [newWishlistName, setNewWishlistName] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("experiences");

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/appview');
    }
  };

  // Load favorites on every mount (not just when auth changes)
  useEffect(() => {
    // Always load restaurant favorites (stored in localStorage)
    loadFavoriteRestaurants();
    // Load vendor favorites
    loadFavoriteVendors();
    
    // Only fetch wishlists from Supabase if authenticated
    if (isAuthenticated) {
      fetchWishlists();
    } else {
      setLoading(false);
    }
  }, []); // Run on every mount
  
  // Reload vendors when isAuthenticated changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchWishlists();
    }
  }, [isAuthenticated]);

  const loadFavoriteVendors = async () => {
    const favoriteIds = JSON.parse(localStorage.getItem("vendorFavorites") || "[]");
    if (favoriteIds.length === 0) {
      setFavoriteVendors([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('vendor_profiles')
        .select('id, name, category, description, photos, price_per_person, google_rating')
        .in('id', favoriteIds);

      if (error) throw error;
      setFavoriteVendors((data as FavoriteVendor[]) || []);
    } catch (error) {
      console.error("Error loading favorite vendors:", error);
      setFavoriteVendors([]);
    }
  };

  const removeVendorFavorite = (vendorId: string) => {
    const favoriteIds = JSON.parse(localStorage.getItem("vendorFavorites") || "[]");
    const newFavorites = favoriteIds.filter((id: string) => id !== vendorId);
    localStorage.setItem("vendorFavorites", JSON.stringify(newFavorites));
    setFavoriteVendors(favoriteVendors.filter(v => v.id !== vendorId));
    toast.success("Removed from favorites");
  };

  const loadFavoriteRestaurants = () => {
    const favoriteIds = JSON.parse(localStorage.getItem("restaurantFavorites") || "[]");
    const restaurants: FavoriteRestaurant[] = [];
    
    favoriteIds.forEach((id: string) => {
      // First check localStorage cache (all favorited restaurants are cached there now)
      const cached = localStorage.getItem(`restaurant_${id}`);
      if (cached) {
        try {
          const parsedRestaurant = JSON.parse(cached);
          restaurants.push({ ...parsedRestaurant, favoriteId: id });
          return;
        } catch (e) {
          console.error("Error parsing cached restaurant:", e);
        }
      }
      
      // Fallback to mock restaurants if not in cache
      const mockRestaurant = mockRestaurants.find(r => r.id === id);
      if (mockRestaurant) {
        restaurants.push({ ...mockRestaurant, favoriteId: id });
      }
    });
    
    setFavoriteRestaurants(restaurants);
  };

  const removeRestaurantFavorite = (restaurantId: string) => {
    const favoriteIds = JSON.parse(localStorage.getItem("restaurantFavorites") || "[]");
    const newFavorites = favoriteIds.filter((id: string) => id !== restaurantId);
    localStorage.setItem("restaurantFavorites", JSON.stringify(newFavorites));
    setFavoriteRestaurants(favoriteRestaurants.filter(r => r.id !== restaurantId));
    toast.success("Removed from favorites");
  };

  const fetchWishlists = async () => {
    try {
      const { data: wishlistsData, error: wishlistsError } = await supabase
        .from("wishlists")
        .select("*")
        .order("created_at", { ascending: false });

      if (wishlistsError) throw wishlistsError;

      // Fetch items for each wishlist
      const wishlistsWithItems = await Promise.all(
        (wishlistsData || []).map(async (wishlist) => {
          const { data: items } = await supabase
            .from("wishlist_items")
            .select("*")
            .eq("wishlist_id", wishlist.id);
          return { ...wishlist, items: items || [] };
        })
      );

      setWishlists(wishlistsWithItems);
    } catch (error) {
      console.error("Error fetching wishlists:", error);
      toast.error("Failed to load wishlists");
    } finally {
      setLoading(false);
    }
  };

  const createWishlist = async () => {
    if (!requireSignIn("save")) return;
    if (!newWishlistName.trim()) {
      toast.error("Please enter a wishlist name");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("wishlists")
        .insert({ name: newWishlistName.trim(), user_id: user?.id })
        .select()
        .single();

      if (error) throw error;

      setWishlists([{ ...data, items: [] }, ...wishlists]);
      setNewWishlistName("");
      setIsCreateOpen(false);
      toast.success("Wishlist created!");
    } catch (error) {
      console.error("Error creating wishlist:", error);
      toast.error("Failed to create wishlist");
    }
  };

  const deleteWishlist = async (wishlistId: string) => {
    try {
      const { error } = await supabase
        .from("wishlists")
        .delete()
        .eq("id", wishlistId);

      if (error) throw error;

      setWishlists(wishlists.filter((w) => w.id !== wishlistId));
      if (selectedWishlist?.id === wishlistId) {
        setSelectedWishlist(null);
      }
      toast.success("Wishlist deleted");
    } catch (error) {
      console.error("Error deleting wishlist:", error);
      toast.error("Failed to delete wishlist");
    }
  };

  const removeFromWishlist = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("wishlist_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      if (selectedWishlist) {
        const updatedItems = selectedWishlist.items?.filter((i) => i.id !== itemId) || [];
        setSelectedWishlist({ ...selectedWishlist, items: updatedItems });
        setWishlists(
          wishlists.map((w) =>
            w.id === selectedWishlist.id ? { ...w, items: updatedItems } : w
          )
        );
      }
      toast.success("Removed from wishlist");
    } catch (error) {
      console.error("Error removing item:", error);
      toast.error("Failed to remove item");
    }
  };

  const getWishlistThumbnails = (wishlist: Wishlist) => {
    const items = wishlist.items || [];
    return items.slice(0, 4).map((item) => getExperienceImage(item.experience_id));
  };

  // Get total favorites count
  const wishlistExperienceCount = wishlists.reduce((sum, w) => sum + (w.items?.length || 0), 0);
  const totalExperienceFavorites = favoriteVendors.length + wishlistExperienceCount;
  const totalRestaurantFavorites = favoriteRestaurants.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Detail view for selected wishlist
  if (selectedWishlist) {
    const wishlistExperiences = (selectedWishlist.items || [])
      .map((item) => ({
        ...experiences.find((e) => e.id === item.experience_id),
        itemId: item.id,
      }))
      .filter((e) => e.id);

    return (
      <PageTransition className="min-h-screen bg-background">
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
            <Button variant="ghost" size="icon" aria-label="Back to wishlists" onClick={() => setSelectedWishlist(null)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold flex-1">{selectedWishlist.name}</h1>
            <span className="text-muted-foreground text-sm">
              {wishlistExperiences.length} saved
            </span>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-6">
          {wishlistExperiences.length === 0 ? (
            <div className="text-center py-16">
              <Heart className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No experiences saved yet</p>
              <Button variant="outline" className="mt-4" onClick={() => navigate("/")}>
                Explore Experiences
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {wishlistExperiences.map((exp) => (
                <Card key={exp.itemId} className="overflow-hidden group">
                  <div className="relative aspect-[4/3]">
                    <img
                      src={getExperienceImage(exp.id!)}
                      alt={exp.name}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => removeFromWishlist(exp.itemId)}
                      aria-label={`Remove ${exp.name} from this wishlist`}
                      className="absolute top-3 right-3 p-2 rounded-full bg-paper/90 hover:bg-paper transition-colors"
                    >
                      <Heart className="h-5 w-5 fill-danger text-danger" />
                    </button>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold">{exp.name}</h3>
                    <p className="text-sm text-muted-foreground">{exp.vendor}</p>
                    <p className="mt-2 font-semibold">${exp.price} <span className="font-normal text-muted-foreground text-sm">per person</span></p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </main>
      </PageTransition>
    );
  }

  // Main favorites view with tabs
  return (
    <PageTransition className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" aria-label="Go back" onClick={handleBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold flex-1">Favorites</h1>
          {activeTab === "experiences" && (
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Create
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create new wishlist</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <Input
                    placeholder="Name your wishlist"
                    value={newWishlistName}
                    onChange={(e) => setNewWishlistName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && createWishlist()}
                  />
                  <Button onClick={createWishlist} className="w-full">
                    Create
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="experiences" className="flex items-center gap-2">
              <Compass className="h-4 w-4" />
              Experiences
              {totalExperienceFavorites > 0 && (
                <span className="bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded-full">
                  {totalExperienceFavorites}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="restaurants" className="flex items-center gap-2">
              <Utensils className="h-4 w-4" />
              Restaurants
              {totalRestaurantFavorites > 0 && (
                <span className="bg-primary/20 text-primary text-xs px-1.5 py-0.5 rounded-full">
                  {totalRestaurantFavorites}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="experiences">
            {favoriteVendors.length === 0 && wishlists.length === 0 ? (
              <div className="text-center py-16">
                <Compass className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h2 className="text-lg font-semibold mb-2">No favorite experiences yet</h2>
                <p className="text-muted-foreground mb-6">
                  Heart experiences to save them here
                </p>
                <Button variant="outline" onClick={() => navigate("/appview")}>
                  Explore Experiences
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Favorite Vendors */}
                {favoriteVendors.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {favoriteVendors.map((vendor) => (
                      <Card 
                        key={vendor.id} 
                        className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => navigate(`/vendor/${vendor.id}`)}
                      >
                        <div className="relative aspect-[4/3]">
                          <img
                            src={vendor.photos?.[0] || '/placeholder.svg'}
                            alt={vendor.name}
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeVendorFavorite(vendor.id);
                            }}
                            aria-label={`Remove ${vendor.name} from favorites`}
                            className="absolute top-3 right-3 p-2 rounded-full bg-paper/90 hover:bg-paper transition-colors"
                          >
                            <Heart className="h-5 w-5 fill-danger text-danger" />
                          </button>
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold line-clamp-1">{vendor.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {vendor.category}
                          </p>
                          <div className="mt-2">
                            <GoogleRating
                              value={resolveGoogleRating({ googleRating: vendor.google_rating })}
                              showCount={false}
                              className="text-sm"
                              starClassName="h-4 w-4"
                            />
                          </div>
                          {vendor.price_per_person !== null && (
                            <p className="mt-1 text-sm font-medium">
                              ${vendor.price_per_person} <span className="font-normal text-muted-foreground">per person</span>
                            </p>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Wishlists */}
                {wishlists.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {wishlists.map((wishlist) => {
                      const thumbnails = getWishlistThumbnails(wishlist);
                      const itemCount = wishlist.items?.length || 0;

                      return (
                        <Card
                          key={wishlist.id}
                          className="overflow-hidden cursor-pointer group hover:shadow-lg transition-shadow"
                          onClick={() => setSelectedWishlist(wishlist)}
                        >
                          <div className="relative aspect-square">
                            {thumbnails.length === 0 ? (
                              <div className="w-full h-full bg-muted flex items-center justify-center">
                                <Heart className="h-8 w-8 text-muted-foreground/30" />
                              </div>
                            ) : thumbnails.length === 1 ? (
                              <img
                                src={thumbnails[0]}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="grid grid-cols-2 h-full">
                                {[0, 1, 2, 3].map((i) => (
                                  <div key={i} className="relative">
                                    {thumbnails[i] ? (
                                      <img
                                        src={thumbnails[i]}
                                        alt=""
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-muted" />
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                            <div className="absolute top-2 right-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="secondary" size="icon" aria-label="Wishlist actions" className="h-8 w-8 bg-paper/90 hover:bg-paper">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent>
                                  <DropdownMenuItem
                                    className="text-destructive"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deleteWishlist(wishlist.id);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold">{wishlist.name}</h3>
                            <p className="text-sm text-muted-foreground">{itemCount} saved</p>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="restaurants">
            {favoriteRestaurants.length === 0 ? (
              <div className="text-center py-16">
                <Utensils className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <h2 className="text-lg font-semibold mb-2">No favorite restaurants yet</h2>
                <p className="text-muted-foreground mb-6">
                  Heart restaurants to save them here
                </p>
                <Button variant="outline" onClick={() => navigate("/restaurants")}>
                  Explore Restaurants
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {favoriteRestaurants.map((restaurant) => (
                  <Card 
                    key={restaurant.id} 
                    className="overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => navigate(`/restaurant/${restaurant.id}`)}
                  >
                    <div className="relative aspect-[4/3]">
                      <img
                        src={restaurant.photos?.[0] || '/placeholder.svg'}
                        alt={restaurant.name}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeRestaurantFavorite(restaurant.id);
                        }}
                        aria-label={`Remove ${restaurant.name} from favorites`}
                        className="absolute top-3 right-3 p-2 rounded-full bg-paper/90 hover:bg-paper transition-colors"
                      >
                        <Heart className="h-5 w-5 fill-danger text-danger" />
                      </button>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold line-clamp-1">{restaurant.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {restaurant.cuisine} • {restaurant.neighborhood || restaurant.city}
                      </p>
                      <div className="mt-2">
                        <GoogleRating
                          value={resolveGoogleRating({
                            place: {
                              rating: restaurant.rating,
                              reviewCount: restaurant.reviewCount,
                              isFromApi: restaurant.isFromApi,
                            },
                          })}
                          className="text-sm"
                          starClassName="h-4 w-4"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </PageTransition>
  );
};

export default Wishlists;
