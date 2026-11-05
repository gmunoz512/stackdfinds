// Admin-only: creates a vendor login (<slug>@stackdfinds.com) + vendor profile.
// The generated password is returned ONCE in the response and never stored
// in plain text (Supabase Auth only keeps the hash). The account is flagged
// user_metadata.must_change_password so the app forces a new password on first login.
// NOT DEPLOYED — needs owner approval before `supabase functions deploy`.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const DOMAIN = "stackdfinds.com";
const CATEGORIES = ["experience", "restaurant", "tour", "wellness", "transport", "other"];

function slug(name: string) {
  return name.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 40);
}

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

  let body: { name?: string; category?: string };
  try { body = await req.json(); } catch { return json({ error: "Bad JSON" }, 400); }
  const name = (body.name ?? "").trim().slice(0, 120);
  const base = slug(name);
  if (!base) return json({ error: "Enter a vendor name with at least one letter or number" }, 400);
  const category = CATEGORIES.includes(body.category ?? "") ? body.category! : "experience";

  const password = generatePassword();
  let createdId: string | null = null;
  let email = "";
  // Try slug@, slug2@, ... ; Supabase rejects duplicates, which is our "taken" check.
  for (let n = 1; n <= 50 && !createdId; n++) {
    email = `${base}${n === 1 ? "" : n}@${DOMAIN}`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { must_change_password: true, full_name: name, created_by_admin: user.id },
    });
    if (data?.user) createdId = data.user.id;
    else if (error && !/already|registered|exists/i.test(error.message)) {
      console.error("createUser failed:", error.message);
      return json({ error: "Could not create the login" }, 500);
    }
  }
  if (!createdId) return json({ error: "No free email address for that name" }, 409);

  const rollback = async (msg: string) => {
    await admin.auth.admin.deleteUser(createdId!); // only removes the user this call just made
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

  console.log(`Vendor account created: ${email} by admin ${user.id}`);
  // Password is in this response only. Never log it.
  return json({ email, password, vendorProfileId: profile.id });
});
