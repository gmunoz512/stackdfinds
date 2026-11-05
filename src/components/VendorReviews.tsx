import { useEffect, useState } from "react";
import { Star, User } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  profiles?: {
    full_name: string | null;
  } | null;
}

interface VendorReviewsProps {
  vendorProfileId: string;
  className?: string;
}

export function VendorReviews({ vendorProfileId, className }: VendorReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [ratingDistribution, setRatingDistribution] = useState<number[]>([0, 0, 0, 0, 0]);

  useEffect(() => {
    fetchReviews();
  }, [vendorProfileId]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select(`id, rating, comment, created_at, user_id`)
        .eq("vendor_profile_id", vendorProfileId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(r => r.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, full_name")
          .in("user_id", userIds);

        const profileMap = new Map(profiles?.map(p => [p.user_id, p.full_name]) || []);
        
        const reviewsWithProfiles = data.map(review => ({
          ...review,
          profiles: { full_name: profileMap.get(review.user_id) || null }
        }));

        setReviews(reviewsWithProfiles);
        const total = reviewsWithProfiles.reduce((sum, r) => sum + r.rating, 0);
        setAverageRating(total / reviewsWithProfiles.length);

        // Calculate rating distribution
        const dist = [0, 0, 0, 0, 0];
        reviewsWithProfiles.forEach(r => { dist[r.rating - 1]++; });
        setRatingDistribution(dist);
      } else {
        setReviews([]);
        setAverageRating(0);
        setRatingDistribution([0, 0, 0, 0, 0]);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "h-3 w-3",
            star <= rating
              ? "fill-foreground text-foreground"
              : "text-muted-foreground/30"
          )}
        />
      ))}
    </div>
  );

  const getInitials = (name: string | null) => {
    if (!name) return "G";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        <Skeleton className="h-6 w-40" />
        <div className="flex gap-3 overflow-hidden">
          <Skeleton className="h-[160px] w-[260px] rounded-xl flex-shrink-0" />
          <Skeleton className="h-[160px] w-[260px] rounded-xl flex-shrink-0" />
        </div>
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <p className={cn("text-[15px] text-muted-foreground", className)}>
        No guest reviews yet.
      </p>
    );
  }

  const maxCount = Math.max(...ratingDistribution, 1);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with aggregate rating */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 fill-foreground text-foreground" />
          <span className="text-[22px] font-semibold">{averageRating.toFixed(1)}</span>
          <span className="text-muted-foreground">·</span>
          <span className="text-[15px] text-muted-foreground">
            {reviews.length} {reviews.length === 1 ? "review" : "reviews"}
          </span>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="space-y-1.5">
        {[5, 4, 3, 2, 1].map((star) => {
          const count = ratingDistribution[star - 1];
          const percentage = (count / maxCount) * 100;
          return (
            <div key={star} className="flex items-center gap-2 text-[13px]">
              <span className="w-3 text-right text-muted-foreground">{star}</span>
              <Star className="h-3 w-3 fill-foreground text-foreground" />
              <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-foreground transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="w-6 text-right text-muted-foreground">{count}</span>
            </div>
          );
        })}
      </div>

      {/* Horizontal scrollable review cards */}
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
        {reviews.slice(0, 8).map((review) => (
          <div
            key={review.id}
            className="flex-shrink-0 w-[260px] snap-start rounded-xl border border-border p-4 space-y-3"
          >
            {renderStars(review.rating)}

            {review.comment && (
              <p className="text-[14px] leading-relaxed text-foreground line-clamp-4">
                {review.comment}
              </p>
            )}

            <div className="flex items-center gap-2 pt-1">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                {review.profiles?.full_name ? (
                  <span className="text-xs font-medium">
                    {getInitials(review.profiles.full_name)}
                  </span>
                ) : (
                  <User className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="font-medium text-[13px]">
                  {review.profiles?.full_name || "Guest"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(review.created_at), "MMM yyyy")}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {reviews.length > 3 && (
        <button className="text-[15px] font-semibold underline underline-offset-4 hover:text-foreground/80 transition-colors">
          Show all {reviews.length} reviews
        </button>
      )}
    </div>
  );
}
