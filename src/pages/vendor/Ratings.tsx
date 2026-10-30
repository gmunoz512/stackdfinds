import { Card } from "@/components/ui/card";
import { ArrowLeft, Star, ThumbsUp, ExternalLink } from "lucide-react";
import VendorBottomNav from "@/components/VendorBottomNav";
import { useSmartBack } from "@/hooks/use-smart-back";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { GoogleRating } from "@/components/GoogleRating";
import { resolveGoogleRating } from "@/lib/googleRating";

const VendorRatings = () => {
  const goBack = useSmartBack("/vendor/dashboard");
  const { user } = useAuthContext();

  // Fetch vendor profile with Google rating
  const { data: vendorProfile, isLoading } = useQuery({
    queryKey: ['vendorRatingsProfile', user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from('vendor_profiles')
        .select('google_rating, google_reviews_url, name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const resolvedRating = resolveGoogleRating({ googleRating: vendorProfile?.google_rating });
  const googleRating = resolvedRating?.rating;
  const googleReviewsUrl = vendorProfile?.google_reviews_url;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-[375px] mx-auto px-4 py-6 space-y-6">
        <button 
          onClick={goBack}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors active:scale-95"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </button>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Business Rating</h1>
          <p className="text-sm text-muted-foreground">Your Google/Airbnb rating</p>
        </div>

        {/* Rating Card */}
        {isLoading ? (
          <Card className="p-6">
            <Skeleton className="h-8 w-24 mx-auto mb-2" />
            <Skeleton className="h-4 w-32 mx-auto" />
          </Card>
        ) : googleRating ? (
          <Card className="p-6 bg-gradient-to-br from-rating/10 to-brand/10 border-rating/20">
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center">
                <GoogleRating
                  value={resolvedRating}
                  showCount={false}
                  className="text-5xl font-bold"
                  starClassName="h-8 w-8"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Rating from Google/Airbnb
              </p>
              {googleReviewsUrl && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={() => window.open(googleReviewsUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4" />
                  View All Reviews
                </Button>
              )}
            </div>
          </Card>
        ) : (
          <Card className="p-6 text-center">
            <Star className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">No rating yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Add your Google Place ID in your profile to display your rating
            </p>
          </Card>
        )}

        {/* Rating Quality Indicator */}
        {googleRating && (
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3">Rating Quality</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Your Rating</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= Math.round(googleRating)
                          ? 'text-rating fill-rating'
                          : 'text-muted-foreground'
                      }`}
                    />
                  ))}
                </div>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-rating-light to-brand transition-all duration-500"
                  style={{ width: `${(googleRating / 5) * 100}%` }}
                />
              </div>
              <div className="flex items-center gap-2">
                <ThumbsUp className={`h-4 w-4 ${googleRating >= 4.5 ? 'text-success' : 'text-muted-foreground'}`} />
                <span className="text-xs text-muted-foreground">
                  {googleRating >= 4.5 
                    ? 'Excellent! Your rating is outstanding.'
                    : googleRating >= 4.0
                    ? 'Great rating! Keep up the good work.'
                    : googleRating >= 3.5
                    ? 'Good rating. Room for improvement.'
                    : 'Consider ways to improve your customer experience.'}
                </span>
              </div>
            </div>
          </Card>
        )}
      </div>

      <VendorBottomNav />
    </div>
  );
};

export default VendorRatings;
