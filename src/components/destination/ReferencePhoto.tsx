import { previewExperiences } from "@/data/previewExperiences";
import source from "@/assets/tulum-reference.jpeg";
const crops = {
  taco: [95, 336, 193, 137],
  cenote: [303, 336, 191, 137],
  moov: [95, 583, 193, 137],
  chef: [303, 583, 191, 137],
  guest: [1048, 296, 138, 137],
  host: [1048, 450, 138, 137],
  vendor: [1048, 603, 138, 137],
  eats: [570, 667, 194, 77],
  paddle: [777, 667, 194, 77],
} as const;
export type ReferenceCrop = keyof typeof crops;
/** Prefer original listing photos; mockup regions are only a fallback. */
export function ReferencePhoto({
  crop,
  src,
  alt,
  className = "",
}: {
  crop?: ReferenceCrop;
  src?: string;
  alt: string;
  className?: string;
}) {
  const original = src && src !== "/placeholder.svg"
    ? src
    : previewExperiences.find(item => item.referencePhoto === crop)?.photos[0];
  if (original || !crop)
    return <img src={original || src} alt={alt} className={`reference-photo ${className}`} loading="lazy" decoding="async" style={{objectFit:"cover"}} />;
  const [x, y, w, h] = crops[crop];
  return (
    <div
      role="img"
      aria-label={alt}
      className={`reference-photo ${className}`}
    >
      <svg
        viewBox={`${x} ${y} ${w} ${h}`}
        preserveAspectRatio="xMidYMid slice"
        width="100%"
        height="100%"
        style={{ display: "block" }}
        aria-hidden="true"
      >
        <image href={source} width="1536" height="1024" />
      </svg>
    </div>
  );
}
