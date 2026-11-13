// Keyword map for the static Airbnb catalog. First matching group wins ties
// by which phrase shows up earliest in the title. Anything else is "Tour Guide".

const GROUPS: { category: string; terms: string[] }[] = [
  {
    category: "Wellness",
    terms: [
      "meditation",
      "journaling",
      "yoga",
      "reiki",
      "sound healing",
      "sound bath",
      "temazcal",
      "massage",
      "spa",
      "breathwork",
      "crystal bowl",
    ],
  },
  {
    category: "Workshops",
    terms: [
      "pottery",
      "clay",
      "workshop",
      "macrame",
      "bracelet",
      "silver ring",
      "artisan",
      "espadrille",
      "ecoprint",
      "tote bag",
      "dream catcher",
    ],
  },
  {
    category: "Food & Drink",
    terms: [
      "vegan",
      "flavor",
      "chocolate",
      "cacao",
      "cocoa",
      "taco",
      "cooking",
      "culinary",
      "chef",
      "tequila",
      "mezcal",
      "beer",
      "cocktail",
      "appetizer",
      "tasting",
      "coffee",
      "honey",
      "insect",
      "ceviche",
      "seafood",
      "breakfast",
      "lunch",
      "dinner",
      "meal",
      "feast",
      "bite",
      "brewing",
      "spirit",
      "wine",
      "cheese",
      "recipe",
      "nixtamal",
      "pibil",
      "pib feast",
      "snack",
      "food",
      "taste",
      "pubcrawl",
      "pub crawl",
      "champagne",
      "mezcalita",
    ],
  },
  {
    category: "Water Sports",
    terms: [
      "snorkel",
      "snorkeling",
      "kayak",
      "boat",
      "yacht",
      "paddleboard",
      "paddleboarding",
      "paddle",
      "sailing",
      "surf",
      "dive",
      "swim",
      "cenote",
      "reef",
      "turtle",
      "lagoon",
      "sail",
      "sea scooter",
      "manta",
      "octopus",
      "scuba",
    ],
  },
  {
    category: "Adventure",
    terms: [
      "bike",
      "biking",
      "pedal",
      "e-bike",
      "ebike",
      "spelunk",
      "zipline",
      "zip line",
      "climb",
      "jungle",
      "adventure",
      "hike",
      "hiking",
    ],
  },
  {
    category: "Tours & Culture",
    terms: [
      "tour",
      "ruin",
      "mayan",
      "maya",
      "chichen",
      "coba",
      "museum",
      "history",
      "cultural",
      "culture",
      "temple",
      "archaeolog",
      "ancient",
      "explore",
      "guide",
      "walk",
      "walking",
      "stroll",
      "mural",
      "street art",
      "bird",
      "wildlife",
      "rescue",
      "xolo",
      "salsa",
      "dance",
      "photo",
      "photoshoot",
      "picture",
      "capture",
      "insta",
      "sian",
      "muyil",
      "valladolid",
      "isla",
      "contoy",
      "underworld",
      "caste",
    ],
  },
];

export const DEFAULT_EXPERIENCE_CATEGORY = "Tour Guide";

export const CATALOG_FILTERS = [
  "All",
  "Water Sports",
  "Food & Drink",
  "Tours & Culture",
  "Wellness",
  "Adventure",
  "Workshops",
  "Tour Guide",
] as const;

function termIndex(text: string, term: string): number {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = new RegExp(`(?:^|[^a-z0-9])${escaped}s?(?![a-z0-9])`, "i").exec(text);
  if (!match) return -1;
  return text.indexOf(term, match.index);
}

/** Infer a catalog category from an experience title. */
export function inferExperienceCategory(title: string): string {
  const text = title.toLowerCase();
  let best = { category: DEFAULT_EXPERIENCE_CATEGORY, score: 0, at: Number.POSITIVE_INFINITY };
  for (const group of GROUPS) {
    let score = 0;
    let at = Number.POSITIVE_INFINITY;
    for (const term of group.terms) {
      const index = termIndex(text, term);
      if (index < 0) continue;
      // A wellness or workshop phrase is the point of the listing, even when
      // the title also names a place or a cenote.
      score += group.category === "Wellness" || group.category === "Workshops" ? 2 : 1;
      if (index < at) at = index;
    }
    if (score > best.score || (score === best.score && score > 0 && at < best.at)) {
      best = { category: group.category, score, at };
    }
  }
  return best.category;
}

/** "Andrea (La Xolita)" → "La Xolita". Names without a business stay as written. */
export function businessDisplayName(vendorName: string): string {
  const match = vendorName.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  const business = match?.[2]?.trim();
  return business || vendorName.trim();
}

/** The person's name when the vendor field is "Person (Business)". */
export function personName(vendorName: string): string | null {
  const match = vendorName.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
  const person = match?.[1]?.trim();
  return person || null;
}

export function matchesCategory(filter: string, category: string): boolean {
  if (!filter || filter === "All" || filter === "all") return true;
  if (filter === "Water" || filter === "Water Sports") return category === "Water Sports";
  if (filter === "Tours") {
    return ["Tour Guide", "Tours & Culture", "Tours & Activities", "Transportation"].includes(category);
  }
  if (filter === "Food" || filter === "Food & Drink") {
    return category === "Food & Drink" || category === "Private Chef";
  }
  if (filter === "Wellness") return category === "Wellness";
  if (filter === "Adventure") return category === "Adventure";
  if (filter === "Workshops") return category === "Workshops";
  return category === filter;
}

/** 5 → "5.0", 4.9 → "4.9", 4.95 → "4.95". */
export function formatRating(rating: number): string {
  return (Math.round(rating * 100) / 100).toFixed(2).replace(/0$/, "");
}
