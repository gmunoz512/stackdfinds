import { WishlistHeart } from "@/components/destination/WishlistHeart";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Search } from "lucide-react";
import { mockRestaurants } from "@/data/mockRestaurants";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
interface VendorEat {
  id: string;
  name: string;
  category: string;
  photos: string[] | null;
  price_per_person: number | null;
}
export default function AllRestaurants() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("All");
  const [vendors, setVendors] = useState<VendorEat[]>([]);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    void (async () => {
      const { data } = await supabase
        .from("vendor_profiles_public")
        .select("id,name,category,photos,price_per_person")
        .eq("is_published", true)
        .eq("listing_type", "restaurant");
      if (data) setVendors(data);
    })();
  }, []);
  const curated = mockRestaurants
    .filter(
      (v) =>
        v.city.toLowerCase() === "tulum" &&
        !vendors.some((x) => x.name.toLowerCase() === v.name.toLowerCase()),
    )
    .map((v) => ({
      id: v.id,
      name: v.name,
      category: v.cuisine,
      photos: v.photos,
      area: v.neighborhood || v.city,
      rating: v.rating,
      url: `/restaurant/${v.id}`,
    }));
  const items = [
    ...vendors.map((v) => ({ ...v, area: "Tulum", rating: undefined as number | undefined, url: `/vendor/${v.id}` })),
    ...curated,
  ].filter(
    (v) =>
      `${v.name} ${v.category} ${v.area}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (filter === "All" || v.area.toLowerCase().includes(filter.toLowerCase())),
  );

  return (
    <div className="reference-catalog eats-light">
      <div className="reference-page-heading">
        <h1>Local Favorite Eats</h1>
        <p>Find your table in Tulum.</p>
      </div>
      <div className="reference-search">
        <Search size={18} />
        <input
          aria-label="Search restaurants"
          placeholder="Search restaurants"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="reference-filters" aria-label="Restaurant neighborhoods">
        {["All", "Beach", "Centro"].map((label) => (
          <button
            key={label}
            className={filter === label ? "selected" : ""}
            aria-pressed={filter === label}
            onClick={() => setFilter(label)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="reference-listing-grid">
        {items.map((item) => (
          <article className="reference-listing" key={item.id}>
            <Link to={item.url}>
              <img
                src={item.photos?.[0] || "/placeholder.svg"}
                alt={item.name}
                loading="lazy"
              />
              <div className="listing-copy">
                <h2>{item.name}</h2>
                <p className="listing-category">{item.category}</p>
                <p className="eat-area">
                  {item.area}
                  {item.rating ? <span title="Google Maps rating, checked Nov 5, 2026"> · ★ {item.rating.toFixed(1)}</span> : null}
                </p>
              </div>
            </Link>
<WishlistHeart item={{id:item.id,kind:"restaurant",name:item.name,category:item.category,photo:item.photos?.[0],url:item.url}}/>
          </article>
        ))}
      </div>
      {!items.length && (
        <p className="reference-empty">
          No restaurants match. Try another neighborhood.
        </p>
      )}
    </div>
  );
}
