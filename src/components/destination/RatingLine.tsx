import { formatRating } from "@/lib/experienceCategory";

/** Rating and review count. Renders nothing when both are missing. */
export function RatingLine({
  rating,
  reviewCount,
}: {
  rating: number | null;
  reviewCount: number | null;
}) {
  if (rating == null && reviewCount == null) return null;
  const reviews =
    reviewCount != null
      ? `${reviewCount.toLocaleString()} ${reviewCount === 1 ? "review" : "reviews"}`
      : null;
  return (
    <p className="listing-rating">
      {rating != null && <span>{formatRating(rating)}</span>}
      {rating != null && reviews ? <span aria-hidden="true"> · </span> : null}
      {reviews ? <span>{reviews}</span> : null}
    </p>
  );
}
