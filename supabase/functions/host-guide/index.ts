import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.78.0";

import { corsHeadersFor } from "../_shared/http.ts";

const getCorsHeaders = (origin: string | null) =>
  corsHeadersFor(new Request("https://stackd.local/", { headers: origin ? { origin } : {} }));

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const hostId =
      body && typeof body === "object" && "hostId" in body
        ? String((body as Record<string, unknown>).hostId ?? "")
        : "";

    if (!hostId || !UUID_RE.test(hostId)) {
      return new Response(JSON.stringify({ error: "Invalid hostId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!url || !serviceKey) {
      console.error("Backend config missing (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)");
      return new Response(JSON.stringify({ error: "Service configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(url, serviceKey, {
      auth: { persistSession: false },
    });

    // Return ONLY non-sensitive data needed for a public guest guide.
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("full_name, recommendations")
      .eq("user_id", hostId)
      .maybeSingle();

    if (error) {
      console.error("host-guide fetch error:", error);
      return new Response(JSON.stringify({ error: "Unable to load host guide" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!data) {
      return new Response(JSON.stringify({ error: "Host not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        full_name: data.full_name,
        recommendations: data.recommendations,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("host-guide error:", e);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
