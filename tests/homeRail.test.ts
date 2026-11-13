import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { AirbnbExperience, AirbnbPrice } from "@/data/airbnbExperiences.generated";
import { HOME_RAIL_COUNT, homeRailCatalogExperiences, homeRailUsdAmount } from "@/data/homeRail";
import { previewExperiences } from "@/data/previewExperiences";

const root = join(import.meta.dirname, "..");

function price(amount: number, currency: string | null = "USD"): AirbnbPrice {
  return {
    amount,
    currency,
    display: currency === "USD" ? `$${amount}` : `${currency ?? ""} ${amount}`,
    from: false,
    minimumAmount: null,
    minimumDisplay: null,
  };
}

function listing(
  overrides: Partial<AirbnbExperience> & Pick<AirbnbExperience, "id" | "username">,
): AirbnbExperience {
  return {
    title: overrides.id,
    businessName: overrides.username,
    personName: null,
    category: "Tour Guide",
    rating: null,
    reviewCount: null,
    isTop: false,
    photos: [`/experience-photos/${overrides.username}/1.jpg`],
    price: price(40),
    duration: null,
    offered: [],
    meetingArea: null,
    city: null,
    languages: [],
    groupSize: null,
    description: null,
    ...overrides,
  };
}

describe("home experience rail", () => {
  it("matches the restaurant rail: previews first, then four ranked catalog cards", () => {
    expect(HOME_RAIL_COUNT).toBe(8);
    expect(previewExperiences).toHaveLength(4);
    const catalog = homeRailCatalogExperiences(HOME_RAIL_COUNT - previewExperiences.length);
    expect(catalog.map((item) => [item.id, item.username, item.title, item.rating, item.reviewCount])).toEqual([
      ["airbnb-2300303", "fabioroselli", "5 hidden cenotes jungle experience", 5, 637],
      ["airbnb-2842634", "kristel", "Cenote hopping", 5, 320],
      ["airbnb-2819032", "victoriayjuancarlos", "Tequila & Mezcal Tulum - Private Session", 5, 292],
      ["airbnb-2360583", "lamar", "Picture perfect moments in Riviera Maya", 5, 103],
    ]);
    expect(new Set(catalog.map((item) => item.username)).size).toBe(catalog.length);
    for (const item of catalog) {
      expect(item.price && item.price.amount > 0).toBe(true);
      expect(homeRailUsdAmount(item.price)).toBe(item.price?.amount);
      expect(existsSync(join(root, "public", item.photos[0].slice(1)))).toBe(true);
    }
  });

  it("keeps one priced, photographed experience per business, rating then reviews", () => {
    const picked = homeRailCatalogExperiences(3, [
      listing({ id: "same-low", username: "same", rating: 4.9, reviewCount: 900 }),
      listing({ id: "same-best", username: "same", rating: 5, reviewCount: 2 }),
      listing({ id: "next", username: "other", rating: 5, reviewCount: 1 }),
      listing({ id: "many-reviews", username: "busy", rating: 4.8, reviewCount: 5000 }),
      listing({ id: "no-price", username: "free", rating: 5, reviewCount: 8000, price: null }),
      listing({ id: "no-photo", username: "blank", rating: 5, reviewCount: 8000, photos: [] }),
      listing({ id: "hotlink", username: "remote", rating: 5, reviewCount: 8000, photos: ["https://example.com/a.jpg"] }),
      listing({
        id: "pesos",
        username: "mxn",
        rating: 4.7,
        reviewCount: 10,
        price: price(500, "MXN"),
      }),
    ]);
    expect(picked.map((item) => item.id)).toEqual(["same-best", "next", "many-reviews"]);
    expect(homeRailUsdAmount(price(500, "MXN"))).toBeNull();
    expect(homeRailUsdAmount(null)).toBeNull();
  });
});
