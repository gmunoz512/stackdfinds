import { useState } from 'react';
import { Grid3X3, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface StackedPhotoGridProps {
  photos: string[];
  alt?: string;
  className?: string;
}

const StackedPhotoGrid = ({ photos, alt = 'Photo', className }: StackedPhotoGridProps) => {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  if (photos.length === 0) return null;

  const openViewer = (index: number) => {
    setActiveIndex(index);
    setViewerOpen(true);
  };

  const goNext = () => setActiveIndex((i) => (i + 1) % photos.length);
  const goPrev = () => setActiveIndex((i) => (i - 1 + photos.length) % photos.length);

  return (
    <>
      <div className={cn('relative', className)}>
        {photos.length === 1 && (
          <button onClick={() => openViewer(0)} className="w-full block">
            <img
              src={photos[0]}
              alt={alt}
              className="w-full h-[280px] object-cover rounded-xl"
            />
          </button>
        )}

        {photos.length === 2 && (
          <div className="grid grid-cols-2 gap-[2px] rounded-xl overflow-hidden">
            {photos.map((photo, i) => (
              <button key={i} onClick={() => openViewer(i)} className="block">
                <img
                  src={photo}
                  alt={`${alt} ${i + 1}`}
                  className="w-full h-[200px] object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {photos.length >= 3 && (
          <div className="grid grid-cols-2 gap-[2px] rounded-xl overflow-hidden">
            {/* Top row: two photos side by side */}
            <button onClick={() => openViewer(0)} className="block">
              <img
                src={photos[0]}
                alt={`${alt} 1`}
                className="w-full h-[160px] object-cover"
              />
            </button>
            <button onClick={() => openViewer(1)} className="block">
              <img
                src={photos[1]}
                alt={`${alt} 2`}
                className="w-full h-[160px] object-cover"
              />
            </button>
            {/* Bottom row: one wide photo */}
            <button onClick={() => openViewer(2)} className="col-span-2 block">
              <img
                src={photos[2]}
                alt={`${alt} 3`}
                className="w-full h-[120px] object-cover"
              />
            </button>
          </div>
        )}

        {/* Show all photos overlay button */}
        {photos.length > 1 && (
          <button
            onClick={() => openViewer(0)}
            className="absolute bottom-3 right-3 bg-card/90 backdrop-blur-sm text-foreground text-xs font-medium px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md border border-border hover:bg-card transition-colors"
          >
            <Grid3X3 className="h-3.5 w-3.5" />
            Show all photos
          </button>
        )}
      </div>

      {/* Full-screen photo viewer */}
      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-full h-full p-0 border-none bg-ink/95 [&>button]:hidden">
          <div className="relative flex items-center justify-center w-full h-full">
            {/* Close button */}
            <button
              onClick={() => setViewerOpen(false)}
              className="absolute top-4 left-4 z-50 p-2 rounded-full bg-paper/10 hover:bg-paper/20 text-paper transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Photo counter */}
            <div className="absolute top-4 right-4 z-50 text-paper/70 text-sm font-medium">
              {activeIndex + 1} / {photos.length}
            </div>

            {/* Previous button */}
            {photos.length > 1 && (
              <button
                onClick={goPrev}
                className="absolute left-3 z-50 p-2 rounded-full bg-paper/10 hover:bg-paper/20 text-paper transition-colors"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            {/* Active photo */}
            <img
              src={photos[activeIndex]}
              alt={`${alt} ${activeIndex + 1}`}
              className="max-w-full max-h-[85vh] object-contain select-none"
            />

            {/* Next button */}
            {photos.length > 1 && (
              <button
                onClick={goNext}
                className="absolute right-3 z-50 p-2 rounded-full bg-paper/10 hover:bg-paper/20 text-paper transition-colors"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}

            {/* Dot indicators */}
            {photos.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
                {photos.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveIndex(i)}
                    className={cn(
                      'w-2 h-2 rounded-full transition-all',
                      i === activeIndex ? 'bg-paper w-4' : 'bg-paper/40'
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default StackedPhotoGrid;
