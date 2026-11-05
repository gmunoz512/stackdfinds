import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Heart, Loader2, Sparkles } from "lucide-react";
import { GoogleRating } from "@/components/GoogleRating";
import { supabase } from "@/integrations/supabase/client";
import { mockRestaurants } from "@/data/mockRestaurants";
import RestaurantCard from "@/components/RestaurantCard";
import type { RecommendationItem } from "@/types";
import type { Json } from "@/integrations/supabase/types";
import stackdLogo from "@/assets/stackd-logo-new.png";

// Experience images

interface GuideListing {
  id: string;
  name: string;
  category: string;
  price: number | null;
  image: string | null;
  description: string | null;
  duration: string | null;
  maxGuests: number | null;
  included: string[];
  rating: number | null;
}

interface HostProfile {
  full_name: string | null;
  recommendations: RecommendationItem[];
}

// Helper to safely parse recommendations from JSON
const parseRecommendations = (data: Json | null): RecommendationItem[] => {
  if (!data || !Array.isArray(data)) return [];
  
  const result: RecommendationItem[] = [];
  
  for (const item of data) {
    if (typeof item !== 'object' || item === null) continue;
    const obj = item as Record<string, unknown>;
    if (
      typeof obj.id === 'string' &&
      (obj.type === 'vendor' || obj.type === 'restaurant' || obj.type === 'experience') &&
      typeof obj.addedAt === 'string'
    ) {
      result.push({
        id: obj.id,
        type: obj.type,
        addedAt: obj.addedAt,
      });
    }
  }
  
  return result;
};

