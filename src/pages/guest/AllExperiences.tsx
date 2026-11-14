import { WishlistHeart } from "@/components/destination/WishlistHeart";
import { VendorPhoto } from "@/components/destination/VendorPhoto";
import { RatingLine } from "@/components/destination/RatingLine";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Search } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { airbnbVendors } from "@/data/airbnbCatalog";
import { experienceCatalog, type CatalogCard } from "@/data/experienceCatalog";
import { CATALOG_FILTERS, matchesCategory } from "@/lib/experienceCategory";
import { AddToHostPage } from "@/components/host/AddToHostPage";
import { PRICE_ON_REQUEST } from "@/lib/experiencePrice";
import { formatUsd } from "@/lib/guestBooking";

const PAGE = 24;

export default function AllExperiences() {
  const [params] = useSearchParams();
  const [filter, setFilter] = useState(params.get("category") || "All");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<"experiences" | "businesses">("experiences");
  const [limit, setLimit] = useState(PAGE);
  const [extra, setExtra] = useState<CatalogCard[]>([]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancel = false;
    void (async () => {
      const { data, error } = await supabase
        .from("vendor_profiles_public")
        .select("id,name,category,photos,price_per_person,google_rating")
        .eq("is_published", true)
        .eq("listing_type", "experience");
      if (cancel || error || !data) return;
      const known = new Set(experienceCatalog.map((item) => item.id));
      setExtra(
        data
          .filter((row) => !known.has(row.id))
          .map((row) => ({
            id: row.id,
            name: row.name,
            businessName: null,
            category: row.category,
            photos: row.photos,
            price: row.price_per_person,
            priceLabel: row.price_per_person != null ? formatUsd(row.price_per_person) : PRICE_ON_REQUEST,
            rating: row.google_rating,
            reviewCount: null,
            username: null,
            href: `/vendor/${row.id}`,
          })),
      );
    })();
    return () => {
      cancel = true;
    };
  }, []);

  useEffect(() => {
    setLimit(PAGE);
  }, [query, filter, view]);

  const items = useMemo(() => [...experienceCatalog, ...extra], [extra]);
  const chips = (CATALOG_FILTERS as readonly string[]).includes(filter)
    ? CATALOG_FILTERS
    : [filter, ...CATALOG_FILTERS];
  const needle = query.trim().toLowerCase();
  const experiences = items.filter((item) => {
    const haystack = `${item.name} ${item.businessName ?? ""} ${item.category}`.toLowerCase();
    return haystack.includes(needle) && matchesCategory(filter, item.category);
  });
  const businesses = airbnbVendors.filter((vendor) => {
    const titles = vendor.experiences.map((item) => `${item.title} ${item.category}`).join(" ");
    const haystack = `${vendor.businessName} ${vendor.personName ?? ""} ${titles}`.toLowerCase();
    const categoryOk =
      filter === "All" ||
      filter === "all" ||
      vendor.experiences.some((item) => matchesCategory(filter, item.category));
    return haystack.includes(needle) && categoryOk;
  });
  const shownExperiences = experiences.slice(0, limit);
  const shownBusinesses = businesses.slice(0, limit);
  const remaining =
    view === "experiences" ? experiences.length - shownExperiences.length : businesses.length - shownBusinesses.length;

  return (
    <div className="reference-catalog experiences-light">
      <div className="reference-page-heading">
        <h1>
          Local Favorite
          <br />
          Experiences
        </h1>
        <p>Find your kind of Tulum.</p>
      </div>
      <div className="reference-search">
        <Search size={18} />
        <input
          aria-label="Search experiences"
          placeholder="Search experiences"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      <div className="reference-filters" aria-label="Catalog view">
        <button
          type="button"
          aria-pressed={view === "experiences"}
          className={view === "experiences" ? "selected" : ""}
          onClick={() => setView("experiences")}
        >
          Experiences
        </button>
        <button
          type="button"
          aria-pressed={view === "businesses"}
          className={view === "businesses" ? "selected" : ""}
          onClick={() => setView("businesses")}
        >
          Businesses
        </button>
      </div>
      <div className="reference-filters catalog-filters" aria-label="Experience categories">
        {chips.map((label) => (
          <button
            type="button"
            aria-pressed={filter === label}
            className={filter === label ? "selected" : ""}
            key={label}
            onClick={() => setFilter(label)}
          >
            {label}
          </button>
        ))}
      </div>
      <p className="catalog-count">
        {view === "experiences"
          ? `${experiences.length} ${experiences.length === 1 ? "experience" : "experiences"}`
          : `${businesses.length} ${businesses.length === 1 ? "business" : "businesses"}`}
      </p>
      {view === "experiences" ? (
        <div className="reference-listing-grid">
          {shownExperiences.map((item, index) => (
            <ExperienceCard item={item} key={item.id} eager={index < 4} />
          ))}
        </div>
      ) : (
        <ol className="business-tile-grid">
          {shownBusinesses.map((vendor, index) => (
            <li className="guide-photo-tile relative overflow-hidden rounded-[18px] bg-[#f3ebdd]" key={vendor.username}>
              <Link to={`/experiences/${vendor.username}`} className="guide-photo-link relative block aspect-[3/4]">
                <VendorPhoto
                  src={vendor.photo}
                  name={vendor.businessName}
                  frameClassName="h-full w-full"
                  loading={index < 4 ? "eager" : "lazy"}
                />
                <div className="business-tile-copy">
                  <p className="guide-tile-title">{vendor.businessName}</p>
                  <p className="business-tile-meta">
                    {vendor.experiences.length}{" "}
                    {vendor.experiences.length === 1 ? "experience" : "experiences"}
                  </p>
                  <RatingLine rating={vendor.rating} reviewCount={vendor.reviewCount} />
                </div>
              </Link>
            </li>
          ))}
        </ol>
      )}
      {remaining > 0 && (
        <button type="button" className="catalog-more" onClick={() => setLimit((count) => count + PAGE)}>
          Show more ({remaining} left)
        </button>
      )}
      {view === "experiences" && !experiences.length && (
        <div className="reference-empty">
          <p>No experiences match yet. Try another category.</p>
        </div>
      )}
      {view === "businesses" && !businesses.length && (
        <div className="reference-empty">
          <p>No businesses match yet. Try another name.</p>
        </div>
      )}
    </div>
  );
}

