import { airbnbExperiences, type AirbnbExperience } from "@/data/airbnbExperiences.generated";

export type AirbnbVendor = {
  username: string;
  businessName: string;
  personName: string | null;
  /** Main photo of the vendor's top experience. Shared with business tiles. */
  photo: string | null;
  rating: number | null;
  reviewCount: number | null;
  experiences: AirbnbExperience[];
};

function groupVendors(experiences: AirbnbExperience[]): AirbnbVendor[] {
  const vendors: AirbnbVendor[] = [];
  const byUsername = new Map<string, AirbnbVendor>();
  for (const experience of experiences) {
    let vendor = byUsername.get(experience.username);
    if (!vendor) {
      vendor = {
        username: experience.username,
        businessName: experience.businessName,
        personName: experience.personName,
        photo: null,
        rating: null,
        reviewCount: null,
        experiences: [],
      };
      byUsername.set(experience.username, vendor);
      vendors.push(vendor);
    }
    vendor.experiences.push(experience);
  }
  for (const vendor of vendors) {
    const top = vendor.experiences.find((item) => item.isTop) ?? vendor.experiences[0];
    vendor.experiences = [top, ...vendor.experiences.filter((item) => item !== top)];
    vendor.photo = top.photos[0] ?? null;
    vendor.rating = top.rating;
    vendor.reviewCount = top.reviewCount;
  }
  return vendors;
}

export const airbnbVendors: AirbnbVendor[] = groupVendors(airbnbExperiences);

export function findAirbnbVendor(username: string | undefined): AirbnbVendor | undefined {
  if (!username) return undefined;
  return airbnbVendors.find((vendor) => vendor.username === username);
}

export function findAirbnbExperience(username: string | undefined, experienceId: string | undefined) {
  if (!username || !experienceId) return undefined;
  const id = experienceId.startsWith("airbnb-") ? experienceId : `airbnb-${experienceId}`;
  return airbnbExperiences.find((item) => item.username === username && item.id === id);
}
