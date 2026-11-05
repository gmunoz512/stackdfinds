import { cn } from "@/lib/utils";

interface GoogleReviewsPreviewProps {
  googlePlaceId: string;
  className?: string;
  /** Shown when live Google reviews are unavailable. Omit to render nothing. */
  emptyLabel?: string | null;
}

/**
 * Live Google review fetch is turned off (billed Places API).
 * We keep a free deep-link to the place on Google Maps instead.
 */
export function GoogleReviewsPreview({ googlePlaceId, className, emptyLabel = null }: GoogleReviewsPreviewProps) {
  const mapsUrl = `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(googlePlaceId)}`;

  return (
    <div className={cn("space-y-2", className)}>
      {emptyLabel ? (
        <p className="text-[15px] text-muted-foreground">{emptyLabel}</p>
      ) : null}
      <a
        href={mapsUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[15px] font-semibold underline underline-offset-4 hover:text-foreground/80 transition-colors inline-block"
      >
        View on Google Maps
      </a>
    </div>
  );
}
