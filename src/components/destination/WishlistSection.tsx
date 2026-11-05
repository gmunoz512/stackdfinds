import { Link } from "react-router-dom";
import { ArrowRight, Heart } from "lucide-react";
import { useLocalWishlist } from "@/hooks/useLocalWishlist";
import { ReferencePhoto } from "./ReferencePhoto";
import { WishlistHeart } from "./WishlistHeart";

/** Match the original homepage: saved photo cards in the page, below discovery. */
export function WishlistSection() {
  const { items } = useLocalWishlist();
  return (
    <section className="home-category home-wishlists" aria-labelledby="home-wishlists-title">
      <header>
        <p>YOUR TULUM COLLECTION</p>
        <div className="home-wishlists-heading">
          <h2 id="home-wishlists-title">My Wishlists</h2>
          <span role="status" aria-live="polite">{items.length} saved</span>
        </div>
        <Link to="/wishlists">Open My stackd <ArrowRight size={16} /></Link>
      </header>
      {items.length ? (
        <div className="home-wishlists-grid">
          {items.map(item => (
            <article className="home-wishlist-card" key={`${item.kind}:${item.id}`}>
              <Link to={item.url}>
                <ReferencePhoto crop={item.crop} src={item.photo || "/placeholder.svg"} alt={item.name} />
                <div className="listing-copy">
                  <h3>{item.name}</h3>
                  <p className="listing-category">{item.category}</p>
                  {item.kind === "experience" && item.price != null && <p className="listing-price">${item.price}<span>/person</span></p>}
                </div>
              </Link>
              <WishlistHeart item={item} />
            </article>
          ))}
        </div>
      ) : (
        <div className="home-wishlists-empty"><Heart size={28} /><p>No favorites yet.</p><span>Heart restaurants and experiences to save them here.</span></div>
      )}
      <Link className="wishlist-plan-button" to="/trip-planner">{items.length ? "Plan with these favorites" : "Plan your trip"} <ArrowRight size={18} /></Link>
    </section>
  );
}
