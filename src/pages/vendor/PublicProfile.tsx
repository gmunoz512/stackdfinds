import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  ArrowLeft, Star, Clock, Users, CheckCircle, Heart,
  Instagram, ExternalLink, Store, MessageSquare, Quote, Share, MapPin
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import StackedPhotoGrid from '@/components/ui/stacked-photo-grid';
import PriceComparison from '@/components/PriceComparison';
import { VendorReviews } from '@/components/VendorReviews';
import MeetTheHost from '@/components/MeetTheHost';
import { VendorLocationMap } from '@/components/VendorLocationMap';
import { VettedBadge } from '@/components/listing/VettedBadge';
import { RefundPolicy } from '@/components/listing/RefundPolicy';
import { GoogleRating } from '@/components/GoogleRating';
import { resolveGoogleRating } from '@/lib/googleRating';
import { useRequireSignIn } from '@/hooks/useRequireSignIn';
import { GoogleReviewsPreview } from '@/components/GoogleReviewsPreview';

// --- Types ---

interface PriceTier {
  name: string;
  price: number;
}

interface AirbnbReview {
  reviewerName: string;
  date: string;
  comment: string;
}

interface VendorProfile {
  id: string;
  name: string;
  category: string;
  description: string | null;
  about_experience: string | null;
  instagram_url: string | null;
  photos: string[] | null;
  menu_url: string | null;
  price_per_person: number | null;
  price_tiers: PriceTier[] | null;
  duration: string | null;
  max_guests: number | null;
  included_items: string[] | null;
  google_rating: number | null;
  google_reviews_url: string | null;
  commission_percentage: number | null;
  airbnb_experience_url: string | null;
  airbnb_reviews: AirbnbReview[] | null;
  host_bio: string | null;
  host_avatar_url: string | null;
  meeting_point_description: string | null;
  google_place_id: string | null;
  city: string | null;
  cancellation_hours: number | null;
  verification_status: string | null;
  verified_at: string | null;
}

// --- Helpers ---

// --- Component ---

