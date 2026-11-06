import { supabase } from "@/integrations/supabase/client";
import { parseLoginIdentifier } from "@/lib/vendorAccounts";

/**
 * Signs in with an email OR a vendor username.
 * Username: try the hidden <username>@vendors.stackdfinds.com login first (works
 * for every vendor who hasn't switched to their own email; needs no function).
 * If that fails, ask vendor-username-sign-in, which finds a vendor who did
 * switch and returns a session without revealing their email.
 */
export async function signInWithIdentifier(identifier: string, password: string) {
  const parsed = parseLoginIdentifier(identifier);
  if (parsed.kind === "invalid") return { data: { user: null, session: null }, error: new Error("Invalid login credentials") };
  const direct = await supabase.auth.signInWithPassword({ email: parsed.email, password });
  if (!direct.error || parsed.kind === "email") return direct;

  const { data, error } = await supabase.functions.invoke("vendor-username-sign-in", {
    body: { username: parsed.username, password },
  });
  if (error || !data?.access_token) return direct; // same "Invalid login credentials" as before
  return supabase.auth.setSession({ access_token: data.access_token, refresh_token: data.refresh_token });
}
