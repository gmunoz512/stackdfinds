import type { ReferenceCrop } from "@/components/destination/ReferencePhoto";
import { airbnbExperiences } from "@/data/airbnbExperiences.generated";
import { previewExperiences } from "@/data/previewExperiences";
import { guestPriceLine } from "@/lib/experiencePrice";
import { formatUsd } from "@/lib/guestBooking";

export type CatalogCard = {
  id: string;
  name: string;
  businessName: string | null;
  category: string;
  photos: string[] | null;
  price: number | null;
  /** Shown on cards. "Price on request" when the listing has no public price. */
  priceLabel: string;
  rating: number | null;
  reviewCount: number | null;
  referencePhoto?: ReferenceCrop;
  username: string | null;
  href: string;
};

const previewCards: CatalogCard[] = previewExperiences.map((item) => ({
  id: item.id,
  name: item.name,
  businessName: null,
  category: item.category,
  photos: item.photos,
  price: item.price_per_person,
  priceLabel: formatUsd(item.price_per_person),
  rating: item.google_rating,
  reviewCount: null,
  referencePhoto: item.referencePhoto,
  username: null,
  href: `/preview-experience/${item.id}`,
}));

const airbnbCards: CatalogCard[] = airbnbExperiences.map((item) => ({
  id: item.id,
  name: item.title,
  businessName: item.businessName,
  category: item.category,
  photos: item.photos.length ? item.photos : null,
  price: item.price?.currency === "USD" ? item.price.amount : null,
  priceLabel: guestPriceLine(item.price),
  rating: item.rating,
  reviewCount: item.reviewCount,
  username: item.username,
  href: `/experiences/${item.username}/${item.id}`,
}));

/** Preview listings first, then every Airbnb experience. No prices invented for Airbnb. */
export const experienceCatalog: CatalogCard[] = [...previewCards, ...airbnbCards];
