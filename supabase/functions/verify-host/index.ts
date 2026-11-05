import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: unknown) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[VERIFY-HOST] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    if (!user) throw new Error("User not authenticated");

    logStep("User authenticated", { userId: user.id });

    const body = await req.json();
    const { action } = body;

    if (action === "submit") {
      // Host submitting documents for verification
      const { governmentIdUrl, selfieUrl, phone } = body;

      if (!governmentIdUrl || !selfieUrl) {
        throw new Error("Both government ID and selfie are required");
      }

      // Update profile with document URLs and set status to pending
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({
          government_id_url: governmentIdUrl,
          selfie_url: selfieUrl,
          verified_phone: phone || null,
          host_verification_status: "pending_verification",
        })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      logStep("Host submitted verification docs", { userId: user.id });

      // Notify admin
      try {
        await supabaseAdmin.functions.invoke("send-admin-notification", {
          body: {
            type: "host_verification_submitted",
            vendorName: user.email,
            vendorEmail: user.email,
            verificationNotes: "A host has submitted their identity verification documents for review.",
          },
          headers: {
            Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
        });
      } catch (notifError) {
        logStep("Failed to send admin notification (non-fatal)", { error: String(notifError) });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    if (action === "review") {
      // Admin reviewing a host's verification
      // Check that the caller is an admin
      const { data: isAdmin } = await supabaseAdmin.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });

      if (!isAdmin) {
        throw new Error("Only administrators can review verifications");
      }

      const { hostUserId, status, notes } = body;
      if (!hostUserId || !status) {
        throw new Error("hostUserId and status are required");
      }

      const validStatuses = ["verified", "rejected"];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status: ${status}. Must be one of: ${validStatuses.join(", ")}`);
      }

      const updateData: Record<string, unknown> = {
        host_verification_status: status,
        host_verification_notes: notes || null,
      };

      if (status === "verified") {
        updateData.host_verified_at = new Date().toISOString();
        updateData.host_verified_by = user.id;
      }

      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update(updateData)
        .eq("user_id", hostUserId);

      if (updateError) throw updateError;

      logStep("Admin reviewed host verification", { hostUserId, status });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    throw new Error(`Unknown action: ${action}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
