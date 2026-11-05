import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Heart,
  ImageOff,
  Search,
  Utensils,
  Waves,
} from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import { DestinationHero } from "@/components/destination/DestinationShell";
import { GoogleRating } from "@/components/GoogleRating";
import { resolveGoogleRating } from "@/lib/googleRating";
import type { Restaurant } from "@/data/mockRestaurants";
import type { SupportedCity } from "@/lib/supportedCities";
import type { UserRole, Vendor } from "@/types";

interface GuestVendor {
  id: string;
  name: string;
  category: string;
  description: string | null;
  photos: string[] | null;
  price_per_person: number | null;
  google_rating: number | null;
}

interface GuestExploreTabProps {
  role: UserRole | null;
  isAuthenticated: boolean;
  profileRoute: string;
  handleSignOut: () => void;
  cityDropdownOpen: boolean;
  setCityDropdownOpen: (open: boolean) => void;
  destination: string;
  setDestination: (destination: string) => void;
  supportedCities: SupportedCity[];
  calendarOpen: boolean;
  setCalendarOpen: (open: boolean) => void;
  selectedDate: Date | undefined;
  setSelectedDate: (date: Date | undefined) => void;
  navigate: (path: string) => void;
  myBusinesses: Vendor[];
  isLoadingVendors: boolean;
  catalogError: boolean;
  onRetryCatalog: () => void;
  vendorRestaurants: GuestVendor[];
  curatedRestaurants: Restaurant[];
  googlePhotos: Record<string, string>;
  vendorFavorites: string[];
  toggleVendorFavorite: (id: string, event: React.MouseEvent) => void;
  vendorExperiences: GuestVendor[];
  favorites: number[];
}

