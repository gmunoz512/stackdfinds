import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { absoluteUrl } from "@/lib/site";

const OG_IMAGE = absoluteUrl("/og-stackd-logo.png");

const pages: Record<string, [string, string]> = {
  "/faq": ["FAQ | stackd", "Find answers about wishlists, trip planning, experiences, and joining stackd."],
  "/about": ["About stackd", "Connecting travelers with local restaurants, adventures, hosts, and vendors."],
  "/": ["stackd | Local experiences and restaurants", "Discover and book trusted local experiences, tours, and restaurants."],
  "/explore": ["Explore local experiences | stackd", "Find memorable local experiences curated by trusted hosts."],
  "/experiences": ["Local experiences | stackd", "Browse bookable tours and experiences from local vendors."],
  "/restaurants": ["Restaurants near you | stackd", "Discover restaurants recommended by local hosts."],
  "/for-hosts": ["Travel guides for hosts | stackd", "Create better stays with trusted local recommendations."],
  "/for-vendors": ["Grow your local experience business | stackd", "Reach guests looking for memorable local experiences."],
  "/for-travelers": ["For travelers | stackd", "Find local restaurants, experiences, and favorites for your next trip."],
  "/trip-planner": ["Trip planner | stackd", "Build a personalized itinerary with local recommendations."],
};
export function RouteSeo() {
  const { pathname } = useLocation();
  useEffect(() => {
    const base = pathname.startsWith("/experience/") ? ["Experience details | stackd", "Explore this local experience and book your next adventure."] : pathname.startsWith("/restaurant/") ? ["Restaurant details | stackd", "Explore this restaurant and plan your visit."] : pages[pathname] || ["stackd | Local experiences and restaurants", "Discover and book trusted local experiences, tours, and restaurants."];
    document.title = base[0];
    for (const [selector, value] of [["description", base[1]], ["og:title", base[0]], ["og:description", base[1]], ["og:image", OG_IMAGE], ["twitter:title", base[0]], ["twitter:description", base[1]], ["twitter:image", OG_IMAGE]] as const) {
      const attr = selector.startsWith("og:") ? "property" : "name";
      let el = document.head.querySelector(`meta[${attr}="${selector}"]`);
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, selector); document.head.appendChild(el); }
      el.setAttribute("content", value);
    }
  }, [pathname]);
  return null;
}
