import { RatingLine } from "@/components/destination/RatingLine";
import { VendorPhoto } from "@/components/destination/VendorPhoto";
import { WishlistHeart } from "@/components/destination/WishlistHeart";
import { findAirbnbVendor } from "@/data/airbnbCatalog";
import { AddToHostPage } from "@/components/host/AddToHostPage";
import { PRICE_ON_REQUEST, guestPriceLine } from "@/lib/experiencePrice";
import { isValidHostId } from "@/lib/guestBooking";
import { withHostRef } from "@/lib/hostGuide";
import { useEffect } from "react";
import { Link, useLocation, useParams, useSearchParams } from "react-router-dom";

export default function ExperienceBusiness() {
  const { username } = useParams();
  const { hash } = useLocation();
  const [params] = useSearchParams();
  const host = params.get("host");
  const vendor = findAirbnbVendor(username);

  useEffect(() => {
    const id = hash.replace("#", "");
    if (!id) return;
    document.getElementById(id)?.scrollIntoView({ block: "start" });
  }, [hash, username]);

  if (!vendor) {
    return (
      <div className="reference-catalog experiences-light">
        <div className="reference-empty">
          <p>That business isn’t in the catalog.</p>
          <Link to="/experiences">All experiences</Link>
        </div>
      </div>
    );
  }

  return (
    <article className="reference-detail experiences-light">
      <p className="listing-category">
        <Link to="/experiences">All experiences</Link>
      </p>
      <VendorPhoto src={vendor.photo} name={vendor.businessName} frameClassName="vendor-hero" loading="eager" />
      <h1>{vendor.businessName}</h1>
      {vendor.personName ? <p className="listing-business">{vendor.personName}</p> : null}
      <p className="catalog-count">
        {vendor.experiences.length} {vendor.experiences.length === 1 ? "experience" : "experiences"}
      </p>
      <ul className="experience-list">
        {vendor.experiences.map((experience) => {
          const targeted = hash === `#${experience.id}`;
          return (
            <li
              id={experience.id}
              key={experience.id}
              className={targeted ? "experience-block is-targeted" : "experience-block"}
            >
              <div className="experience-heading">
                <div>
                  {experience.isTop ? <p className="listing-category">Top experience</p> : null}
                  <h2>
                    <Link to={`/experiences/${vendor.username}/${experience.id}`}>{experience.title}</Link>
                  </h2>
                  <p className="listing-category">{experience.category}</p>
                  <RatingLine rating={experience.rating} reviewCount={experience.reviewCount} />
                  <p className="listing-price">
                    {guestPriceLine(experience.price) === PRICE_ON_REQUEST ? (
                      PRICE_ON_REQUEST
                    ) : (
                      <>
                        {guestPriceLine(experience.price)}
                        <span>/person</span>
                      </>
                    )}
                  </p>
                  <Link
                    className="experience-book"
                    to={
                      host && isValidHostId(host)
                        ? withHostRef(`/experiences/${vendor.username}/${experience.id}#book`, host)
                        : `/experiences/${vendor.username}/${experience.id}#book`
                    }
                  >
                    Request to book
                  </Link>
                  <AddToHostPage itemType="experience" itemRef={experience.id} vendorUsername={vendor.username} />
                </div>
                <WishlistHeart
                  item={{
                    id: experience.id,
                    kind: "experience",
                    name: experience.title,
                    category: experience.category,
                    photo: experience.photos[0],
                    url: `/experiences/${vendor.username}/${experience.id}`,
                    price: experience.price?.currency === "USD" ? experience.price.amount : null,
                    priceLabel: guestPriceLine(experience.price),
                  }}
                />
              </div>
              {experience.photos.length ? (
                <div className="experience-photos">
                  {experience.photos.map((src, index) => (
                    <VendorPhoto
                      key={src}
                      src={src}
                      name={`${experience.title} photo ${index + 1}`}
                      frameClassName={index === 0 ? "experience-main-photo" : "experience-thumb"}
                      loading={index === 0 ? "eager" : "lazy"}
                    />
                  ))}
                </div>
              ) : (
                <VendorPhoto name={vendor.businessName} frameClassName="experience-main-photo" />
              )}
            </li>
          );
        })}
      </ul>
    </article>
  );
}
