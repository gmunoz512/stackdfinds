// Guest booking requests for Airbnb-catalog experiences. No payment and no Stripe.
// Deploy ONLY to Stackd (lryeshzwwhcdtzemeyzk):
//   supabase functions deploy create-booking-request --project-ref lryeshzwwhcdtzemeyzk
// The function validates the body, recomputes the price from
// src/data/airbnbExperiences.generated.ts, and inserts with the service role.
// The catalog has no per-vendor commission tier, so host earnings are stored
// as "not set" unless a listing ever carries commissionPercentage.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { airbnbExperiences } from "../../../src/data/airbnbExperiences.generated.ts";
import { prepareBookingRequest, type CatalogListing } from "../../../src/lib/bookingRequest.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

function listingFor(username: string, experienceId: string): CatalogListing | null {
  const id = experienceId.startsWith("airbnb-") ? experienceId : `airbnb-${experienceId}`;
  const row = airbnbExperiences.find((item) => item.username === username && item.id === id);
  if (!row) return null;
  return {
    id: row.id,
    username: row.username,
    title: row.title,
    price: row.price,
    groupSize: row.groupSize,
    times: null,
    commissionPercentage: null,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json({ error: "That request couldn't be read." }, 400);
  }

  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : {};
  const username = String(record.vendorUsername ?? record.vendor_username ?? "").trim().toLowerCase();
  const experienceId = String(record.experienceId ?? record.experience_id ?? "");
  const prepared = prepareBookingRequest(body, listingFor(username, experienceId));
  if (!prepared.ok) return json({ error: prepared.error }, 400);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return json({ error: "Booking requests opening soon." }, 503);

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
  const { data, error } = await admin
    .from("booking_requests")
    .insert(prepared.row)
    .select("id, status")
    .single();

  if (error || !data) return json({ error: "We couldn't send that request. Try again." }, 500);
  return json({ id: data.id, status: data.status }, 201);
});
