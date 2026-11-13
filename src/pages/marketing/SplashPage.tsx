import { WishlistSection } from "@/components/destination/WishlistSection";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { mockRestaurants } from "@/data/mockRestaurants";
import { previewExperiences } from "@/data/previewExperiences";
import { HOME_RAIL_COUNT, homeRailCatalogExperiences, homeRailUsdAmount } from "@/data/homeRail";
import { FadePhoto } from "@/components/media/FadePhoto";
import { ReferencePhoto } from "@/components/destination/ReferencePhoto";
import { WishlistHeart } from "@/components/destination/WishlistHeart";
import { formatUsd } from "@/lib/guestBooking";
import coast from "@/assets/tulum-coast.png";

export default function TulumHome() {
  const restaurants = mockRestaurants.filter((r) => r.city.toLowerCase() === "tulum").slice(0, HOME_RAIL_COUNT);
  const previewRail = previewExperiences.slice(0, restaurants.length);
  const catalogRail = homeRailCatalogExperiences(restaurants.length - previewRail.length);
  return <div className="tulum-home">
  <section className="tulum-home-hero"><img src={coast} alt="Tulum ruins above the Caribbean Sea"/><div><p>TULUM, MÉXICO</p><h1>Your Tulum<br/>starts here.</h1><span>Local favorites. Your kind of trip.</span></div></section>
  <section className="home-category eats-light"><header><p>A TASTE OF TULUM</p><h2>Local Favorite Eats</h2><span>Restaurants, cafés & local tables</span><Link to="/restaurants">See all restaurants <ArrowRight size={16}/></Link></header><div className="home-card-rail" role="region" aria-label="Local favorite restaurants — swipe to browse" tabIndex={0}>{restaurants.map(r => <article className="reference-listing" key={r.id}><Link to={`/restaurant/${r.id}`}><FadePhoto src={r.photos[0]} alt={r.name} frameClassName="reference-photo" /><div className="listing-copy"><h3>{r.name}</h3><p className="listing-category">{r.cuisine}</p></div></Link><WishlistHeart item={{id:r.id,kind:"restaurant",name:r.name,category:r.cuisine,photo:r.photos[0],url:`/restaurant/${r.id}`}}/></article>)}</div></section>
  <section className="home-category"><header><p>GO A LITTLE FURTHER</p><h2>Local Favorite Experiences</h2><span>Cenotes, culture & a little adventure</span><Link to="/experiences">See all experiences <ArrowRight size={16}/></Link></header><div className="home-card-rail" role="region" aria-label="Local favorite experiences — swipe to browse" tabIndex={0}>{previewRail.map(e => <article className="reference-listing" key={e.id}><Link to={`/preview-experience/${e.id}`}><ReferencePhoto crop={e.referencePhoto} alt={e.name}/><div className="listing-copy"><h3>{e.name}</h3><p className="listing-category">{e.category}</p><p className="listing-price">${e.price_per_person}<span>/person</span></p></div></Link><WishlistHeart item={{id:e.id,kind:"experience",name:e.name,category:e.category,crop:e.referencePhoto,url:`/preview-experience/${e.id}`,price:e.price_per_person}}/></article>)}{catalogRail.map(e => {
    const href = `/experiences/${e.username}/${e.id}`;
    const usd = homeRailUsdAmount(e.price);
    return <article className="reference-listing" key={e.id}><Link to={href}><FadePhoto src={e.photos[0]} alt={e.title} frameClassName="reference-photo" /><div className="listing-copy"><h3>{e.title}</h3><p className="listing-category">{e.category}</p>{usd != null && <p className="listing-price">{formatUsd(usd)}<span>/person</span></p>}</div></Link><WishlistHeart item={{id:e.id,kind:"experience",name:e.title,category:e.category,photo:e.photos[0],url:href,price:usd}}/></article>;
  })}</div></section>
  <WishlistSection />
 </div>;
}
