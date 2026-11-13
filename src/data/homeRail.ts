import { airbnbExperiences, type AirbnbExperience } from "@/data/airbnbExperiences.generated";

/** Cards in each Local Favorite rail on the home page. */
export const HOME_RAIL_COUNT = 8;

/** A listing price that came from the catalog. Missing prices stay out. */
export function hasListingPrice(item: AirbnbExperience): boolean {
  return item.price != null && Number.isFinite(item.price.amount) && item.price.amount > 0;
}

/** A photo saved with the catalog, not an emoji or a hotlinked image. */
export function hasSavedCatalogPhoto(item: AirbnbExperience): boolean {
  const photo = item.photos[0];
  return (
    typeof photo === "string" &&
    photo.startsWith("/experience-photos/") &&
    photo.endsWith(".jpg") &&
    !photo.includes("..")
  );
}

/** Dollar amount for the home card. Other currencies stay off the `$…/person` line. */
export function homeRailUsdAmount(price: AirbnbExperience["price"]): number | null {
  if (!price || price.currency !== "USD" || !(price.amount > 0)) return null;
  return price.amount;
}

function compareExperiences(a: AirbnbExperience, b: AirbnbExperience): number {
  const rating = (b.rating ?? -1) - (a.rating ?? -1);
  if (rating !== 0) return rating;
  const reviews = (b.reviewCount ?? -1) - (a.reviewCount ?? -1);
  if (reviews !== 0) return reviews;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * Catalog cards that can fill the home rail after the preview listings.
 * One experience per business (username): a real price, a saved photo,
 * highest rating, then review count.
 */
export function homeRailCatalogExperiences(
  count: number,
  source: readonly AirbnbExperience[] = airbnbExperiences,
): AirbnbExperience[] {
  if (count <= 0) return [];
  const bestByBusiness = new Map<string, AirbnbExperience>();
  for (const item of source) {
    if (!hasListingPrice(item) || !hasSavedCatalogPhoto(item)) continue;
    const current = bestByBusiness.get(item.username);
    if (!current || compareExperiences(item, current) < 0) bestByBusiness.set(item.username, item);
  }
  return [...bestByBusiness.values()].sort(compareExperiences).slice(0, count);
}
