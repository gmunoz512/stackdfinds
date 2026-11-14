import { useState } from "react";
import { Star } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { initialsOf } from "@/components/destination/InitialsTile";
import {
  googleRestaurantSnapshot,
  snapshotRatingNumber,
  starCount,
  type GoogleSnapshotReview,
} from "@/data/googleRestaurantReviews";

function Stars({ value, label }: { value: number; label: string }) {
  return (
    <span className="google-stars" role="img" aria-label={label}>
      {[0, 1, 2, 3, 4].map((index) => {
        const fill = Math.round(Math.max(0, Math.min(1, value - index)) * 100);
        return (
          <span className="google-star" key={index} aria-hidden="true">
            <Star className="google-star-empty" strokeWidth={1.5} />
            <span className="google-star-fill" style={{ width: `${fill}%` }}>
              <Star className="google-star-full" strokeWidth={1.5} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

function ReviewText({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const [overflows, setOverflows] = useState(false);

  return (
    <>
      <p
        ref={(node) => {
          if (!node || open) return;
          const next = node.scrollHeight > node.clientHeight + 1;
          setOverflows((current) => (current === next ? current : next));
        }}
        className={open ? "google-review-text" : "google-review-text is-clamped"}
      >
        {text}
      </p>
      {overflows || open ? (
        <button
          type="button"
          className="google-review-more"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? "Show less" : "Read more"}
        </button>
      ) : null}
    </>
  );
}

function ReviewCard({ review }: { review: GoogleSnapshotReview }) {
  const count = starCount(review.stars);
  return (
    <article className="google-review-card">
      <div className="google-review-top">
        <span className="google-review-avatar" aria-hidden="true">
          {initialsOf(review.author)}
        </span>
        <div className="min-w-0">
          <p className="google-review-author">{review.author}</p>
          <p className="google-review-meta">
            {count === null ? <span>{review.stars}</span> : <Stars value={count} label={review.stars} />}
            <span className="google-review-when">{review.when}</span>
          </p>
        </div>
      </div>
      <ReviewText text={review.text} />
    </article>
  );
}

export function GoogleRestaurantReviews({ id }: { id: string }) {
  const snapshot = googleRestaurantSnapshot(id);
  if (!snapshot) return null;
  const rating = snapshotRatingNumber(snapshot.rating);
  const mapsUrl = snapshot.mapsUrl.startsWith("https://") ? snapshot.mapsUrl : null;

  return (
    <>
      <Separator />
      <section className="google-reviews" aria-label="Google reviews">
        <h2>Google reviews</h2>
        <div className="google-review-scoreline">
          {rating !== undefined ? <Stars value={rating} label={`${snapshot.rating} out of 5`} /> : null}
          <span className="google-review-score">{snapshot.rating}</span>
        </div>
        <p className="google-review-count">{snapshot.reviewCount} Google reviews</p>
        <div className="google-review-list">
          {snapshot.reviews.slice(0, 3).map((review, index) => (
            <ReviewCard key={`${review.author}-${index}`} review={review} />
          ))}
        </div>
        {mapsUrl ? (
          <a className="google-reviews-link" href={mapsUrl} target="_blank" rel="noopener noreferrer">
            See all reviews on Google
          </a>
        ) : null}
        <p className="google-reviews-asof">Reviews from Google Maps, as of Nov 2026</p>
      </section>
    </>
  );
}
