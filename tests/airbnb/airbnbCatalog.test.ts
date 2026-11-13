import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { airbnbVendors } from "@/data/airbnbCatalog";
import { airbnbExperiences } from "@/data/airbnbExperiences.generated";
import { experienceCatalog } from "@/data/experienceCatalog";
import {
  businessDisplayName,
  formatRating,
  inferExperienceCategory,
  matchesCategory,
  personName,
} from "@/lib/experienceCategory";

const root = join(import.meta.dirname, "../..");

describe("airbnb experience catalog", () => {
  it("keeps the four preview experiences and adds every CSV row", () => {
    expect(experienceCatalog.filter((item) => item.id.startsWith("preview-"))).toHaveLength(4);
    expect(airbnbExperiences).toHaveLength(208);
    expect(new Set(airbnbExperiences.map((item) => item.username)).size).toBe(107);
    expect(airbnbVendors).toHaveLength(107);
  });

  it("uses the parenthetical business name and the username as the vendor id", () => {
    expect(businessDisplayName("Andrea (La Xolita)")).toBe("La Xolita");
    expect(personName("Andrea (La Xolita)")).toBe("Andrea");
    expect(businessDisplayName("Adolfo")).toBe("Adolfo");
    const vendor = airbnbVendors.find((item) => item.username === "laxolita");
    expect(vendor?.businessName).toBe("La Xolita");
    expect(vendor?.experiences.some((item) => item.title === "Chichen-Itza, a half day trip")).toBe(true);
  });

  it("marks one top experience per business and uses its main photo as the vendor photo", () => {
    for (const vendor of airbnbVendors) {
      const tops = vendor.experiences.filter((item) => item.isTop);
      expect(tops).toHaveLength(1);
      expect(vendor.experiences[0]).toBe(tops[0]);
      expect(vendor.photo).toBe(tops[0].photos[0] ?? null);
    }
  });

  it("omits rating and review count when the CSV left them blank", () => {
    const unrated = airbnbExperiences.filter((item) => item.rating == null);
    expect(unrated.length).toBeGreaterThan(0);
    for (const item of unrated) expect(item.reviewCount).toBeNull();
    for (const item of airbnbExperiences) {
      if (item.rating != null) expect(item.rating).toBeGreaterThan(0);
      expect(item).not.toHaveProperty("sourceUrl");
      if (item.price) {
        expect(item.price.amount).toBeGreaterThan(0);
        expect(item.price.display.length).toBeGreaterThan(0);
      } else {
        expect(item.price).toBeNull();
      }
      expect(JSON.stringify(item)).not.toContain("airbnb.com");
      expect(JSON.stringify(item)).not.toContain("muscache");
    }
  });

  it("stores only local photos that exist in the repo", () => {
    let photos = 0;
    for (const item of airbnbExperiences) {
      expect(item.photos.length).toBeLessThanOrEqual(5);
      for (const photo of item.photos) {
        expect(photo.startsWith(`/experience-photos/${item.username}/`)).toBe(true);
        expect(photo.endsWith(".jpg")).toBe(true);
        expect(existsSync(join(root, "public", photo.slice(1)))).toBe(true);
        photos += 1;
      }
    }
    expect(photos).toBeGreaterThan(200);
  });

  it("infers categories from the title and defaults the rest to Tour Guide", () => {
    expect(inferExperienceCategory("Power Snorkeling with Sea Scooters & Tequila")).toBe("Water Sports");
    expect(inferExperienceCategory("Sunset Meditation & Journaling for Self-Connection")).toBe("Wellness");
    expect(inferExperienceCategory("Clay & Creativity: A Pottery Experience in Tulum")).toBe("Workshops");
    expect(inferExperienceCategory("Airport & local rides with La Xolita")).toBe("Tour Guide");
    for (const item of airbnbExperiences) {
      expect(item.category).toBe(inferExperienceCategory(item.title));
    }
    expect(matchesCategory("Water", "Water Sports")).toBe(true);
    expect(matchesCategory("Tours", "Transportation")).toBe(true);
    expect(matchesCategory("Food & Drink", "Private Chef")).toBe(true);
  });

  it("formats ratings without trailing zeros past the tenths", () => {
    expect(formatRating(5)).toBe("5.0");
    expect(formatRating(4.9)).toBe("4.9");
    expect(formatRating(4.95)).toBe("4.95");
  });

  it("does not link the guest UI out to Airbnb", () => {
    const files = [
      "src/pages/guest/AllExperiences.tsx",
      "src/pages/guest/ExperienceBusiness.tsx",
      "src/pages/guest/ExperienceListing.tsx",
      "src/pages/guest/AppView.tsx",
      "src/pages/guest/app-view/GuestExploreTab.tsx",
      "src/pages/marketing/SplashPage.tsx",
      "src/data/airbnbExperiences.generated.ts",
      "src/data/experienceCatalog.ts",
    ];
    for (const file of files) {
      const source = readFileSync(join(root, file), "utf8");
      expect(source).not.toContain("airbnb.com");
      expect(source).not.toContain("muscache.com");
    }
  });
});
