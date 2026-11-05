import { describe, expect, it } from "vitest";
import type { User } from "@supabase/supabase-js";
import { appFrameSrc, getOAuthPrefill } from "../../src/lib/oauth";

describe("appFrameSrc", () => {
  it("loads home in the frame by default", () => {
    expect(appFrameSrc({ pathname: "/", search: "", hash: "" })).toBe("/?appframe=1");
  });
  it("passes a PKCE return (/auth?code=) into the frame", () => {
    expect(appFrameSrc({ pathname: "/auth", search: "?code=abc", hash: "" })).toBe("/auth?code=abc&appframe=1");
  });
  it("passes an implicit return (#access_token=) into the frame", () => {
    expect(appFrameSrc({ pathname: "/auth", search: "", hash: "#access_token=t&type=bearer" })).toBe(
      "/auth?appframe=1#access_token=t&type=bearer",
    );
  });
});

describe("getOAuthPrefill", () => {
  it("reads Google metadata", () => {
    const user = { email: "ana@example.com", user_metadata: { full_name: "Ana María López" } } as unknown as User;
    expect(getOAuthPrefill(user)).toEqual({ fullName: "Ana María López", firstName: "Ana", lastName: "María López", email: "ana@example.com" });
  });
  it("builds a name from Apple given/family names", () => {
    const user = { email: "x@privaterelay.appleid.com", user_metadata: { given_name: "Luis", family_name: "Ruiz" } } as unknown as User;
    expect(getOAuthPrefill(user).fullName).toBe("Luis Ruiz");
  });
  it("handles no user", () => {
    expect(getOAuthPrefill(null)).toEqual({ fullName: "", firstName: "", lastName: "", email: "" });
  });
});
