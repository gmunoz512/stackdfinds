import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type OAuthProvider = "google" | "apple";
export type SignupRole = "host" | "vendor" | "user";

/**
 * Google and Apple refuse to load inside an iframe (X-Frame-Options: DENY),
 * and the web build runs inside the phone-frame wrapper (`/?appframe=1`).
 * So we ask Supabase for the provider URL without redirecting, then send the
 * TOP window there. The provider returns to `/auth` on the top window, and
 * main.tsx passes `/auth?code=…` / `#access_token=…` through to the app frame.
 */
export async function startOAuth(provider: OAuthProvider, role?: SignupRole | null) {
  if (role) localStorage.setItem("pending_role", role);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth`,
      skipBrowserRedirect: true,
      ...(provider === "google" ? { queryParams: { prompt: "select_account" } } : {}),
    },
  });
  if (error) throw error;
  if (!data?.url) throw new Error("Sign-in is not available right now.");
  try {
    (window.top ?? window).location.href = data.url;
  } catch {
    // Cross-origin parent: fall back to a top-level navigation.
    window.open(data.url, "_top");
  }
}

/** Name and email the provider shared, used to pre-fill the profile step. */
export function getOAuthPrefill(user: User | null | undefined) {
  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const pick = (...keys: string[]) =>
    keys.map((k) => meta[k]).find((v): v is string => typeof v === "string" && v.trim() !== "")?.trim() ?? "";
  const fullName =
    pick("full_name", "name") ||
    [pick("given_name", "first_name"), pick("family_name", "last_name")].filter(Boolean).join(" ");
  const [firstName = "", ...rest] = fullName.split(" ");
  return { fullName, firstName, lastName: rest.join(" "), email: user?.email || pick("email") };
}

/**
 * Build the URL the app frame should load, carrying over any OAuth return
 * (`/auth?code=…` or `#access_token=…`) that landed on the top window.
 */
export function appFrameSrc(loc: Pick<Location, "pathname" | "search" | "hash">) {
  const params = new URLSearchParams(loc.search);
  params.set("appframe", "1");
  return `${loc.pathname || "/"}?${params.toString()}${loc.hash || ""}`;
}
