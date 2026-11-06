// Admin-only: creates a vendor login by USERNAME + vendor profile. Supabase Auth
// needs an email, so the login uses a hidden <username>@vendors.stackdfinds.com
// address (email_confirm true, no mailbox, never shown to vendors).
// The generated password is returned ONCE in the response and never stored
// in plain text (Supabase Auth only keeps the hash). The account is flagged
// user_metadata.must_change_password so the app forces a new password on first login.
// NOT DEPLOYED — needs owner approval before `supabase functions deploy`.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { findUserByUsername, isValidUsername, normalizeUsername, usernameLoginEmail } from "../_shared/vendorUsernames.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const CATEGORIES = ["experience", "restaurant", "tour", "wellness", "transport", "other"];

// 20 chars from an unambiguous alphabet via crypto RNG (~115 bits). Meets passwordSchema (6–72).
function generatePassword(len = 20) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789-_!@#";
  const out: string[] = [];
  const buf = new Uint32Array(1);
  while (out.length < len) {
    crypto.getRandomValues(buf);
    const limit = Math.floor(0x100000000 / alphabet.length) * alphabet.length;
    if (buf[0] < limit) out.push(alphabet[buf[0] % alphabet.length]);
  }
  return out.join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json({ error: "Unauthorized" }, 401);

  const url = Deno.env.get("SUPABASE_URL")!;
  const asCaller = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authErr } = await asCaller.auth.getUser();
  if (authErr || !user) return json({ error: "Invalid session" }, 401);

  const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: isAdmin } = await admin.rpc("has_role", { _user_id: user.id, _role: "admin" });
  if (!isAdmin) return json({ error: "Admins only" }, 403);

  let body: { name?: string; category?: string; username?: string };
  try { body = await req.json(); } catch { return json({ error: "Bad JSON" }, 400); }
  const name = (body.name ?? "").trim().slice(0, 120);
  if (!name) return json({ error: "Enter the business name" }, 400);
  const username = normalizeUsername(body.username);
  if (!isValidUsername(username)) {
    return json({ error: "Username must be 3–30 lowercase letters, numbers or single dashes" }, 400);
  }
  const category = CATEGORIES.includes(body.category ?? "") ? body.category! : "experience";

  if (await findUserByUsername(admin, username)) return json({ error: "That username is taken. Try another." }, 409);

  const password = generatePassword();
  const email = usernameLoginEmail(username);
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { vendor_username: username },
    user_metadata: { username, must_change_password: true, full_name: name, created_by_admin: user.id },
  });
  if (error || !data?.user) {
    if (error && /already|registered|exists/i.test(error.message)) return json({ error: "That username is taken. Try another." }, 409);
    console.error("createUser failed:", error?.message);
    return json({ error: "Could not create the login" }, 500);
  }
  const createdId = data.user.id;

  const rollback = async (msg: string) => {
    await admin.auth.admin.deleteUser(createdId); // only removes the user this call just made
    return json({ error: msg }, 500);
  };

  const { error: roleErr } = await admin.from("user_roles").insert({ user_id: createdId, role: "vendor" });
  if (roleErr) return rollback("Could not set vendor role");

  const { data: profile, error: profErr } = await admin
    .from("vendor_profiles")
    .insert({ user_id: createdId, name, category, city: "Tulum", is_published: false })
    .select("id")
    .single();
  if (profErr || !profile) return rollback("Could not create vendor profile");

  console.log(`Vendor account created: ${username} by admin ${user.id}`);
  // Password is in this response only. Never log it.
  return json({ username, password, vendorProfileId: profile.id });
});
