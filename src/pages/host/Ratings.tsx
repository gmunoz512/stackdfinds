import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Star, ThumbsUp, MessageSquare } from "lucide-react";
import HostBottomNav from "@/components/HostBottomNav";
import { useSmartBack } from "@/hooks/use-smart-back";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";

const HostRatings = () => {
  const goBack = useSmartBack("/host/dashboard");
  const { user } = useAuthContext();

  const { data: reviewsData, isLoading } = useQuery({
    queryKey: ['hostVendorReviews', user?.id],
    queryFn: async () => {
      if (!user) return { reviews: [], vendorNames: {} };

      // Get linked vendor IDs
      const { data: links } = await supabase
        .from('host_vendor_links')
        .select('vendor_profile_id')
        .eq('host_user_id', user.id);

      if (!links || links.length === 0) return { reviews: [], vendorNames: {} };

      const vendorIds = links.map(l => l.vendor_profile_id);

      // Fetch vendor names
      const { data: vendors } = await supabase
        .from('vendor_profiles')
        .select('id, name')
        .in('id', vendorIds);

      const vendorNames: Record<string, string> = {};
      vendors?.forEach(v => {
        vendorNames[v.id] = v.name;
      });

      // Fetch reviews for these vendors
      const { data: reviews } = await supabase
        .from('reviews')
        .select('id, rating, comment, created_at, vendor_profile_id, booking_id')
        .in('vendor_profile_id', vendorIds)
        .order('created_at', { ascending: false });

      return { reviews: reviews || [], vendorNames };
    },
    enabled: !!user,
  });

  const reviews = reviewsData?.reviews || [];
  const vendorNames = reviewsData?.vendorNames || {};

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';
  const fiveStarCount = reviews.filter(r => r.rating === 5).length;
  const fiveStarPercentage = reviews.length > 0 
    ? Math.round((fiveStarCount / reviews.length) * 100)
    : 0;

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
          <h1 className="text-2xl font-bold">Guest Ratings</h1>
          <p className="text-sm text-muted-foreground">What guests are saying</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 bg-gradient-to-br from-rating/10 to-brand/10 border-rating/20 col-span-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-rating fill-rating" />
                <p className="text-xs text-muted-foreground">Average Rating</p>
              </div>
              {isLoading ? (
                <Skeleton className="h-10 w-20" />
              ) : (
                <div className="flex items-baseline gap-1">
                  <p className="text-3xl font-bold">{avgRating}</p>
                  <p className="text-sm text-muted-foreground">/ 5.0</p>
                </div>
              )}
            </div>
          </Card>
          <Card className="p-4 bg-gradient-to-br from-success/10 to-mint/10 border-success/20">
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <ThumbsUp className="h-3.5 w-3.5 text-success" />
              </div>
              {isLoading ? (
                <Skeleton className="h-8 w-12" />
              ) : (
                <div>
                  <p className="text-2xl font-bold">{fiveStarPercentage}%</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">5-star</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Rating Distribution */}
        {!isLoading && reviews.length > 0 && (
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3">Rating Distribution</h3>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = reviews.filter(r => Math.floor(r.rating) === stars).length;
                const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                
                return (
                  <div key={stars} className="flex items-center gap-2">
                    <span className="text-xs w-12">{stars} {stars === 1 ? 'star' : 'stars'}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-rating-light to-brand transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* Reviews List */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Recent Reviews
          </h2>
          
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full rounded-xl" />
              ))}
            </div>
          ) : reviews.length === 0 ? (
            <Card className="p-8 text-center">
              <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium text-foreground">No reviews yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Reviews for your linked vendors will appear here
              </p>
            </Card>
          ) : (
            <div className="space-y-3 max-h-[calc(100vh-500px)] overflow-y-auto">
              {reviews.map((review) => (
                <Card
                  key={review.id}
                  className="p-4 hover:shadow-lg transition-all duration-200"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm leading-tight">
                          {vendorNames[review.vendor_profile_id || ''] || 'Unknown Vendor'}
                        </h3>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Star className="h-4 w-4 text-rating fill-rating" />
                        <span className="font-bold text-sm">{review.rating}</span>
                      </div>
                    </div>
                    
                    {review.comment && (
                      <p className="text-sm text-foreground/80 italic">"{review.comment}"</p>
                    )}
                    
                    <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                      <span className="font-medium">Guest Review</span>
                      <span>
                        {new Date(review.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <HostBottomNav />
    </div>
  );
};

export default HostRatings;
