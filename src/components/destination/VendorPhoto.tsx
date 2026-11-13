import { useState } from "react";
import { FadePhoto } from "@/components/media/FadePhoto";
import { InitialsTile } from "@/components/destination/InitialsTile";

/** Local vendor photo, or the cream initials tile when the file is missing. */
export function VendorPhoto({
  src,
  name,
  frameClassName,
  loading = "lazy",
}: {
  src?: string | null;
  name: string;
  frameClassName?: string;
  loading?: "eager" | "lazy";
}) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <InitialsTile name={name} className={frameClassName} />;
  return (
    <FadePhoto
      src={src}
      alt={name}
      frameClassName={frameClassName}
      loading={loading}
      onError={() => setFailed(true)}
    />
  );
}