function ListingPhoto({
  src,
  name,
  illustrative = false,
}: {
  src?: string;
  name: string;
  illustrative?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div className="destination-photo">
      {src && !failed ? (
        <img
          src={src}
          alt={name}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground text-xs">
          <ImageOff size={24} />
          <span>Photo coming soon</span>
        </div>
      )}
      {illustrative && !failed && (
        <span className="photo-note">Illustrative photo</span>
      )}
    </div>
  );
}
export function GuestExploreTab(props: GuestExploreTabProps) {
  const [query, setQuery] = useState("");
  const matches = (name: string, category: string) =>
    `${name} ${category}`.toLowerCase().includes(query.toLowerCase());
  const restaurants = props.vendorRestaurants.filter((v) =>
    matches(v.name, v.category),
  );
  const curated = props.curatedRestaurants.filter(
    (r) =>
      matches(r.name, r.cuisine) &&
      !props.vendorRestaurants.some(
        (v) => v.name.toLowerCase() === r.name.toLowerCase(),
      ),
  );
  const experiences = props.vendorExperiences.filter((v) =>
    matches(v.name, v.category),
  );
  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    document.getElementById("local-eats")?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  };
  const vendorCard = (vendor: GuestVendor) => (
    <article className="destination-card" key={vendor.id}>
      <Link
        to={
          vendor.id.startsWith("preview-")
            ? `/experiences?category=${encodeURIComponent(vendor.category)}`
            : `/vendor/${vendor.id}`
        }
      >
        <ListingPhoto src={vendor.photos?.[0]} name={vendor.name} />
        <h3>{vendor.name}</h3>
      </Link>
      {!vendor.id.startsWith("preview-") && (
        <button
          className="save-place"
          aria-label={`${props.vendorFavorites.includes(vendor.id) ? "Remove" : "Save"} ${vendor.name}`}
          aria-pressed={props.vendorFavorites.includes(vendor.id)}
          onClick={(event) => props.toggleVendorFavorite(vendor.id, event)}
        >
          <Heart
            size={17}
            fill={
              props.vendorFavorites.includes(vendor.id)
                ? "currentColor"
                : "none"
            }
          />
        </button>
      )}
      <p>{vendor.category} · Tulum</p>
      <div className="text-xs mt-2">
        {vendor.id.startsWith("preview-") ? (
          <span className="text-muted-foreground">Illustrative preview</span>
        ) : (
          <GoogleRating
            value={resolveGoogleRating({ googleRating: vendor.google_rating })}
            emptyLabel="No reviews yet"
          />
        )}
      </div>
    </article>
  );
  return (
    <TabsContent value="explore" className="mt-0">
      <DestinationHero>
        <form
          className="destination-search"
          role="search"
          onSubmit={handleSearch}
        >
          <Search size={16} />
          <input
            aria-label="Search Tulum eats and experiences"
            placeholder="Search eats and experiences"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button aria-label="Search">
            <ArrowRight size={17} />
          </button>
        </form>
      </DestinationHero>
      <nav className="catalog-jump" aria-label="Explore Tulum categories">
        <a href="#local-eats">
          <Utensils size={18} />
          <div>
            <strong>Local Favorite Eats</strong>
            <span>Restaurants, cafés & local tables</span>
          </div>
          <ArrowRight size={17} />
        </a>
        <a href="#local-experiences">
          <Waves size={19} />
          <div>
            <strong>Local Favorite Experiences</strong>
            <span>Water, jungle & a little adventure</span>
          </div>
          <ArrowRight size={17} />
        </a>
      </nav>
      <section
        id="local-eats"
        aria-labelledby="eats-heading"
        className="destination-section eats-section"
      >
        <div className="section-title">
          <div>
            <span className="section-kicker">A TASTE OF TULUM</span>
            <h2 id="eats-heading">Local Favorite Eats</h2>
          </div>
          <Link to="/restaurants">
            See all eats <ArrowRight size={16} />
          </Link>
        </div>
        <div className="destination-grid">
          {restaurants.slice(0, 3).map(vendorCard)}
          {curated.slice(0, Math.max(0, 6 - restaurants.length)).map((r) => (
            <article className="destination-card" key={r.id}>
              <Link to={`/restaurant/${r.id}`}>
                <ListingPhoto
                  src={props.googlePhotos[r.id] || r.photos[0]}
                  name={r.name}
                  illustrative={!props.googlePhotos[r.id]}
                />
                <h3>{r.name}</h3>
              </Link>
              <p>
                {r.cuisine} · {r.neighborhood || r.city}
              </p>
            </article>
          ))}
        </div>
        {!restaurants.length && !curated.length && (
          <p className="catalog-empty">
            No eats match your search. Try another name or cuisine.
          </p>
        )}
      </section>
      <section
        id="local-experiences"
        aria-labelledby="experiences-heading"
        className="destination-section experiences-section"
      >
        <div className="section-title">
          <div>
            <span className="section-kicker">GO A LITTLE FURTHER</span>
            <h2 id="experiences-heading">Local Favorite Experiences</h2>
          </div>
          <Link to="/experiences">
            See all experiences <ArrowRight size={16} />
          </Link>
        </div>
        {props.isLoadingVendors ? (
          <div className="destination-grid" aria-label="Loading experiences">
            {[1, 2, 3].map((i) => (
              <div key={i} className="destination-photo animate-pulse" />
            ))}
          </div>
        ) : props.catalogError ? (
          <div className="catalog-empty" role="status">
            We couldn’t load experiences right now.{" "}
            <button className="underline" onClick={props.onRetryCatalog}>
              Try again
            </button>
          </div>
        ) : experiences.length ? (
          <div className="destination-grid">
            {experiences.slice(0, 6).map(vendorCard)}
          </div>
        ) : (
          <div className="catalog-empty">
            {query ? (
              "No experiences match your search. Try something else."
            ) : (
              <>
                More local experiences are on their way.{" "}
                <Link to="/experiences">Explore the catalog →</Link>
              </>
            )}
          </div>
        )}
      </section>
      {props.myBusinesses.length > 0 && (
        <section className="destination-section">
          <div className="section-title">
            <h2>Your businesses</h2>
            <Link to={props.profileRoute}>
              Manage <ArrowRight size={16} />
            </Link>
          </div>
          {props.myBusinesses.map((b) => (
            <p key={b.id}>{b.name}</p>
          ))}
        </section>
      )}
    </TabsContent>
  );
}
