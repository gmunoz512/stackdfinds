import { describe, it, expect } from "vitest";
import { suggestUsername, usernameError, usernameLoginEmail, parseLoginIdentifier, preferredEmail, isHiddenLoginEmail, mustChangePassword } from "../src/lib/vendorAccounts";

describe("vendor usernames", () => {
  it("suggests a slug from the business name", () => {
    expect(suggestUsername("Tacos Número Uno!")).toBe("tacos-numero-uno");
    expect(suggestUsername("  --Café  ARCA-- ")).toBe("cafe-arca");
    expect(suggestUsername("   ")).toBe("");
    expect(suggestUsername("a".repeat(29) + " bcd").length).toBeLessThanOrEqual(30);
    expect(suggestUsername("a".repeat(29) + " bcd").endsWith("-")).toBe(false);
  });
  it("validates usernames", () => {
    expect(usernameError("tacos-numero-uno")).toBeNull();
    expect(usernameError("ab")).not.toBeNull();
    expect(usernameError("Tacos")).not.toBeNull();
    expect(usernameError("tacos--uno")).not.toBeNull();
    expect(usernameError("-tacos")).not.toBeNull();
  });
  it("maps usernames to the hidden login address", () => {
    expect(usernameLoginEmail(" Tacos-Numero-Uno ")).toBe("tacos-numero-uno@vendors.stackdfinds.com");
    expect(isHiddenLoginEmail("x@vendors.stackdfinds.com")).toBe(true);
    expect(isHiddenLoginEmail("x@gmail.com")).toBe(false);
  });
  it("parses the sign-in box", () => {
    expect(parseLoginIdentifier("Tacos-Numero-Uno")).toEqual({ kind: "username", username: "tacos-numero-uno", email: "tacos-numero-uno@vendors.stackdfinds.com" });
    expect(parseLoginIdentifier("me@gmail.com")).toEqual({ kind: "email", email: "me@gmail.com" });
    expect(parseLoginIdentifier("me@").kind).toBe("invalid");
    expect(parseLoginIdentifier("").kind).toBe("invalid");
    expect(parseLoginIdentifier("no spaces ok").kind).toBe("invalid");
  });
  it("hides the internal address", () => {
    expect(preferredEmail({ email: "t@vendors.stackdfinds.com" })).toBeNull();
    expect(preferredEmail({ email: "owner@gmail.com" })).toBe("owner@gmail.com");
  });
  it("reads the must-change flag", () => {
    expect(mustChangePassword({ user_metadata: { must_change_password: true } })).toBe(true);
    expect(mustChangePassword({ user_metadata: {} })).toBe(false);
    expect(mustChangePassword(null)).toBe(false);
  });
});
