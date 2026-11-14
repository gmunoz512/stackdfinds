import { describe, expect, it } from "vitest";
import {
  buildPriceSnapshot,
  calendarDate,
  guestFacingBreakdown,
  guestLimit,
  prepareBookingRequest,
  timeSlotsFor,
  type CatalogListing,
} from "@/lib/bookingRequest";
import { listingPriceBreakdown } from "@/lib/experiencePrice";
import { DEFAULT_TIME_SLOTS } from "@/lib/guestBooking";
import { shareHostPageUrl } from "@/lib/shareGuide";
import { hostPageItemPath } from "@/lib/hostPage";
import { withHostRef } from "@/lib/hostGuide";

const HOST = "11111111-2222-3333-4444-555555555555";

const listing: CatalogListing = {
  id: "airbnb-6806037",
  username: "alejandro",
  title: "Muyil, Sian Kaan, The Talking Cross & Caste War",
  price: {
    amount: 121,
    currency: "USD",
    display: "$121.00",
    from: false,
    minimumAmount: 700,
    minimumDisplay: "$700",
  },
  groupSize: "Up to 2 guests",
  times: null,
  commissionPercentage: null,
};

const base = {
  vendorUsername: "alejandro",
  experienceId: "airbnb-6806037",
  requestedDate: "2026-12-01",
  timeSlot: "9:00 AM",
  guests: 1,
  guestName: "Ada Lovelace",
  guestEmail: "ada@example.com",
};

describe("booking request validation", () => {
  it("accepts a catalog request and ignores a client-sent price", () => {
    const result = prepareBookingRequest(
      { ...base, price: 1, total: 1 },
      listing,
      new Date("2026-11-14T18:00:00Z"),
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.row.price_snapshot.total).toBe("$700");
    expect(result.row.price_snapshot.totalAmount).toBe(700);
    expect(result.row.status).toBe("pending");
    expect(result.row.host_ref).toBeNull();
    expect(result.row.price_snapshot).not.toHaveProperty("commissionPct");
  });

  it("rejects a past date in Quintana Roo", () => {
    const result = prepareBookingRequest(base, listing, new Date("2026-12-02T15:00:00Z"));
    expect(result.ok).toBe(false);
  });

  it("rejects too many guests and a long note", () => {
    expect(guestLimit("Up to 2 guests")).toEqual({ min: 1, max: 2 });
    expect(prepareBookingRequest({ ...base, guests: 3 }, listing, new Date("2026-11-14T18:00:00Z")).ok).toBe(false);
    expect(prepareBookingRequest({ ...base, notes: "n".repeat(1001) }, listing, new Date("2026-11-14T18:00:00Z")).ok).toBe(false);
    expect(prepareBookingRequest({ ...base, timeSlot: "1:00 AM" }, listing, new Date("2026-11-14T18:00:00Z")).ok).toBe(false);
  });

  it("uses the experience times when the data has them", () => {
    expect(timeSlotsFor(null)).toEqual(DEFAULT_TIME_SLOTS);
    expect(timeSlotsFor(["7:00 PM"])).toEqual(["7:00 PM"]);
  });
});

describe("price snapshot and host earnings", () => {
  it("matches the guest breakdown and hides commission when nobody referred the guest", () => {
    const snapshot = buildPriceSnapshot(listing, 1, null);
    expect(guestFacingBreakdown(snapshot)).toEqual({
      guests: listingPriceBreakdown(listing.price!, 1).guests,
      subtotal: listingPriceBreakdown(listing.price!, 1).subtotal,
      fees: "$0",
      total: "$700",
      minimum: "$700",
    });
    expect(JSON.stringify(guestFacingBreakdown(snapshot))).not.toMatch(/%/);
  });

  it("stores not set when the catalog has no commission tier", () => {
    const snapshot = buildPriceSnapshot(listing, 1, HOST);
    expect(snapshot.commissionPct).toBeNull();
    expect(snapshot.commissionLabel).toBe("not set");
    expect(snapshot.hostEarning).toBeNull();
    expect(guestFacingBreakdown(snapshot).total).toBe("$700");
  });

  it("stores the host's full affiliate percent of the guest total", () => {
    const snapshot = buildPriceSnapshot({ ...listing, commissionPercentage: 15 }, 1, HOST);
    expect(snapshot.commissionPct).toBe(15);
    expect(snapshot.platformFeePercent).toBe(2.5);
    expect(snapshot.hostEarning).toBe(105);
    expect(guestFacingBreakdown(snapshot)).not.toHaveProperty("commissionPct");
  });

  it("uses the 17% tier's 2% stackd cut without charging the guest", () => {
    const snapshot = buildPriceSnapshot({ ...listing, commissionPercentage: 17 }, 1, HOST);
    expect(snapshot.platformFeePercent).toBe(2);
    expect(snapshot.hostEarning).toBe(119);
    expect(snapshot.total).toBe("$700");
  });
});

describe("host page attribution", () => {
  it("puts the Stackd host id on the shared page and the experience link", () => {
    const url = shareHostPageUrl("ada-tulum", HOST, "Sam");
    expect(url).toBe(`https://stackdfinds.com/h/ada-tulum?host=${HOST}&guest=Sam`);
    const path = hostPageItemPath(
      { itemType: "experience", itemRef: "airbnb-6806037", vendorUsername: "alejandro" },
      HOST,
    );
    expect(path).toBe(withHostRef("/experiences/alejandro/airbnb-6806037", HOST));
    expect(path).toContain(`host=${HOST}`);
  });

  it("keeps today's date in America/Cancun", () => {
    expect(calendarDate(new Date("2026-11-14T04:30:00Z"))).toBe("2026-11-13");
  });
});
