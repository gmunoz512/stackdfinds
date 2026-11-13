import { cn } from "@/lib/utils";

export function initialsOf(name: string): string {
  const words = name.split(/\s+/).filter((word) => /^[A-Za-z0-9]/.test(word));
  if (words.length >= 2) return `${words[0][0]}${words[1][0]}`.toUpperCase();
  const letters = (words[0] || name).replace(/[^A-Za-z0-9]/g, "");
  return (letters.slice(0, 2) || "S").toUpperCase();
}

/** Cream placeholder used when a vendor has no photo. Letters only, never an emoji. */
export function InitialsTile({ name, className }: { name: string; className?: string }) {
  return (
    <div role="img" aria-label={name} className={cn("initials-tile", className)}>
      {initialsOf(name)}
    </div>
  );
}
