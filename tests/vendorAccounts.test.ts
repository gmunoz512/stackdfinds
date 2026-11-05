import { describe, it, expect } from "vitest";
import { vendorSlug, pickVendorEmail, mustChangePassword } from "../src/lib/vendorAccounts";

describe("vendor accounts", () => {
  it("slugs names", () => {
    expect(vendorSlug("Tacos Número Uno!")).toBe("tacosnumerouno");
    expect(vendorSlug("  ")).toBe("");
  });
  it("adds a number when taken", () => {
    expect(pickVendorEmail("Tacos Numero Uno", new Set())).toBe("tacosnumerouno@stackdfinds.com");
    expect(pickVendorEmail("Tacos Numero Uno", new Set(["tacosnumerouno@stackdfinds.com"]))).toBe("tacosnumerouno2@stackdfinds.com");
  });
  it("reads the flag", () => {
    expect(mustChangePassword({ user_metadata: { must_change_password: true } })).toBe(true);
    expect(mustChangePassword({ user_metadata: {} })).toBe(false);
    expect(mustChangePassword(null)).toBe(false);
  });
});
