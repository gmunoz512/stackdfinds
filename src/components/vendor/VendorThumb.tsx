import { useState } from "react";
import { cn } from "@/lib/utils";

interface VendorThumbProps {
  name: string;
  photo?: string | null;
  className?: string;
}

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => /^[A-Za-z0-9]/.test(w))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("") || "S";

/** Vendor's main photo (same first photo as their page); cream initials tile if missing or broken. */
const VendorThumb = ({ name, photo, className }: VendorThumbProps) => {
  const [failed, setFailed] = useState(false);
  const base = cn("h-16 w-16 shrink-0 overflow-hidden rounded-xl", className);
  if (photo && !failed) {
    return (
      <img
        src={photo}
        alt={name}
        loading="lazy"
        onError={() => setFailed(true)}
        className={cn(base, "object-cover")}
      />
    );
  }
  return (
    <div
      aria-label={name}
      role="img"
      className={cn(base, "flex items-center justify-center bg-[#F3EBDD] text-[#1F3D2B] font-semibold text-lg border border-[#1F3D2B]/10")}
    >
      {initialsOf(name)}
    </div>
  );
};

export default VendorThumb;
