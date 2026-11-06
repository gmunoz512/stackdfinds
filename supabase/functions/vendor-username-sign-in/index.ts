// Public: signs a vendor in by username + password AFTER they've switched their
// login to their own email (until then the app signs in with the hidden
// <username>@vendors.stackdfinds.com address directly and never calls this).
// Looks up the username in app_metadata, then does a normal password sign-in on
// the server and returns the session. The vendor's email is never returned, so
// this can't be used to look up someone's address. Same error for "no such
// username" and "wrong password". Supabase Auth's own sign-in rate limits apply.
// NOT DEPLOYED — needs owner approval before `supabase functions deploy`.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { findUserByUsername, isValidUsername, normalizeUsername } from "../_shared/vendorUsernames.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
const BAD = () => json({ error: "Invalid login credentials" }, 400);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: { username?: string; password?: string };
  try { body = await req.json(); } catch { return json({ error: "Bad JSON" }, 400); }
  const username = normalizeUsername(body.username);
  const password = String(body.password ?? "");
  if (!isValidUsername(username) || password.length < 6 || password.length > 72) return BAD();

  const url = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  let owner;
  try { owner = await findUserByUsername(admin, username); } catch (e) {
    console.error("lookup failed:", (e as Error).message);
    return json({ error: "Sign-in is unavailable right now" }, 500);
  }
  if (!owner?.email) return BAD();

  const anon = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, { auth: { persistSession: false } });
  const { data, error } = await anon.auth.signInWithPassword({ email: owner.email, password });
  if (error || !data.session) return BAD();
  return json({ access_token: data.session.access_token, refresh_token: data.session.refresh_token });
});
