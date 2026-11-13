// Public facts read from an Airbnb experience listing page.
// Missing fields stay empty. Nothing here is guessed.

export type AirbnbPrice = {
  amount: number;
  /** ISO code when the page shows one, or when "$" is shown for a US visitor. */
  currency: string | null;
  /** The price token as the page printed it, such as "$77" or "MX$1,200". */
  display: string;
  /** True when the page says the amount is a starting ("From") price. */
  from: boolean;
  /** A minimum charge the page states, such as "Minimum $700 to book". */
  minimumAmount: number | null;
  minimumDisplay: string | null;
};

export type ListingFacts = {
  price: AirbnbPrice | null;
  duration: string | null;
  offered: string[];
  meetingArea: string | null;
  city: string | null;
  languages: string[];
  groupSize: string | null;
  description: string | null;
};

export function emptyListingFacts(): ListingFacts {
  return {
    price: null,
    duration: null,
    offered: [],
    meetingArea: null,
    city: null,
    languages: [],
    groupSize: null,
    description: null,
  };
}

type Rec = Record<string, unknown>;

function isRec(value: unknown): value is Rec {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function cleanText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value
    .replace(/https?:\/\/(?:www\.)?airbnb\.com\S*/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!text || /muscache\.com/i.test(text)) return null;
  return text;
}

function ugc(node: unknown): string | null {
  if (!isRec(node)) return cleanText(node);
  const localized = isRec(node.localizedValue) ? node.localizedValue : node;
  return (
    cleanText(localized.localizedString) ||
    cleanText(localized.localizedStringWithTranslationPreference) ||
    cleanText(localized.source) ||
    cleanText(localized.text) ||
    cleanText(node.text)
  );
}

