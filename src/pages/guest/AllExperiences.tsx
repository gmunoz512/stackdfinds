import { WishlistHeart } from "@/components/destination/WishlistHeart";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Heart, Search, ChevronRight } from "lucide-react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import {
  ReferencePhoto,
  type ReferenceCrop,
} from "@/components/destination/ReferencePhoto";
import { TulumSketch } from "@/components/destination/DestinationShell";
import { previewExperiences } from "@/data/previewExperiences";
interface ExperienceListing {
  id: string;
  name: string;
  category: string;
  description: string | null;
  photos: string[] | null;
  price_per_person: number | null;
  google_rating: number | null;
  referencePhoto?: ReferenceCrop;
}
export default function AllExperiences() {
  const [params] = useSearchParams();
  const [filter, setFilter] = useState(params.get("category") || "All");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<ExperienceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(false);
    if (!isSupabaseConfigured) {
      setItems(previewExperiences);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("vendor_profiles_public")
        .select(
          "id,name,category,description,photos,price_per_person,google_rating",
        )
        .eq("is_published", true)
        .eq("listing_type", "experience");
      if (error) throw error;
      setItems(data || []);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, []);

  const visible = items.filter(
    (item) =>
      `${item.name} ${item.category}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (filter === "All" ||
        filter === "all" ||
        (filter === "Water" || filter === "Water Sports"
          ? item.category === "Water Sports"
          : filter === "Tours"
            ? ["Tour Guide", "Tours & Activities", "Transportation"].includes(
                item.category,
              )
            : item.category === filter)),
  );
  return (
    <div className="reference-catalog">
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
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <div className="reference-filters" aria-label="Experience categories">
        {["All", "Water", "Tours", "Wellness"].map((label) => (
          <button
            aria-pressed={filter === label}
            className={filter === label ? "selected" : ""}
            key={label}
            onClick={() => setFilter(label)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="reference-listing-grid">
        {loading
          ? [1, 2, 3, 4].map((i) => (
              <div className="reference-listing skeleton" key={i} />
            ))
          : visible.map((item) => (
              <article className="reference-listing" key={item.id}>
                <Link
                  to={
                    item.id.startsWith("preview-")
                      ? `/preview-experience/${item.id}`
                      : `/vendor/${item.id}`
                  }
                >
                  <ReferencePhoto
                    crop={item.referencePhoto}
                    src={item.photos?.[0] || "/placeholder.svg"}
                    alt={item.name}
                  />
                  <div className="listing-copy">
                    <h2>{item.name}</h2>
                    <p className="listing-category">{item.category}</p>
                    {item.price_per_person != null && (
                      <p className="listing-price">
                        ${item.price_per_person}
                        <span>/person</span>
                      </p>
                    )}
                  </div>
                </Link>
<WishlistHeart item={{id:item.id,kind:"experience",name:item.name,category:item.category,crop:item.referencePhoto,photo:item.photos?.[0],price:item.price_per_person,url:item.id.startsWith("preview-")?`/preview-experience/${item.id}`:`/vendor/${item.id}`}}/>
              </article>
            ))}
      </div>
      {!loading && !visible.length && (
        <div className="reference-empty">
          {error ? (
            <>
              <p>Experiences couldn’t load.</p>
              <button onClick={() => void load()}>Try again</button>
            </>
          ) : (
            <p>No experiences match yet. Try another category.</p>
          )}
        </div>
      )}

    </div>
  );
}
