import { Heart } from "lucide-react";
import { useLocalWishlist, type WishlistItem } from "@/hooks/useLocalWishlist";
export function WishlistHeart({ item }: {item: WishlistItem}) {
 const { has, toggle } = useLocalWishlist();
 const saved=has(item.kind,item.id);
 return <button type="button" className="listing-heart" aria-label={`${saved?"Remove":"Save"} ${item.name}`} aria-pressed={saved} onClick={event=>{event.preventDefault();event.stopPropagation();toggle(item);}}><Heart size={19} fill={saved?"currentColor":"none"}/></button>;
}