const GuestGuide = () => {
  const { hostId } = useParams<{ hostId: string }>();
  const [hostProfile, setHostProfile] = useState<HostProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHostProfile = async () => {
      if (!hostId) {
        setError("Invalid host ID");
        setIsLoading(false);
        return;
      }

      try {
        const { data, error: fnError } = await supabase.functions.invoke("host-guide", {
          body: { hostId },
        });

        if (fnError) {
          setError(fnError.message || "Unable to load recommendations");
          return;
        }

        if (!data) {
          setError("Host not found");
          return;
        }

        // data comes from backend function; keep it strict + safe
        setHostProfile({
          full_name: typeof data.full_name === "string" ? data.full_name : null,
          recommendations: parseRecommendations((data.recommendations ?? null) as Json | null),
        });
      } catch {
        setError("Something went wrong");
      } finally {
        setIsLoading(false);
      }
    };

    fetchHostProfile();
  }, [hostId]);

  // Experience/vendor recommendations load real, published vendor listings.
  const [recommendedExperiences, setRecommendedExperiences] = useState<GuideListing[]>([]);
  useEffect(() => {
    const ids = (hostProfile?.recommendations ?? [])
      .filter((r) => r.type === "experience" || r.type === "vendor")
      .map((r) => r.id);
    if (ids.length === 0) {
      setRecommendedExperiences([]);
      return;
    }
    let cancelled = false;
    supabase
      .from("vendor_profiles")
      .select("id,name,category,price_per_person,photos,description,duration,max_guests,included_items,google_rating")
      .in("id", ids)
      .eq("is_published", true)
      .then(({ data }) => {
        if (cancelled || !data) return;
        const byId = new Map(data.map((v) => [v.id, v]));
        setRecommendedExperiences(
          ids.flatMap((id) => {
            const v = byId.get(id);
            return v
              ? [{
                  id: v.id,
                  name: v.name,
                  category: v.category,
                  price: v.price_per_person,
                  image: v.photos?.[0] ?? null,
                  description: v.description,
                  duration: v.duration,
                  maxGuests: v.max_guests,
                  included: v.included_items ?? [],
                  rating: v.google_rating,
                }]
              : [];
          }),
        );
      });
    return () => {
      cancelled = true;
    };
  }, [hostProfile]);


  const recommendedRestaurants = hostProfile?.recommendations
    .filter((r) => r.type === "restaurant")
    .map((r) => mockRestaurants.find((rest) => rest.id === r.id))
    .filter(Boolean) || [];

  const hostName = hostProfile?.full_name?.trim();
  const firstName = hostName ? hostName.split(" ")[0] : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-sm">
          <p className="text-muted-foreground mb-4">{error}</p>
          <Link to="/" className="text-primary hover:underline text-sm">
            Go to Home
          </Link>
        </Card>
      </div>
    );
  }

  const hasRecommendations = recommendedExperiences.length > 0 || recommendedRestaurants.length > 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="max-w-[430px] mx-auto flex-1 w-full">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary/10 via-background to-accent/10 px-4 py-8 text-center border-b border-border">
          <div className="w-40 h-40 mx-auto mb-4 flex items-center justify-center">
            <img src={stackdLogo} alt="stackd" className="h-40 w-40 object-contain" />
          </div>
          <h1 className="text-2xl font-bold mb-2">
            {firstName ? `Welcome to ${firstName}'s Guide` : "Welcome to Your Host's Guide"}
          </h1>
          <p className="text-muted-foreground text-sm">
            Curated recommendations for your stay
          </p>
        </div>

        {!hasRecommendations ? (
          <div className="px-4 py-12 text-center">
            <p className="text-muted-foreground">
              No recommendations yet. Check back soon!
            </p>
          </div>
        ) : (
          <Tabs defaultValue="experiences" className="flex-1">
            <TabsList className="w-full justify-start rounded-none bg-transparent h-12 p-0 border-b border-border">
              <TabsTrigger
                value="experiences"
                className="flex-1 rounded-none text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                Experiences ({recommendedExperiences.length})
              </TabsTrigger>
              <TabsTrigger
                value="restaurants"
                className="flex-1 rounded-none text-sm data-[state=active]:border-b-2 data-[state=active]:border-primary"
              >
                Restaurants ({recommendedRestaurants.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="experiences" className="mt-0 px-4 py-4">
              {recommendedExperiences.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No experience recommendations yet
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {recommendedExperiences.map((experience) => (
                    <Link
                      key={experience.id}
                      to={`/vendor/${experience.id}?host=${hostId}`}
                      className="group"
                    >
                      <div className="space-y-2">
                        <div className="aspect-square rounded-xl overflow-hidden relative bg-muted">
                          {experience.image && <img
                            src={experience.image}
                            alt={experience.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-ink/70 to-transparent p-2">
                            <p className="text-paper text-xs font-medium line-clamp-1">
                              {experience.name}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-0.5">
                          <GoogleRating
                            value={null}
                            className="text-xs"
                            starClassName="h-3 w-3"
                          />
                          <p className="text-xs text-muted-foreground">
                            {experience.price != null ? `From $${experience.price}` : "See prices"}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="restaurants" className="mt-0 px-4 py-4">
              {recommendedRestaurants.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No restaurant recommendations yet
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {recommendedRestaurants.map((restaurant) => (
                    <RestaurantCard
                      key={restaurant!.id}
                      restaurant={restaurant!}
                      variant="grid"
                      size="small"
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {/* Footer AI Trip Planner Button */}
      <div className="max-w-[430px] mx-auto w-full border-t border-border bg-background/95 backdrop-blur-sm px-4 py-4">
        <Link
          to="/trip-planner"
          state={{ 
            hostVendors: recommendedExperiences.map(exp => ({
              id: exp.id,
              name: exp.name,
              category: exp.category,
              vendor: exp.name,
              price: exp.price,
              rating: exp.rating,
              description: exp.description,
              duration: exp.duration,
              maxGuests: exp.maxGuests,
              included: exp.included,
            }))
          }}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-full bg-gradient-to-r from-brand to-iris-strong text-paper font-medium shadow-lg hover:scale-[1.02] transition-transform"
        >
          <Sparkles className="h-5 w-5" />
          Plan your trip using AI
        </Link>
      </div>
    </div>
  );
};

export default GuestGuide;
