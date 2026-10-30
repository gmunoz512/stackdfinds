import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Clock, Users, CheckCircle, Share, Heart } from "lucide-react";
import { GoogleRating } from "@/components/GoogleRating";
import { RefundPolicy } from "@/components/listing/RefundPolicy";
import { useRequireSignIn } from "@/hooks/useRequireSignIn";
import { useNavigate, useParams } from "react-router-dom";
import { experiences } from "@/data/mockData";
import { GuestGuideButton } from "@/components/GuestGuideButton";
import { VendorListButton } from "@/components/VendorListButton";
import StackedPhotoGrid from "@/components/ui/stacked-photo-grid";
import { toast } from "@/hooks/use-toast";

// Base images
import kayakingImg from "@/assets/experiences/kayaking.jpg";
import bikesImg from "@/assets/experiences/bikes.jpg";
import snorkelingImg from "@/assets/experiences/snorkeling.jpg";
import photographyImg from "@/assets/experiences/photography.jpg";
import spaImg from "@/assets/experiences/spa.jpg";
import diningImg from "@/assets/experiences/dining.jpg";
import atvImg from "@/assets/experiences/atv.jpg";
import boatImg from "@/assets/experiences/boat.jpg";
import ziplineImg from "@/assets/experiences/zipline.jpg";
import horsebackImg from "@/assets/experiences/horseback.jpg";
import scubaImg from "@/assets/experiences/scuba.jpg";
import hikingImg from "@/assets/experiences/hiking.jpg";
import parasailingImg from "@/assets/experiences/parasailing.jpg";
import yogaImg from "@/assets/experiences/yoga.jpg";
import fishingImg from "@/assets/experiences/fishing.jpg";
import cookingImg from "@/assets/experiences/cooking.jpg";
import balloonImg from "@/assets/experiences/balloon.jpg";
import wineImg from "@/assets/experiences/wine.jpg";

// Variant images
import kayaking2Img from "@/assets/experiences/kayaking-2.jpg";
import kayaking3Img from "@/assets/experiences/kayaking-3.jpg";
import snorkeling2Img from "@/assets/experiences/snorkeling-2.jpg";
import snorkeling3Img from "@/assets/experiences/snorkeling-3.jpg";
import scuba2Img from "@/assets/experiences/scuba-2.jpg";
import scuba3Img from "@/assets/experiences/scuba-3.jpg";
import hiking2Img from "@/assets/experiences/hiking-2.jpg";
import hiking3Img from "@/assets/experiences/hiking-3.jpg";
import balloon2Img from "@/assets/experiences/balloon-2.jpg";
import balloon3Img from "@/assets/experiences/balloon-3.jpg";
import parasailing2Img from "@/assets/experiences/parasailing-2.jpg";
import parasailing3Img from "@/assets/experiences/parasailing-3.jpg";

// Experience image map
const experienceImages: Record<number, string[]> = {
  1: [kayakingImg, kayaking2Img, kayaking3Img],
  2: [bikesImg, bikesImg, bikesImg],
  3: [snorkelingImg, snorkeling2Img, snorkeling3Img],
  4: [photographyImg, photographyImg, photographyImg],
  5: [spaImg, yogaImg, spaImg],
  6: [diningImg, wineImg, cookingImg],
  7: [atvImg, atvImg, atvImg],
  8: [boatImg, fishingImg, boatImg],
  9: [ziplineImg, ziplineImg, ziplineImg],
  10: [horsebackImg, horsebackImg, horsebackImg],
  11: [scubaImg, scuba2Img, scuba3Img],
  12: [hikingImg, hiking2Img, hiking3Img],
  13: [parasailingImg, parasailing2Img, parasailing3Img],
  14: [yogaImg, spaImg, yogaImg],
  15: [fishingImg, boatImg, fishingImg],
  16: [cookingImg, diningImg, cookingImg],
  17: [balloonImg, balloon2Img, balloon3Img],
  18: [wineImg, diningImg, wineImg],
};

const getPhotos = (id: number) => experienceImages[id] || [kayakingImg, kayaking2Img, kayaking3Img];

const ExperienceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);
  const { requireSignIn } = useRequireSignIn();
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  const experience = experiences.find(exp => exp.id === Number(id));
  useEffect(() => {
    if (!experience) return;
    const data = { "@context": "https://schema.org", "@type": "TouristAttraction", name: experience.name, description: experience.description, image: getPhotos(experience.id), offers: { "@type": "Offer", price: experience.price, priceCurrency: "USD", availability: "https://schema.org/InStock" } };
    const script = document.createElement("script"); script.type = "application/ld+json"; script.textContent = JSON.stringify(data); document.head.appendChild(script);
    return () => script.remove();
  }, [experience]);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/appview');
    }
  };

  const toggleFavorite = () => {
    if (!requireSignIn("save")) return;
    setIsFavorite(!isFavorite);
    toast({ title: isFavorite ? "Removed from favorites" : "Added to favorites", duration: 2000 });
  };

  const handleShare = async () => {
    if (navigator.share && experience) {
      try {
        await navigator.share({
          title: experience.name,
          text: `Check out ${experience.name}`,
          url: window.location.href,
        });
      } catch {
        navigator.clipboard.writeText(window.location.href);
        toast({ title: "Link copied to clipboard", duration: 2000 });
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copied to clipboard", duration: 2000 });
    }
  };
  
  if (!experience) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Experience not found</p>
          <Button variant="link" onClick={handleBack}>
            Back to Explore
          </Button>
        </div>
      </div>
    );
  }

  const photos = getPhotos(experience.id);

  return (
    <div className="min-h-screen bg-background pb-[100px]">
      <div className="max-w-[375px] md:max-w-3xl lg:max-w-5xl mx-auto">

        {/* Floating header bar */}
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm">
          <div className="px-4 py-3 flex items-center justify-between">
            <button aria-label="Go back"
              onClick={handleBack}
              className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-1">
              <button aria-label="Share this experience" onClick={handleShare} className="p-2 rounded-full hover:bg-muted transition-colors">
                <Share className="h-5 w-5" />
              </button>
              <button aria-label={isFavorite ? "Remove from saved" : "Save this experience"}
                onClick={toggleFavorite}
                className="p-2 rounded-full hover:bg-muted transition-colors"
              >
                <Heart className={`h-5 w-5 ${isFavorite ? 'fill-danger text-danger' : ''}`} />
              </button>
            </div>
          </div>
        </header>

        <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start">
        {/* Photo Grid */}
        <div className="px-4 lg:px-6 lg:pt-2">
          <StackedPhotoGrid photos={photos} alt={experience.name} />
        </div>

        {/* Content sections */}
        <div className="px-4 lg:px-6">

          {/* Section: Title + Rating */}
          <div className="py-6 space-y-2">
            <h1 className="text-2xl font-semibold leading-tight">{experience.name}</h1>
            <p className="text-[15px] text-muted-foreground">{experience.vendor}</p>

            <div className="pt-1 space-y-2">
              <GoogleRating value={null} className="text-[15px]" starClassName="h-4 w-4" />
              <p className="text-[15px] text-muted-foreground">No reviews yet.</p>
            </div>
          </div>

          <Separator />

          {/* Section: Quick Info */}
          <div className="py-6">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-[15px] font-medium">{experience.duration}</p>
                  <p className="text-[13px] text-muted-foreground">Duration</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-[15px] font-medium">Up to {experience.maxGuests}</p>
                  <p className="text-[13px] text-muted-foreground">Guests</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Section: About This Experience */}
          <div className="py-6 space-y-3">
            <h2 className="text-[22px] font-semibold">About this experience</h2>
            <div className="relative">
              <p className={`text-[15px] leading-relaxed text-foreground ${!descriptionExpanded ? 'line-clamp-4' : ''}`}>
                {experience.description}
              </p>
              {experience.description.length > 200 && (
                <button
                  onClick={() => setDescriptionExpanded(!descriptionExpanded)}
                  className="text-[15px] font-semibold underline underline-offset-4 mt-2 hover:text-foreground/80 transition-colors"
                >
                  {descriptionExpanded ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>
          </div>

          <Separator />

          {/* Section: What's Included */}
          <div className="py-6 space-y-4">
            <h2 className="text-[22px] font-semibold">What's included</h2>
            <ul className="space-y-3">
              {experience.included.map((item, index) => (
                <li key={index} className="flex items-start gap-3 text-[15px]">
                  <CheckCircle className="h-5 w-5 text-foreground flex-shrink-0 mt-0.5" />
                  <span className="text-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <Separator />
          <RefundPolicy />
          <Separator />

          {/* Host Vendor List Button */}
          <div className="py-6">
            <VendorListButton
              vendorId={String(experience.vendorId)}
              vendorName={experience.vendor}
            />
          </div>
        </div>
        </div>

        {/* Fixed Bottom CTA */}
        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4 shadow-[0_-2px_10px_rgba(0,0,0,0.06)] z-40">
          <div className="max-w-[375px] md:max-w-3xl lg:max-w-5xl mx-auto flex items-center justify-between gap-4">
            <div>
              <p className="text-[13px] text-muted-foreground">From</p>
              <p className="text-xl font-semibold">${experience.price}<span className="text-[14px] font-normal text-muted-foreground"> /person</span></p>
            </div>
            <Button 
              className="rounded-full px-8 bg-gradient-to-r from-brand to-hot hover:from-brand-strong hover:to-hot-strong text-paper font-semibold"
              size="lg"
              onClick={() => {
                if (!requireSignIn("book")) return;
                navigate(`/booking/${experience.id}`);
              }}
            >
              Book Now
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExperienceDetails;
