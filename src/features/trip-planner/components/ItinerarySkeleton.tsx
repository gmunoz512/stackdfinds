import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

const SKELETON_DAYS = 3;
const SKELETON_ITEMS_PER_DAY = 4;

const stepMessages = [
  "Planning your days...",
  "Adding activities...",
  "Calculating travel times...",
  "Finalizing details...",
];

interface ItinerarySkeletonProps {
  currentStep?: number;
}

export function ItinerarySkeleton({ currentStep = 0 }: ItinerarySkeletonProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header Skeleton */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3 p-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 min-w-0 space-y-2">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>

        {/* Day Selector Skeleton */}
        <div className="px-4 pb-3">
          <div className="flex gap-2 overflow-hidden">
            {Array.from({ length: SKELETON_DAYS }).map((_, i) => (
              <Skeleton 
                key={i} 
                className={`flex-shrink-0 w-16 h-16 rounded-xl ${i === 0 ? "bg-primary/20" : ""}`} 
              />
            ))}
          </div>
        </div>
      </header>

      {/* Progress Indicator */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 py-3 bg-primary/5 border-b border-border"
      >
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="flex gap-1">
            {stepMessages.map((_, i) => (
              <motion.div
                key={i}
                className={`w-2 h-2 rounded-full ${i <= currentStep ? "bg-primary" : "bg-muted"}`}
                animate={i === currentStep ? { scale: [1, 1.2, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1 }}
              />
            ))}
          </div>
          <motion.span 
            key={currentStep}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-primary font-medium"
          >
            {stepMessages[currentStep % stepMessages.length]}
          </motion.span>
        </div>
      </motion.div>

      {/* Day Schedule Skeleton */}
      <main className="flex-1 p-4 pb-24 overflow-y-auto">
        <div className="space-y-4">
          {/* Day Header */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-32" />
          </div>
          <Skeleton className="h-3 w-28" />

          {/* Timeline Items */}
          <div className="pt-2 space-y-4">
            {Array.from({ length: SKELETON_ITEMS_PER_DAY }).map((_, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.15 }}
                className="flex gap-4"
              >
                {/* Timeline */}
                <div className="flex flex-col items-center">
                  <Skeleton className="w-14 h-6 rounded-md" />
                  <Skeleton className="mt-3 w-10 h-10 rounded-full" />
                  {index < SKELETON_ITEMS_PER_DAY - 1 && (
                    <div className="w-px flex-1 min-h-[24px] bg-border mt-3" />
                  )}
                </div>

                {/* Card */}
                <Card className="flex-1 p-4 mb-4 border-border/60">
                  <Skeleton className="h-3 w-16 mb-2" />
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-4 w-2/3 mb-3" />
                  <Skeleton className="h-3 w-32" />
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer Skeleton */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 safe-area-bottom">
        <div className="flex gap-2 max-w-lg mx-auto">
          <Skeleton className="flex-1 h-10 rounded-md" />
          <Skeleton className="flex-1 h-10 rounded-md" />
          <Skeleton className="flex-1 h-10 rounded-md" />
        </div>
      </footer>
    </div>
  );
}
