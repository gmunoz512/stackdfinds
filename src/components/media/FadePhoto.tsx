import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type FadePhotoProps = {
  src: string;
  alt: string;
  className?: string;
  frameClassName?: string;
  loading?: "eager" | "lazy";
  /** When set, a broken photo unmounts so the parent can show its own fallback. */
  onError?: () => void;
};

/**
 * Reserved photo frame with a cream wash, then a short opacity fade.
 * Pattern from the MIT `img-fx` loader (libraries.dev). Written here so the
 * app does not take that package as a dependency.
 */
export function FadePhoto({
  src,
  alt,
  className,
  frameClassName,
  loading = "lazy",
  onError,
}: FadePhotoProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
    const img = imgRef.current;
    if (img && img.complete && img.naturalWidth > 0) setLoaded(true);
  }, [src]);

  if (!src || (failed && onError)) return null;

  return (
    <span className={cn("fade-photo", loaded && "is-loaded", frameClassName)}>
      <span className="fade-photo-wash" aria-hidden="true" />
      {!failed && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          loading={loading}
          decoding="async"
          className={cn("fade-photo-img", className)}
          onLoad={() => setLoaded(true)}
          onError={() => {
            setFailed(true);
            onError?.();
          }}
        />
      )}
    </span>
  );
}

export default FadePhoto;