const VendorPublicProfile = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { role, isAuthenticated } = useAuthContext();
  const { requireSignIn } = useRequireSignIn();
  const [profile, setProfile] = useState<VendorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [selectedTierIndex, setSelectedTierIndex] = useState<number>(0);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  const isHostContext = searchParams.get('mode') === 'host';
  const canSeeCommission = isAuthenticated && role === 'host' && isHostContext;
  const hostId = searchParams.get('host');

  useEffect(() => {
    if (id) {
      fetchProfile();
      checkFavorite();
    }
  }, [id]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_profiles_public')
        .select('*')
        .eq('id', id)
        .eq('is_published', true)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        let priceTiers: PriceTier[] = [];
        if (Array.isArray(data.price_tiers)) {
          priceTiers = data.price_tiers.map((tier: unknown) => {
            const t = tier as { name?: string; price?: number };
            return { name: t.name || '', price: t.price || 0 };
          });
        }
        
        let airbnbReviews: AirbnbReview[] = [];
        if (Array.isArray(data.airbnb_reviews)) {
          airbnbReviews = data.airbnb_reviews.map((review: unknown) => {
            const r = review as { reviewerName?: string; date?: string; comment?: string };
            return { reviewerName: r.reviewerName || '', date: r.date || '', comment: r.comment || '' };
          }).filter((review) => review.comment.trim().length > 0);
        }
        
        setProfile({
          ...data,
          price_tiers: priceTiers,
          airbnb_reviews: airbnbReviews,
          commission_percentage: null,
          host_bio: data.host_bio || null,
          host_avatar_url: data.host_avatar_url || null,
          meeting_point_description: data.meeting_point_description || null,
          google_place_id: data.google_place_id || null,
          city: data.city || null,
        } as VendorProfile);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const checkFavorite = () => {
    const favorites = JSON.parse(localStorage.getItem('vendorFavorites') || '[]');
    setIsFavorite(favorites.includes(id));
  };

  const toggleFavorite = () => {
    if (!requireSignIn("save")) return;
    const favorites = JSON.parse(localStorage.getItem('vendorFavorites') || '[]');
    let newFavorites;
    if (favorites.includes(id)) {
      newFavorites = favorites.filter((f: string) => f !== id);
      toast.success('Removed from favorites');
    } else {
      newFavorites = [...favorites, id];
      toast.success('Added to favorites');
    }
    localStorage.setItem('vendorFavorites', JSON.stringify(newFavorites));
    setIsFavorite(!isFavorite);
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/appview');
    }
  };

  const handleBook = () => {
    if (!requireSignIn("book")) return;
    const params = new URLSearchParams();
    if (profile?.price_tiers && profile.price_tiers.length > 0) {
      params.set('tier', selectedTierIndex.toString());
    }
    if (hostId) {
      params.set('host', hostId);
    }
    navigate(`/vendor/${id}/book${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const currentPrice = profile?.price_tiers && profile.price_tiers.length > 0
    ? profile.price_tiers[selectedTierIndex]?.price || 0
    : profile?.price_per_person || 0;

  // --- Loading state ---
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="max-w-[375px] md:max-w-3xl lg:max-w-5xl mx-auto">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-[280px] w-full" />
          <div className="p-4 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // --- Not found ---
  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pb-24">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Profile not found or not published</p>
          <Button variant="link" onClick={handleBack}>
            Back to Explore
          </Button>
        </div>
      </div>
    );
  }

  const photos = profile.photos || [];

  return (
    <div className="min-h-screen bg-background pb-[100px]">
      <div className="max-w-[375px] md:max-w-3xl lg:max-w-5xl mx-auto">

        {/* Floating header bar */}
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
          <div className="px-4 py-3 flex items-center justify-between">
            <button aria-label="Go back"
              onClick={handleBack}
              className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-1">
              <button aria-label="Share this profile" className="p-2 rounded-full hover:bg-muted transition-colors">
                <Share className="h-5 w-5" />
              </button>
              <button aria-label="Toggle favorite"
                onClick={toggleFavorite}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <Heart className={`h-5 w-5 ${isFavorite ? 'fill-danger text-danger' : ''}`} />
              </button>
            </div>
          </div>
        </header>

        <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start">
        {/* Photo Grid */}
        <div className="px-4 lg:px-6 lg:pt-2">
          {photos.length > 0 ? (
            <StackedPhotoGrid photos={photos} alt={profile.name} />
          ) : (
            <div className="w-full h-[280px] rounded-xl bg-gradient-to-br from-brand to-iris-strong flex items-center justify-center">
              <Store className="h-16 w-16 text-paper/60" />
            </div>
          )}
        </div>

        {/* Content sections */}
        <div className="px-4 lg:px-6">

          {/* Section: Title + Rating */}
          <div className="py-6 space-y-2">
            <h1 className="text-2xl font-semibold leading-tight">{profile.name}</h1>
            <p className="text-[15px] text-muted-foreground">{profile.category}</p>

            <div className="pt-1">
              <GoogleRating
                value={resolveGoogleRating({ googleRating: profile.google_rating })}
                className="text-[15px]"
                starClassName="h-4 w-4"
              />
            </div>
          </div>

          <Separator />

          {/* Section: Quick Info */}
          <div className="py-6">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-[15px] font-medium">{profile.duration || 'Varies'}</p>
                  <p className="text-[13px] text-muted-foreground">Duration</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-[15px] font-medium">Up to {profile.max_guests || 'N/A'}</p>
                  <p className="text-[13px] text-muted-foreground">Guests</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Section: About This Experience */}
          {profile.about_experience && (
            <>
              <div className="py-6 space-y-3">
                <h2 className="text-[22px] font-semibold">About this experience</h2>
                <div className="relative">
                  <p className={`text-[15px] leading-relaxed text-foreground whitespace-pre-wrap ${!descriptionExpanded ? 'line-clamp-4' : ''}`}>
                    {profile.about_experience}
                  </p>
                  {profile.about_experience.length > 200 && (
                    <button
                      onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                      className="text-[15px] font-semibold underline underline-offset-4 mt-2 hover:text-foreground/80 transition-colors"
                    >
                      {descriptionExpanded ? 'Show less' : 'Read more'}
                    </button>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Section: What's Included */}
          {profile.included_items && profile.included_items.length > 0 && (
            <>
              <div className="py-6 space-y-4">
                <h2 className="text-[22px] font-semibold">What's included</h2>
                <ul className="space-y-3">
                  {profile.included_items.map((item, index) => (
                    <li key={index} className="flex items-start gap-3 text-[15px]">
                      <CheckCircle className="h-5 w-5 text-foreground flex-shrink-0 mt-0.5" />
                      <span className="text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <Separator />
            </>
          )}

          {/* Section: Price Tier Selector */}
          {profile.price_tiers && profile.price_tiers.length > 0 && (
            <>
              <div className="py-6 space-y-4">
                <h2 className="text-[22px] font-semibold">Choose your experience</h2>
                <Select
                  value={selectedTierIndex.toString()}
                  onValueChange={(val) => setSelectedTierIndex(parseInt(val))}
                >
                  <SelectTrigger className="w-full bg-background">
                    <SelectValue placeholder="Choose an option" />
                  </SelectTrigger>
                  <SelectContent className="bg-card z-50">
                    {profile.price_tiers.map((tier, idx) => (
                      <SelectItem key={idx} value={idx.toString()}>
                        {tier.name} — ${tier.price}/person
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[15px] text-muted-foreground">Selected:</span>
                  <span className="text-xl font-semibold">
                    ${profile.price_tiers[selectedTierIndex]?.price || 0}
                    <span className="text-[15px] font-normal text-muted-foreground"> /person</span>
                  </span>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Section: Price Comparison */}
          {(profile.price_per_person || (profile.price_tiers && profile.price_tiers.length > 0)) && (
            <>
              <div className="py-6">
                <PriceComparison
                  category={profile.category}
                  experienceName={profile.name}
                  currentPrice={currentPrice}
                  duration={profile.duration || undefined}
                />
              </div>
              <Separator />
            </>
          )}

          {/* Section: Where you'll be */}
          <div className="py-6 space-y-4">
            <h2 className="text-[22px] font-semibold">Where you'll meet</h2>
            <div className="rounded-xl overflow-hidden">
              <VendorLocationMap
                vendorName={profile.name}
                placeId={profile.google_place_id || undefined}
                mode="pin"
              />
            </div>
            {profile.meeting_point_description && (
              <div className="flex items-start gap-2 pt-1">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-[15px] text-foreground">{profile.meeting_point_description}</p>
              </div>
            )}
            {profile.city && (
              <p className="text-[14px] text-muted-foreground">{profile.city}</p>
            )}
          </div>
          <Separator />

          {/* Section: Meet your host */}
          <div className="py-6">
            <MeetTheHost
              name={profile.name}
              category={profile.category}
              bio={profile.host_bio}
              avatarUrl={profile.host_avatar_url}
              googleRating={profile.google_rating}
            />
          </div>
          <Separator />

          <div className="py-6 space-y-4">
            <h2 className="text-[22px] font-semibold">Reviews</h2>
            <VendorReviews vendorProfileId={profile.id} />
            {profile.google_place_id ? (
              <GoogleReviewsPreview
                googlePlaceId={profile.google_place_id}
                emptyLabel="No Google reviews yet."
              />
            ) : null}
          </div>

          {/* Section: Airbnb Reviews */}
          {profile.airbnb_reviews && profile.airbnb_reviews.length > 0 && (
            <>
              <Separator />
              <div className="py-6 space-y-4">
                <h2 className="text-[22px] font-semibold flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Airbnb Reviews
                </h2>
                <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
                  {profile.airbnb_reviews.map((review, index) => (
                    <div key={index} className="flex-shrink-0 w-[260px] snap-start rounded-xl border border-border p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-[14px]">{review.reviewerName}</span>
                        <span className="text-xs text-muted-foreground">{review.date}</span>
                      </div>
                      <div className="flex gap-2">
                        <Quote className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <p className="text-[14px] text-foreground leading-relaxed line-clamp-4">{review.comment}</p>
                      </div>
                    </div>
                  ))}
                </div>
                {profile.airbnb_experience_url && (
                  <a
                    href={profile.airbnb_experience_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[15px] font-semibold underline underline-offset-4 hover:text-foreground/80 transition-colors"
                  >
                    View all on Airbnb
                  </a>
                )}
              </div>
            </>
          )}

          <Separator />
          <VettedBadge
            verificationStatus={profile.verification_status}
            verifiedAt={profile.verified_at}
            category={profile.category}
          />
          <Separator />
          <RefundPolicy cancellationHours={profile.cancellation_hours} />

          {/* Section: External Links */}
          {(profile.instagram_url || profile.menu_url || profile.airbnb_experience_url || profile.google_place_id) && (
            <>
              <Separator />
              <div className="py-6 flex flex-wrap gap-2">
                {profile.instagram_url && (
                  <a
                    href={profile.instagram_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <Instagram className="h-4 w-4" />
                    Instagram
                  </a>
                )}
                {profile.menu_url && (
                  <a
                    href={profile.menu_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Menu
                  </a>
                )}
                {profile.airbnb_experience_url && (
                  <a
                    href={profile.airbnb_experience_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View on Airbnb
                  </a>
                )}
                {profile.google_place_id && (
                  <a
                    href={`https://www.google.com/maps/place/?q=place_id:${profile.google_place_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full border border-input bg-background px-3 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
                  >
                    <Star className="h-4 w-4" />
                    Google Reviews
                  </a>
                )}
              </div>
            </>
          )}

          {/* Affiliate Commission — host only */}
          {canSeeCommission && profile.commission_percentage && (
            <>
              <Separator />
              <div className="py-6">
                <div className="rounded-xl border border-warning/30 bg-warning/5 p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-[15px] font-medium flex items-center gap-2">
                        💰 Affiliate Commission
                      </p>
                      <p className="text-[13px] text-muted-foreground">
                        Partner with this vendor
                      </p>
                    </div>
                    <p className="text-2xl font-bold text-warning-strong dark:text-warning-light">
                      {profile.commission_percentage}%
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        </div>

        {/* Fixed Bottom CTA */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border p-4 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] z-40">
          <div className="max-w-[375px] md:max-w-3xl lg:max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div>
              <p className="text-[13px] text-muted-foreground">
                {profile.price_tiers && profile.price_tiers.length > 0 
                  ? 'From' 
                  : 'Price'}
              </p>
              <p className="text-[18px] font-semibold">
                ${currentPrice}
                <span className="text-[13px] font-normal text-muted-foreground"> /person</span>
              </p>
            </div>
            <Button 
              size="lg"
              className="rounded-xl bg-gradient-to-r from-hot to-rose hover:from-hot-strong hover:to-rose-strong text-paper px-8 font-semibold"
              onClick={handleBook}
            >
              Book
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorPublicProfile;