function activityNumericId(id: unknown): string | null {
  if (typeof id !== "string" || !id) return null;
  try {
    const decoded = atob(id);
    const match = decoded.match(/(\d+)\s*$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function collectListings(node: unknown, suggested: boolean, out: Rec[]) {
  if (Array.isArray(node)) {
    for (const item of node) collectListings(item, suggested, out);
    return;
  }
  if (!isRec(node)) return;
  if (!suggested && node.__typename === "ActivityListing" && node.overviewDisplayPrice) {
    out.push(node);
    return;
  }
  for (const [key, value] of Object.entries(node)) {
    collectListings(value, suggested || key === "suggestedActivities", out);
  }
}

const MONEY =
  /^(US\$|MX\$|CA\$|AU\$|A\$|NZ\$|€|£|\$)\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?|[0-9]+(?:\.[0-9]+)?)/;

function currencyFor(symbol: string, country: string | null): string | null {
  switch (symbol) {
    case "US$":
      return "USD";
    case "MX$":
      return "MXN";
    case "CA$":
      return "CAD";
    case "AU$":
    case "A$":
      return "AUD";
    case "NZ$":
      return "NZD";
    case "€":
      return "EUR";
    case "£":
      return "GBP";
    case "$":
      if (country === "US") return "USD";
      if (country === "MX") return "MXN";
      if (country === "CA") return "CAD";
      if (country === "GB") return "GBP";
      if (country === "AU") return "AUD";
      if (country === "NZ") return "NZD";
      return null;
    default:
      return null;
  }
}

function moneyFromToken(token: string, country: string | null): { amount: number; currency: string | null; display: string } | null {
  const match = token.trim().match(MONEY);
  if (!match) return null;
  const amount = Number(match[2].replace(/,/g, ""));
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000) return null;
  return { amount, currency: currencyFor(match[1], country), display: `${match[1]}${match[2]}` };
}

function lineMoney(line: Rec, country: string | null) {
  const label = cleanText(line.accessibilityLabel) ?? "";
  const components = Array.isArray(line.orderedComponents) ? line.orderedComponents : [];
  const discounted = components.find((item) => isRec(item) && typeof item.discountedPrice === "string") as Rec | undefined;
  const token = typeof discounted?.discountedPrice === "string" ? discounted.discountedPrice : "";
  const parsed = moneyFromToken(token, country) ?? (token ? null : moneyFromToken(label, country));
  if (!parsed) return null;
  const from = components.some((item) => isRec(item) && item.leadingContent === "From") || /^from\b/i.test(label);
  return { ...parsed, from, perGuest: /per guest|\/ guest/i.test(label) };
}

function guestPriceLineFrom(overview: Rec, country: string | null) {
  const primary = isRec(overview.primaryLine) ? lineMoney(overview.primaryLine, country) : null;
  if (primary?.perGuest) return primary;
  const explanation = isRec(overview.explanationData) ? overview.explanationData : null;
  const groups = explanation && Array.isArray(explanation.priceDetails) ? explanation.priceDetails : [];
  for (const group of groups) {
    if (!isRec(group) || !Array.isArray(group.items)) continue;
    for (const item of group.items) {
      if (!isRec(item) || !isRec(item.price)) continue;
      const parsed = lineMoney(item.price, country);
      if (parsed?.perGuest) return parsed;
    }
  }
  return null;
}

function minimumCharge(overview: Rec, country: string | null) {
  const explanation = isRec(overview.explanationData) ? overview.explanationData : null;
  const text = JSON.stringify(explanation ?? {});
  const match = text.match(/Minimum\s+((?:US\$|MX\$|CA\$|AU\$|A\$|NZ\$|€|£|\$)[0-9][0-9,]*(?:\.[0-9]+)?)/);
  if (!match) return null;
  return moneyFromToken(match[1], country);
}

function priceFromListing(listing: Rec, country: string | null): AirbnbPrice | null {
  const overview = isRec(listing.overviewDisplayPrice) ? listing.overviewDisplayPrice : null;
  if (!overview) return null;
  const guest = guestPriceLineFrom(overview, country);
  if (!guest) return null;
  const minimum = minimumCharge(overview, country);
  return {
    amount: guest.amount,
    currency: guest.currency,
    display: guest.display,
    from: guest.from,
    minimumAmount: minimum?.amount ?? null,
    minimumDisplay: minimum?.display ?? null,
  };
}

function highlightText(listing: Rec, type: string, field: "localizedName" | "localizedDescription"): string | null {
  if (!Array.isArray(listing.pdpHighlights)) return null;
  for (const item of listing.pdpHighlights) {
    if (!isRec(item) || item.type !== type) continue;
    const text = ugc(item[field]);
    if (text) return text;
  }
  return null;
}

function parseLanguages(text: string | null): string[] {
  if (!text) return [];
  const match = text.match(/(?:hosted|offered) in\s+(.+)/i);
  const source = (match ? match[1] : text).replace(/\.$/, "");
  const parts = source
    .split(/,|&| and /i)
    .map((part) => part.trim())
    .filter((part) => part.length > 1 && part.length < 40);
  return [...new Set(parts)];
}

function offeredLines(listing: Rec): string[] {
  const offerings = isRec(listing.offerings) ? listing.offerings : null;
  const published = offerings && isRec(offerings.publishedOfferings) ? offerings.publishedOfferings : null;
  const offering = Array.isArray(published?.edges) ? published.edges[0] : null;
  const node = isRec(offering) && isRec(offering.node) ? offering.node : null;
  const agenda = node && isRec(node.agenda) ? node.agenda : null;
  const items = agenda && isRec(agenda.publishedAgendaItems) ? agenda.publishedAgendaItems : null;
  if (!Array.isArray(items?.edges)) return [];
  const lines: string[] = [];
  for (const edge of items.edges) {
    if (!isRec(edge) || !isRec(edge.node)) continue;
    const title = ugc(edge.node.title);
    const description = ugc(edge.node.description);
    if (title && description && description !== title) lines.push(`${title}. ${description}`);
    else if (title || description) lines.push((title || description) as string);
  }
  return [...new Set(lines)];
}

function groupSizeFrom(listing: Rec): string | null {
  const offerings = isRec(listing.offerings) ? listing.offerings : null;
  const published = offerings && isRec(offerings.publishedOfferings) ? offerings.publishedOfferings : null;
  const offering = Array.isArray(published?.edges) ? published.edges[0] : null;
  const node = isRec(offering) && isRec(offering.node) ? offering.node : null;
  const display = node && isRec(node.pricingAndAvailabilityDisplay) ? node.pricingAndAvailabilityDisplay : null;
  const slot = Array.isArray(display?.edges) ? display.edges[0] : null;
  const capacity = isRec(slot) && isRec(slot.node) ? slot.node.maximumCapacity : null;
  if (typeof capacity !== "number" || !Number.isInteger(capacity) || capacity < 1 || capacity > 500) return null;
  return `Up to ${capacity} ${capacity === 1 ? "guest" : "guests"}`;
}

export function factsFromActivityListing(listing: Rec, country: string | null): ListingFacts {
  const meetingPoint = ugc(isRec(listing.descriptions) ? listing.descriptions.meetingPoint : null);
  const city = isRec(listing.location) ? cleanText(listing.location.locationDisplayLabel) : null;
  return {
    price: priceFromListing(listing, country),
    duration: highlightText(listing, "DURATION_AND_LANGUAGE", "localizedName"),
    offered: offeredLines(listing),
    meetingArea: meetingPoint,
    city,
    languages: parseLanguages(highlightText(listing, "DURATION_AND_LANGUAGE", "localizedDescription")),
    groupSize: groupSizeFrom(listing),
    description: ugc(isRec(listing.descriptions) ? listing.descriptions.byline : null),
  };
}

export function extractFactsFromHtml(html: string, experienceId?: string): { found: boolean; facts: ListingFacts } {
  const marker = '<script id="data-injector-instances"';
  const start = html.indexOf(marker);
  if (start < 0) return { found: false, facts: emptyListingFacts() };
  const open = html.indexOf(">", start);
  const close = html.indexOf("</script>", open);
  if (open < 0 || close < 0) return { found: false, facts: emptyListingFacts() };
  let data: unknown;
  try {
    data = JSON.parse(html.slice(open + 1, close));
  } catch {
    return { found: false, facts: emptyListingFacts() };
  }
  const listings: Rec[] = [];
  collectListings(data, false, listings);
  const countryMatch = html.match(/"country_alpha2":"([A-Z]{2})"/);
  const country = countryMatch ? countryMatch[1] : null;
  let listing: Rec | null = listings[0] ?? null;
  if (experienceId) {
    const match = listings.find((item) => activityNumericId(item.id) === experienceId) ?? null;
    if (match) listing = match;
    else if (listings.length !== 1) listing = null;
  }
  if (!listing) return { found: false, facts: emptyListingFacts() };
  return { found: true, facts: factsFromActivityListing(listing, country) };
}

export function locationLine(meetingArea: string | null, city: string | null): string | null {
  if (meetingArea && city && !meetingArea.includes(city)) return `${meetingArea}, ${city}`;
  return meetingArea || city;
}

export function groupSizeMax(groupSize: string | null): number | null {
  const match = groupSize?.match(/^Up to (\d+) guests?$/);
  if (!match) return null;
  const max = Number(match[1]);
  return Number.isInteger(max) && max > 0 ? max : null;
}
