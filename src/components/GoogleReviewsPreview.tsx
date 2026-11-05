import { Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { GoogleRating } from "@/components/GoogleRating";
import { useGoogleReviews } from "@/hooks/useGoogleReviews";
import { resolveGoogleRating } from "@/lib/googleRating";
import { cn } from "@/lib/utils";

interface GoogleReviewsPreviewProps {
  googlePlaceId: string;
  className?: string;
  /** Shown when Google returns no reviews. Omit to render nothing. */
  emptyLabel?: string | null;
}

export function GoogleReviewsPreview({ googlePlaceId, className, emptyLabel = null }: GoogleReviewsPreviewProps) {
  const { data, isLoading } = useGoogleReviews({ placeId: googlePlaceId });

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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
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

  const reviews = data?.reviews ?? [];
  const placeRating = resolveGoogleRating({
    google: data ? { rating: data.rating, totalReviews: data.totalReviews } : null,
  });
  if (!data || (reviews.length === 0 && !placeRating)) {
    return emptyLabel ? <p className={cn("text-[15px] text-muted-foreground", className)}>{emptyLabel}</p> : null;
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with aggregate rating */}
      <div className="space-y-1">
        <GoogleRating value={placeRating} className="text-[22px]" starClassName="h-5 w-5" />
      </div>

      {/* Horizontal scrollable review cards */}
      <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
        {reviews.slice(0, 5).map((review, index) => (
          <div
            key={index}
            className="flex-shrink-0 w-[260px] snap-start rounded-xl border border-border p-4 space-y-3"
          >
            {/* Stars */}
            {renderStars(review.rating)}

            {/* Comment */}
            {review.text && (
              <p className="text-[14px] leading-relaxed text-foreground line-clamp-4">
                {review.text}
              </p>
            )}

            {/* Reviewer */}
            <div className="flex items-center gap-2 pt-1">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {review.profile_photo_url ? (
                  <img
                    src={review.profile_photo_url}
                    alt={review.author_name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="text-xs font-medium">
                    {getInitials(review.author_name)}
                  </span>
                )}
              </div>
              <div>
                <p className="font-medium text-[13px]">{review.author_name}</p>
                <p className="text-xs text-muted-foreground">
                  {review.relative_time_description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* View all on Google link */}
      {data.googleMapsUrl && (
        <a
          href={data.googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[15px] font-semibold underline underline-offset-4 hover:text-foreground/80 transition-colors inline-block"
        >
          View all on Google
        </a>
      )}
    </div>
  );
}
