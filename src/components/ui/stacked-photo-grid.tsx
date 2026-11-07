import { useState } from "react";
import { Grid3X3, ChevronLeft, ChevronRight, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { FadePhoto } from "@/components/media/FadePhoto";
import { ReferencePhoto, type ReferenceCrop } from "@/components/destination/ReferencePhoto";
import { cn } from "@/lib/utils";

interface StackedPhotoGridProps {
  photos: string[];
  alt?: string;
  className?: string;
  fallbackCrop?: ReferenceCrop;
}
const StackedPhotoGrid = ({ photos, alt = "Photo", className, fallbackCrop }: StackedPhotoGridProps) => {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const sources = photos.filter(Boolean);
  const count = sources.length || (fallbackCrop ? 1 : 0);
  if (!count) return null;
  const openViewer = (index: number) => { setActiveIndex(index); setViewerOpen(true); };
  const move = (step: number) => setActiveIndex(index => (index + step + count) % count);
  const photo = (index: number, full = false) => sources[index]
    ? full
      ? <img src={sources[index]} alt={`${alt} ${index + 1}`} className="detail-viewer-photo" />
      : <FadePhoto src={sources[index]} alt={`${alt} ${index + 1}`} frameClassName="detail-gallery-photo" loading={index ? "lazy" : "eager"} />
    : <ReferencePhoto crop={fallbackCrop} alt={alt} className={full ? "detail-viewer-crop" : "detail-gallery-photo"} />;
  return <>
    <div className={cn("detail-gallery", className)}>
      <div className={`detail-gallery-mosaic photos-${Math.min(count, 5)}`}>
        {Array.from({length: Math.min(count, 5)}, (_, index) => <button type="button" className="detail-gallery-tile" aria-label={`Open ${alt} photo ${index + 1}`} key={sources[index] || index} onClick={() => openViewer(index)}>{photo(index)}</button>)}
      </div>
      <button type="button" className="detail-gallery-show-all" onClick={() => openViewer(0)}><Grid3X3 size={15} />{count > 1 ? "Show all photos" : "View photo"}</button>
    </div>
    <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
      <DialogContent aria-describedby={undefined} className="detail-photo-dialog" onKeyDown={event => { if(event.key === "ArrowRight") move(1); if(event.key === "ArrowLeft") move(-1); }}>
        <DialogTitle className="sr-only">{alt} photo gallery</DialogTitle>
        <button type="button" className="detail-viewer-close" aria-label="Close photo gallery" onClick={() => setViewerOpen(false)}><X size={23} /></button>
        <span className="detail-viewer-count" aria-live="polite">{Math.min(activeIndex + 1, count)} / {count}</span>
        {count > 1 && <button type="button" className="detail-viewer-prev" aria-label="Previous photo" onClick={() => move(-1)}><ChevronLeft size={28} /></button>}
        {photo(Math.min(activeIndex, count - 1), true)}
        {count > 1 && <button type="button" className="detail-viewer-next" aria-label="Next photo" onClick={() => move(1)}><ChevronRight size={28} /></button>}
      </DialogContent>
    </Dialog>
  </>;
};
export default StackedPhotoGrid;
