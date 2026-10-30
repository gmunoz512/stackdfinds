import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, Star, Search, Store } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SkeletonCardGrid } from "@/components/ui/skeleton-card";
import { AnimatedTabs } from "@/components/AnimatedTabs";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { GoogleRating } from "@/components/GoogleRating";
import { resolveGoogleRating } from "@/lib/googleRating";
import { useRequireSignIn } from "@/hooks/useRequireSignIn";
import stackdLogo from "@/assets/stackd-logo-new.png";

const categories = [
  { id: "all", name: "All", icon: "✨" },
  { id: "Water Sports", name: "Water Sports", icon: "🌊" },
  { id: "Tours & Activities", name: "Tours", icon: "🗺️" },
  { id: "Transportation", name: "Transportation", icon: "🚴" },
  { id: "Wellness", name: "Wellness", icon: "💆" },
  { id: "Photography", name: "Photography", icon: "📸" },
];

interface VendorExperience {
  id: string;
  name: string;
  category: string;
  description: string | null;
  photos: string[] | null;
  price_per_person: number | null;
  google_rating: number | null;
}

const AllExperiences = () => {
  const { requireSignIn } = useRequireSignIn();
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [experiences, setExperiences] = useState<VendorExperience[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>(() => {
    const saved = localStorage.getItem("vendorFavorites");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    fetchExperiences();
  }, []);

  const fetchExperiences = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('vendor_profiles_public')
        .select('id, name, category, description, photos, price_per_person, google_rating, is_published, listing_type')
        .eq('is_published', true)
        .eq('listing_type', 'experience');

      if (error) throw error;
      setExperiences((data as VendorExperience[]) || []);
    } catch (error) {
      console.error('Error fetching experiences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!requireSignIn("save")) return;
    setFavorites((prev) => {
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

  const filteredExperiences = experiences.filter((exp) => {
    const matchesCategory = selectedCategory === "all" || exp.category === selectedCategory;
    const matchesSearch = searchQuery === "" || 
      exp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exp.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exp.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    return matchesCategory && matchesSearch;
  });

  const handleBack = () => {
    navigate('/appview');
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <button aria-label="Go back" onClick={handleBack} className="p-2 -ml-2 hover:bg-accent rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <Link to="/appview" className="flex items-center gap-2">
            <img src={stackdLogo} alt="stackd" className="h-8 w-8" />
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="px-4 py-4 space-y-4 max-w-6xl mx-auto w-full">
        <h1 className="text-2xl font-bold">Popular Experiences</h1>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search experiences..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-full"
          />
        </div>

        {/* Category Filters with Animated Indicator */}
        <AnimatedTabs
          tabs={categories}
          activeTab={selectedCategory}
          onTabChange={setSelectedCategory}
          variant="gradient"
        />

        {/* Results Count */}
        {!isLoading && (
          <p className="text-sm text-muted-foreground">
            {filteredExperiences.length} experience{filteredExperiences.length !== 1 ? 's' : ''} found
          </p>
        )}

        {/* Experiences Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {isLoading ? (
            <SkeletonCardGrid count={6} variant="experience" columns={2} />
          ) : filteredExperiences.length === 0 ? (
            <div className="col-span-2 md:col-span-3 lg:col-span-4 text-center py-12">
              <Store className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No experiences found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            filteredExperiences.map((experience, index) => (
              <Link 
                key={experience.id} 
                to={`/vendor/${experience.id}`} 
                className="block group animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="space-y-2">
                  <div className="relative aspect-square overflow-hidden rounded-xl">
                    {experience.photos && experience.photos.length > 0 ? (
                      <div
                        className="absolute inset-0 bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                        style={{
                          backgroundImage: `url(${experience.photos[0]})`,
                        }}
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-brand to-iris-strong flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                        <Store className="h-10 w-10 text-paper/80" />
                      </div>
                    )}
                    
                    <button
                      type="button"
                      aria-label={favorites.includes(experience.id) ? `Remove ${experience.name} from saved` : `Save ${experience.name}`}
                      onClick={(e) => toggleFavorite(experience.id, e)}
                      className="absolute top-2 right-2 z-10 p-1.5 rounded-full hover:scale-110 active:scale-95 transition-transform"
                    >
                      <Heart
                        className={`h-5 w-5 transition-all drop-shadow-md ${
                          favorites.includes(experience.id)
                            ? "fill-danger text-danger"
                            : "fill-ink/50 text-paper stroke-paper stroke-2"
                        }`}
                      />
                    </button>

                    {experience.google_rating && experience.google_rating >= 4.8 && (
                      <div className="absolute top-2 left-2 z-10">
                        <Badge className="bg-paper/95 text-foreground backdrop-blur-sm shadow-sm text-[10px] px-2 py-0.5 border-0">
                          Guest favorite
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="space-y-0.5">
                    <h3 className="font-semibold text-sm line-clamp-2">{experience.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">{experience.category}</p>
                    <GoogleRating
                      value={resolveGoogleRating({ googleRating: experience.google_rating })}
                      showCount={false}
                      className="text-xs"
                      starClassName="h-3 w-3"
                    />
                    {experience.price_per_person && (
                      <div className="pt-0.5">
                        <span className="text-sm font-semibold">${experience.price_per_person}</span>
                        <span className="text-xs text-muted-foreground"> per person</span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AllExperiences;
