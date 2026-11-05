import PriceComparison from "@/components/PriceComparison";
import { WishlistHeart } from "@/components/destination/WishlistHeart";
import { useLocalWishlist } from "@/hooks/useLocalWishlist";
import { Link, useParams } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { previewExperiences } from "@/data/previewExperiences";
import StackedPhotoGrid from "@/components/ui/stacked-photo-grid";
export default function PreviewExperience() {
  const { id } = useParams();
  const { has, toggle } = useLocalWishlist();
  const item = previewExperiences.find((v) => v.id === id);
  if (!item)
    return (
      <div className="reference-empty">
        <p>Experience not found.</p>
        <Link to="/appview">Back to home</Link>
      </div>
    );
  return (
    <article className="reference-detail">
      <div className="detail-photo-wrap"><StackedPhotoGrid photos={item.photos} fallbackCrop={item.referencePhoto} alt={item.name} /><WishlistHeart item={{id:item.id,kind:"experience",name:item.name,category:item.category,crop:item.referencePhoto,url:`/preview-experience/${item.id}`,price:item.price_per_person}}/></div>
      <p className="listing-category">{item.category} · TULUM</p>
      <h1>{item.name}</h1>
      <p className="listing-price">${item.price_per_person}/person</p>
      <section className="home-category detail-essentials" aria-label="Experience essentials">
        <dl><div><dt>Location</dt><dd>Tulum, México</dd></div><div><dt>Duration</dt><dd>Confirm with the host</dd></div><div><dt>Listed price</dt><dd>${item.price_per_person} per person</dd></div></dl>
      </section>
      <section className="detail-description"><h2>About this experience</h2><p>{item.description}</p></section>
      <section className="home-category detail-inclusions"><h2>What’s included</h2><p>Inclusions, meeting point, and availability haven’t been confirmed for this preview. Check these details with the host before booking.</p></section>
      <section className="experience-price-comparison" aria-label="Experience price comparison"><h2>How does the price compare?</h2><PriceComparison category={item.category} experienceName={item.name} currentPrice={item.price_per_person}/></section>
      <p className="sample-note">
        Sample listing from your design reference. Availability and booking
        aren’t connected.
      </p>
      <Link className="build-plan-button" to={`/trip-planner?include=experience:${item.id}`} onClick={() => { if (!has("experience", item.id)) toggle({id:item.id,kind:"experience",name:item.name,category:item.category,crop:item.referencePhoto,url:`/preview-experience/${item.id}`,price:item.price_per_person}); }}>
        Plan with this experience
        <ArrowRight size={18} />
      </Link>
    </article>
  );
}
