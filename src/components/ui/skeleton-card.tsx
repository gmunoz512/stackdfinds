import { Skeleton } from "./skeleton";
import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  variant?: "experience" | "restaurant" | "booking" | "list" | "profile";
  className?: string;
}

export function SkeletonCard({ variant = "experience", className }: SkeletonCardProps) {
  if (variant === "experience") {
    return (
      <div className={cn("space-y-2", className)}>
        <Skeleton className="aspect-square rounded-xl" />
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3 w-1/2" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-8" />
            <Skeleton className="h-3 w-12" />
          </div>
          <Skeleton className="h-4 w-1/3" />
        </div>
      </div>
    );
  }

  if (variant === "restaurant") {
    return (
      <div className={cn("space-y-1.5", className)}>
        <Skeleton className="aspect-square rounded-lg" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-2 w-2/3" />
      </div>
    );
  }

  if (variant === "booking") {
    return (
      <div className={cn("rounded-lg border border-border bg-card p-4", className)}>
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <Skeleton className="h-5 w-2/5" />
            <Skeleton className="h-4 w-20" />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  if (variant === "list") {
    return (
      <div className={cn("rounded-lg border border-border bg-card p-4", className)}>
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-8 w-16 rounded-md" />
        </div>
      </div>
    );
  }

  if (variant === "profile") {
    return (
      <div className={cn("rounded-lg border border-border bg-card p-4", className)}>
        <div className="flex items-center gap-4">
          <Skeleton className="h-14 w-14 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export function SkeletonCardGrid({ 
  count = 6, 
  variant = "experience",
  columns = 2,
  className 
}: { 
  count?: number; 
  variant?: SkeletonCardProps["variant"];
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const gridClass = {
    2: "grid-cols-2",
    3: "grid-cols-3",
    4: "grid-cols-4",
  }[columns];

  return (
    <div className={cn(`grid ${gridClass} gap-4`, className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} variant={variant} />
      ))}
    </div>
  );
}

export function SkeletonCardList({ 
  count = 3, 
  variant = "booking",
  className 
}: { 
  count?: number; 
  variant?: SkeletonCardProps["variant"];
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} variant={variant} />
      ))}
    </div>
  );
}