function ExperienceCard({ item, eager }: { item: CatalogCard; eager: boolean }) {
  const photoName = item.businessName || item.name;
  return (
    <article className="reference-listing">
      <Link to={item.href}>
        <VendorPhoto
          src={item.photos?.[0]}
          name={photoName}
          frameClassName="reference-photo"
          loading={eager ? "eager" : "lazy"}
        />
        <div className="listing-copy">
          <h2>{item.name}</h2>
          {item.businessName && item.businessName !== item.name ? (
            <p className="listing-business">{item.businessName}</p>
          ) : null}
          <p className="listing-category">{item.category}</p>
          <RatingLine rating={item.rating} reviewCount={item.reviewCount} />
          <p className="listing-price">
            {item.priceLabel === PRICE_ON_REQUEST ? (
              PRICE_ON_REQUEST
            ) : (
              <>
                {item.priceLabel}
                <span>/person</span>
              </>
            )}
          </p>
        </div>
      </Link>
      {item.username ? <AddToHostPage itemType="experience" itemRef={item.id} vendorUsername={item.username} /> : null}
      <WishlistHeart
        item={{
          id: item.id,
          kind: "experience",
          name: item.name,
          category: item.category,
          photo: item.photos?.[0],
          crop: item.referencePhoto,
          url: item.href,
          price: item.price,
          priceLabel: item.priceLabel,
        }}
      />
    </article>
  );
}
