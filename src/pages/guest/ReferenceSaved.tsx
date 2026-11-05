import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Heart } from "lucide-react";
import { useLocalWishlist } from "@/hooks/useLocalWishlist";
import { ReferencePhoto } from "@/components/destination/ReferencePhoto";
import { WishlistHeart } from "@/components/destination/WishlistHeart";
export default function ReferenceSaved() {
 const [tab,setTab]=useState("All");
 const { items }=useLocalWishlist();
 const visible=items.filter(v=>tab==="All" || v.kind===(tab==="Eats"?"restaurant":"experience"));
 return <div className="reference-catalog"><div className="reference-page-heading"><h1>My stackd</h1><p>Your Tulum finds, all together.</p></div><div className="reference-filters">{["All","Eats","Experiences"].map(v=><button key={v} aria-pressed={v===tab} className={v===tab?"selected":""} onClick={()=>setTab(v)}>{v}</button>)}</div><div className="reference-listing-grid">{visible.map(v=><article className="reference-listing" key={`${v.kind}:${v.id}`}><Link to={v.url}><ReferencePhoto crop={v.crop} src={v.photo||"/placeholder.svg"} alt={v.name}/><div className="listing-copy"><h2>{v.name}</h2><p className="listing-category">{v.category}</p>{v.kind==="experience"&&v.price!=null&&<p className="listing-price">${v.price}/person</p>}</div></Link><WishlistHeart item={v}/></article>)}</div>{!visible.length&&<div className="reference-empty"><Heart className="mx-auto mb-4"/><p>Heart a favorite to add it here.</p><Link to="/appview">Find local favorites</Link></div>}{items.length>0&&<Link className="wishlist-plan-button saved-plan-button" to="/trip-planner">Plan with these favorites <ArrowRight size={18}/></Link>}</div>;
}
