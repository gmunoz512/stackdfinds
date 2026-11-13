import PriceComparison from "@/components/PriceComparison";
import { RatingLine } from "@/components/destination/RatingLine";
import { VendorPhoto } from "@/components/destination/VendorPhoto";
import { WishlistHeart } from "@/components/destination/WishlistHeart";
import StackedPhotoGrid from "@/components/ui/stacked-photo-grid";
import { findAirbnbExperience, findAirbnbVendor } from "@/data/airbnbCatalog";
import { useLocalWishlist } from "@/hooks/useLocalWishlist";
import { toast } from "@/hooks/use-toast";
import { groupSizeMax, locationLine } from "@/lib/airbnbListingFacts";
import { PRICE_ON_REQUEST, guestPriceLine, listingPriceBreakdown } from "@/lib/experiencePrice";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";

export default function ExperienceListing() {
  const { username, experienceId } = useParams();
  const experience = findAirbnbExperience(username, experienceId);
  const vendor = findAirbnbVendor(experience?.username);
  const { has, toggle } = useLocalWishlist();
  const [guests, setGuests] = useState(1);

  if (!experience) {
    return (
      <div className="reference-catalog experiences-light">
        <div className="reference-empty">
          <p>That experience isn’t in the catalog.</p>
          <Link to={username ? `/experiences/${username}` : "/experiences"}>
            {username ? "Back to the business" : "All experiences"}
          </Link>
        </div>
      </div>
    );
  }

  const href = `/experiences/${experience.username}/${experience.id}`;
  const priceLine = guestPriceLine(experience.price);
  const place = locationLine(experience.meetingArea, experience.city);
  const maxGuests = groupSizeMax(experience.groupSize) ?? 10;
  const party = Math.min(maxGuests, Math.max(1, guests));
  const summary = experience.price ? listingPriceBreakdown(experience.price, party) : null;
  const usdPrice = experience.price?.currency === "USD" ? experience.price.amount : null;
  const rows = [
    place ? ["Location", place] : null,
    experience.duration ? ["Duration", experience.duration] : null,
    experience.groupSize ? ["Group size", experience.groupSize] : null,
    experience.languages.length ? ["Languages", experience.languages.join(", ")] : null,
    experience.price ? ["Listed price", `${priceLine} per person`] : null,
  ].filter((row): row is [string, string] => row !== null);
  const wishlistItem = {
    id: experience.id,
    kind: "experience" as const,
    name: experience.title,
    category: experience.category,
    photo: experience.photos[0],
    url: href,
    price: usdPrice,
    priceLabel: priceLine,
  };

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: experience.title, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied" });
    } catch {
      toast({ title: "Couldn’t copy the link", variant: "destructive" });
    }
  };

  return (
    <article className="reference-detail experiences-light">
      <p className="detail-back">
        <Link to="/experiences">All experiences</Link>
      </p>
      <div className="detail-photo-wrap">
        {experience.photos.length ? (
          <StackedPhotoGrid photos={experience.photos} alt={experience.title} />
        ) : (
          <VendorPhoto name={experience.businessName} frameClassName="reference-photo" loading="eager" />
        )}
        <WishlistHeart item={wishlistItem} />
      </div>
      <p className="listing-category">
        {experience.category}
        {experience.city ? ` · ${experience.city}` : ""}
      </p>
      <h1>{experience.title}</h1>
      <RatingLine rating={experience.rating} reviewCount={experience.reviewCount} />
      <p className="listing-price">
        {priceLine === PRICE_ON_REQUEST ? (
          PRICE_ON_REQUEST
        ) : (
          <>
            {priceLine}
            <span>/person</span>
          </>
        )}
      </p>
      {rows.length ? (
        <section className="home-category detail-essentials" aria-label="Experience essentials">
          <dl>
            {rows.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}
      {experience.description ? (
        <section className="detail-description">
          <h2>About this experience</h2>
          <p>{experience.description}</p>
        </section>
      ) : null}
      {experience.offered.length ? (
        <section className="home-category detail-inclusions">
          <h2>What’s included</h2>
          <ul className="detail-offered">
            {experience.offered.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
      ) : null}
      {summary ? (
        <section className="home-category detail-essentials" aria-label="Price summary">
          <h2>Price summary</h2>
          <dl>
            <div>
              <dt>Guests</dt>
              <dd>
                <span className="detail-guests">
                  <button
                    type="button"
                    aria-label="Fewer guests"
                    onClick={() => setGuests((count) => Math.max(1, count - 1))}
                    disabled={party <= 1}
                  >
                    −
                  </button>
                  <span>{summary.guests}</span>
                  <button
                    type="button"
                    aria-label="More guests"
                    onClick={() => setGuests((count) => Math.min(maxGuests, count + 1))}
                    disabled={party >= maxGuests}
                  >
                    +
                  </button>
                </span>
              </dd>
            </div>
            <div>
              <dt>Subtotal</dt>
              <dd>{summary.subtotal}</dd>
            </div>
            <div>
              <dt>Service fees</dt>
              <dd>{summary.fees}</dd>
            </div>
            {summary.minimum ? (
              <div>
                <dt>Minimum to book</dt>
                <dd>{summary.minimum}</dd>
              </div>
            ) : null}
            <div className="detail-total">
              <dt>Total</dt>
              <dd>{summary.total}</dd>
            </div>
          </dl>
        </section>
      ) : null}
      {usdPrice != null ? (
        <section className="experience-price-comparison" aria-label="Experience price comparison">
          <h2>How does the price compare?</h2>
          <PriceComparison
            category={experience.category}
            experienceName={experience.title}
            currentPrice={usdPrice}
            duration={experience.duration ?? undefined}
          />
        </section>
      ) : null}
      <section className="detail-host-block" aria-label="Business">
        <h2>Business</h2>
        <Link className="detail-host" to={`/experiences/${experience.username}`}>
          <VendorPhoto
            src={vendor?.photo ?? experience.photos[0]}
            name={experience.businessName}
            frameClassName="detail-host-photo"
          />
          <span>
            <h3>{experience.businessName}</h3>
            {experience.personName ? <p className="listing-business">{experience.personName}</p> : null}
          </span>
        </Link>
      </section>
      <Link
        className="build-plan-button"
        to={`/trip-planner?include=experience:${experience.id}`}
        onClick={() => {
          if (!has("experience", experience.id)) toggle(wishlistItem);
        }}
      >
        Plan with this experience
        <ArrowRight size={18} />
      </Link>
      <button type="button" className="catalog-more" onClick={() => void share()}>
        Share
      </button>
    </article>
  );
}
