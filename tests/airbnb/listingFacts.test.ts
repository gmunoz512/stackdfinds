import { describe, expect, it } from "vitest";
import { extractFactsFromHtml } from "@/lib/airbnbListingFacts";
import { PRICE_ON_REQUEST, guestPriceLine, listingPriceBreakdown } from "@/lib/experiencePrice";

function page(listing: unknown, country = "US") {
  const payload = {
    root: [null, ["MofiHydratedDataToken", { country_alpha2: country }], { data: { activityListing: listing } }],
  };
  return `<script id="data-injector-instances" type="application/json">${JSON.stringify(payload)}</script>`;
}

const guestPrice = (label: string, token: string, from = false) => ({
  __typename: "OrderedDisplayPriceLine",
  accessibilityLabel: label,
  orderedComponents: [
    ...(from ? [{ __typename: "LeadingContentDisplayPriceLineComponent", leadingContent: "From" }] : []),
    { __typename: "DiscountedPriceDisplayPriceLineComponent", discountedPrice: token },
    { __typename: "QualifierDisplayPriceLineComponent", qualifier: "/ guest" },
  ],
});

describe("airbnb listing facts", () => {
  it("reads the per-guest price, duration, languages, and description", () => {
    const html = page({
      __typename: "ActivityListing",
      id: btoa("ActivityListing:786106"),
      overviewDisplayPrice: { primaryLine: guestPrice("From $77, per guest", "$77", true), explanationData: null },
      descriptions: {
        byline: { localizedValue: { localizedString: "Walk through Playa del Carmen." } },
        meetingPoint: { localizedValue: { source: "Corner of 10th Ave" } },
      },
      location: { locationDisplayLabel: "Playa del Carmen, Quintana Roo" },
      pdpHighlights: [
        {
          type: "DURATION_AND_LANGUAGE",
          localizedName: { text: "Around 3 hrs experience" },
          localizedDescription: { text: "Hosted in English and Spanish" },
        },
      ],
      offerings: {
        publishedOfferings: {
          edges: [
            {
              node: {
                pricingAndAvailabilityDisplay: { edges: [{ node: { maximumCapacity: 9 } }] },
                agenda: {
                  publishedAgendaItems: {
                    edges: [{ node: { title: { localizedValue: { localizedString: "Eat tropical fruits" } } } }],
                  },
                },
              },
            },
          ],
        },
      },
    });
    const { found, facts } = extractFactsFromHtml(html, "786106");
    expect(found).toBe(true);
    expect(facts.price).toMatchObject({ amount: 77, currency: "USD", display: "$77", from: true, minimumAmount: null });
    expect(facts.duration).toBe("Around 3 hrs experience");
    expect(facts.languages).toEqual(["English", "Spanish"]);
    expect(facts.groupSize).toBe("Up to 9 guests");
    expect(facts.meetingArea).toBe("Corner of 10th Ave");
    expect(facts.city).toBe("Playa del Carmen, Quintana Roo");
    expect(facts.description).toBe("Walk through Playa del Carmen.");
    expect(facts.offered).toEqual(["Eat tropical fruits"]);
  });

  it("uses the per-guest amount when the headline is a group minimum", () => {
    const html = page({
      __typename: "ActivityListing",
      id: btoa("ActivityListing:6806037"),
      overviewDisplayPrice: {
        primaryLine: {
          accessibilityLabel: "From $700, per group",
          orderedComponents: [
            { leadingContent: "From" },
            { discountedPrice: "$700" },
            { qualifier: "/ group" },
          ],
        },
        explanationData: {
          priceDetails: [
            {
              items: [
                {
                  description: "Adults",
                  price: guestPrice("$121.00, per guest", "$121.00"),
                },
              ],
            },
            { content: "Minimum $700 to book" },
          ],
        },
      },
    });
    const { facts } = extractFactsFromHtml(html, "6806037");
    expect(facts.price).toMatchObject({
      amount: 121,
      currency: "USD",
      display: "$121.00",
      from: false,
      minimumAmount: 700,
      minimumDisplay: "$700",
    });
  });

  it("leaves the price empty when the page has no per-guest amount", () => {
    const html = page({ __typename: "ActivityListing", id: btoa("ActivityListing:1"), overviewDisplayPrice: {} });
    expect(extractFactsFromHtml(html, "1").facts.price).toBeNull();
    expect(guestPriceLine(null)).toBe(PRICE_ON_REQUEST);
  });

  it("prices a party with the same guest total and a $0 service fee", () => {
    const price = { amount: 35, currency: "USD", display: "$35", from: false, minimumAmount: null, minimumDisplay: null };
    expect(listingPriceBreakdown(price, 2)).toMatchObject({ subtotal: "$70", fees: "$0", total: "$70", minimum: null });
    const minimum = { ...price, amount: 121, display: "$121.00", minimumAmount: 700, minimumDisplay: "$700" };
    expect(listingPriceBreakdown(minimum, 1)).toMatchObject({ subtotal: "$121", fees: "$0", total: "$700", minimum: "$700" });
  });
});
