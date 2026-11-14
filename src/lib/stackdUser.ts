import { normalizeUsername, usernameError } from "@/lib/vendorAccounts";
import type { User } from "@supabase/supabase-js";

/** Server-only claim. user_metadata.username is display text and is not used. */
export function stackdVendorUsername(user: User | null): string | null {
  const value = user?.app_metadata?.vendor_username;
  if (typeof value !== "string") return null;
  const username = normalizeUsername(value);
  return usernameError(username) ? null : username;
}
