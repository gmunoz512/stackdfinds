import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import { mockRestaurants } from "@/data/mockRestaurants";
import { experienceCatalog } from "@/data/experienceCatalog";
import type { ReferenceCrop } from "@/components/destination/ReferencePhoto";
export type WishlistItem = { id: string; kind: "restaurant" | "experience"; name: string; category: string; photo?: string; crop?: ReferenceCrop; url: string; price?: number | null; priceLabel?: string | null };
const keys = { restaurant: "restaurantFavorites", experience: "vendorFavorites" };
const FAVORITES_RESET_KEY = "stackd-favorites-reset-v1";

// The public preview previously accumulated demo favorites in browser storage.
// Clear that old preview state once, then allow new favorites to persist normally.
function clearLegacyPreviewFavorites() {
 if (typeof window === "undefined" || localStorage.getItem(FAVORITES_RESET_KEY)) return;
 localStorage.removeItem(keys.restaurant);
 localStorage.removeItem(keys.experience);
 localStorage.removeItem("stackdWishlistItems");
 localStorage.setItem(FAVORITES_RESET_KEY, "1");
}

clearLegacyPreviewFavorites();

function read<T>(key: string, fallback: T): T {
 try { return JSON.parse(localStorage.getItem(key) || "null") ?? fallback; } catch { return fallback; }
}
function ids(kind: WishlistItem["kind"]): string[] { const value = read<unknown>(keys[kind], []); return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : []; }
const snapshot = () => JSON.stringify([ids("restaurant"), ids("experience"), read("stackdWishlistItems", {})]);
const subscribe = (notify: () => void) => { window.addEventListener("stackd-wishlist", notify); window.addEventListener("storage", notify); return () => { window.removeEventListener("stackd-wishlist", notify); window.removeEventListener("storage", notify); }; };
const known: WishlistItem[] = [
 ...mockRestaurants.map(r => ({id:r.id, kind:"restaurant" as const, name:r.name, category:r.cuisine, photo:r.photos[0], url:`/restaurant/${r.id}`})),
 ...experienceCatalog.map(e => ({id:e.id, kind:"experience" as const, name:e.name, category:e.category, crop:e.referencePhoto, photo:e.photos?.[0], url:e.href, price:e.price, priceLabel:e.priceLabel})),
];
export function useLocalWishlist() {
 const raw = useSyncExternalStore(subscribe, snapshot, () => '[[],[],{}]');
 const [eats, experiences, records] = JSON.parse(raw) as [string[],string[],Record<string,WishlistItem>];
 const items: WishlistItem[] = ([...eats.map(id=>({id,kind:"restaurant" as const})), ...experiences.map(id=>({id,kind:"experience" as const}))]).map(({id,kind}) => records[`${kind}:${id}`] || known.find(v=>v.id===id && v.kind===kind) || {id,kind,name:"Saved place",category:"Tulum",url:kind==="restaurant"?`/restaurant/${id}`:`/vendor/${id}`});
 const has = (kind: WishlistItem["kind"], id:string) => (kind==="restaurant"?eats:experiences).includes(id);
 const toggle = (item: WishlistItem) => {
  const current = ids(item.kind);
  const wasSaved = current.includes(item.id);
  const next = wasSaved ? current.filter(id=>id!==item.id) : [...current,item.id];
  const records = read<Record<string,WishlistItem>>("stackdWishlistItems", {});
  records[`${item.kind}:${item.id}`]=item;
  localStorage.setItem("stackdWishlistItems",JSON.stringify(records));
  localStorage.setItem(keys[item.kind],JSON.stringify(next));
  window.dispatchEvent(new Event("stackd-wishlist"));
  toast.success(wasSaved ? "Removed from your wishlist" : "Added to your wishlist", { description: item.name, duration: 2200 });
 };
 return { items, has, toggle };
}
