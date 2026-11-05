import { describe, expect, it } from "vitest";
import {
  HOST_ATTRIBUTION_KEY,
  getRememberedHost,
  priceSummary,
  rememberHost,
  resolveHostAttribution,
  validateGuestDetails,
} from "@/lib/guestBooking";

function mem() {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), removeItem: (k: string) => void m.delete(k) };
}
const HOST = "11111111-2222-3333-4444-555555555555";
const OTHER = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

describe("host attribution", () => {
  it("stores a valid host from the URL and reads it back", () => {
    const s = mem();
    expect(resolveHostAttribution(HOST, 1000, [s])).toBe(HOST);
    expect(getRememberedHost(2000, [s])).toBe(HOST);
  });
  it("falls back to the remembered host when the URL has none", () => {
    const s = mem();
    rememberHost(HOST, 0, [s]);
    expect(resolveHostAttribution(null, 1000, [s])).toBe(HOST);
  });
  it("last click wins", () => {
    const s = mem();
    rememberHost(HOST, 0, [s]);
    expect(resolveHostAttribution(OTHER, 10, [s])).toBe(OTHER);
  });
  it("ignores junk host ids", () => {
    const s = mem();
    expect(resolveHostAttribution("<script>", 0, [s])).toBeNull();
    expect(s.getItem(HOST_ATTRIBUTION_KEY)).toBeNull();
  });
  it("expires after 30 days", () => {
    const s = mem();
    rememberHost(HOST, 0, [s]);
    expect(getRememberedHost(31 * 86_400_000, [s])).toBeNull();
  });
});

describe("price summary", () => {
  it("guest pays price x party size, no fees added", () => {
    expect(priceSummary(100, 2)).toMatchObject({ subtotal: 200, total: 200 });
  });
  it("applies and caps discounts", () => {
    expect(priceSummary(50, 1, 10).total).toBe(40);
    expect(priceSummary(50, 1, 99).total).toBe(0);
  });
  it("guards bad input", () => {
    expect(priceSummary(-5, 0)).toMatchObject({ pricePerPerson: 0, guests: 1, total: 0 });
  });
});

describe("guest details", () => {
  it("requires name and email", () => {
    expect(validateGuestDetails({ fullName: "", email: "x" })).toHaveProperty("email");
    expect(validateGuestDetails({ fullName: "Sarah", email: "sarah@example.com" })).toEqual({});
  });
});
