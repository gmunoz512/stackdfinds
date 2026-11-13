import type { ReferenceCrop } from "@/components/destination/ReferencePhoto";
import { airbnbExperiences } from "@/data/airbnbExperiences.generated";
import { previewExperiences } from "@/data/previewExperiences";

export type CatalogCard = {
  id: string;
  name: string;
  businessName: string | null;
  category: string;
  photos: string[] | null;
  price: number | null;
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
  price: null,
  rating: item.rating,
  reviewCount: item.reviewCount,
  username: item.username,
  href: `/experiences/${item.username}#${item.id}`,
}));

/** Preview listings first, then every Airbnb experience. No prices invented for Airbnb. */
export const experienceCatalog: CatalogCard[] = [...previewCards, ...airbnbCards];
