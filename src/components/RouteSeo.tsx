import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { absoluteUrl } from "@/lib/site";

const OG_IMAGE = absoluteUrl("/og-stackd-logo.png");

const pages: Record<string, [string, string]> = {
  "/": ["Stackd | Local experiences and restaurants", "Discover and book trusted local experiences, tours, and restaurants."],
  "/explore": ["Explore local experiences | Stackd", "Find memorable local experiences curated by trusted hosts."],
  "/experiences": ["Local experiences | Stackd", "Browse bookable tours and experiences from local vendors."],
  "/restaurants": ["Restaurants near you | Stackd", "Discover restaurants recommended by local hosts."],
  "/for-hosts": ["Travel guides for hosts | Stackd", "Create better stays with trusted local recommendations."],
  "/for-vendors": ["Grow your local experience business | Stackd", "Reach guests looking for memorable local experiences."],
  "/trip-planner": ["Trip planner | Stackd", "Build a personalized itinerary with local recommendations."],
};
export function RouteSeo() {
  const { pathname } = useLocation();
  useEffect(() => {
    const base = pathname.startsWith("/experience/") ? ["Experience details | Stackd", "Explore this local experience and book your next adventure."] : pathname.startsWith("/restaurant/") ? ["Restaurant details | Stackd", "Explore this restaurant and plan your visit."] : pages[pathname] || ["Stackd | Local experiences and restaurants", "Discover and book trusted local experiences, tours, and restaurants."];
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
