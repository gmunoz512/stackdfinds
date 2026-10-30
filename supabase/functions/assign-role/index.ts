import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { role } = body;

    console.log(`Role assignment request: '${role}' for user ${user.id}`);

    const validRoles = ["host", "vendor", "user"];
    if (!role || !validRoles.includes(role)) {
      return new Response(
        JSON.stringify({ error: "Invalid role. Must be 'host', 'vendor', or 'user'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const serviceSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check if user already has a role
    const { data: existingRole, error: checkError } = await serviceSupabase
      .from("user_roles")
      .select("id, role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (checkError) {
      console.error("Error checking existing role:", checkError.message);
      return new Response(
        JSON.stringify({ error: "Failed to check existing role" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // SECURITY: Prevent privilege escalation
    // - Users with no role can only assign themselves "user" initially
    // - Users with "user" role can upgrade to "host" or "vendor" (onboarding flow)
    // - Users already "host" or "vendor" CANNOT switch roles without admin intervention
    if (existingRole) {
      const currentRole = existingRole.role;

      if (currentRole === role) {
        // Already has this role — no-op
        return new Response(
          JSON.stringify({ success: true, role }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Hosts and vendors cannot self-switch to a different privileged role
      if ((currentRole === 'host' || currentRole === 'vendor') && role !== 'user') {
        console.warn(`Blocked role switch: ${currentRole} -> ${role} for user ${user.id}`);
        return new Response(
          JSON.stringify({ error: "Cannot change role. Please contact support." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Allow user -> host/vendor (onboarding) or host/vendor -> user (downgrade)
      const { error: updateError } = await serviceSupabase
        .from("user_roles")
        .update({ role })
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Error updating role:", updateError.message);
        return new Response(
          JSON.stringify({ error: "Failed to update role" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Updated role: ${currentRole} -> ${role} for user ${user.id}`);
    } else {
      // New role assignment
      const { error: insertError } = await serviceSupabase
        .from("user_roles")
        .insert({ user_id: user.id, role });

      if (insertError) {
        console.error("Error inserting role:", insertError.message);
        return new Response(
          JSON.stringify({ error: "Failed to assign role" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Assigned role '${role}' to user ${user.id}`);
    }

    return new Response(
      JSON.stringify({ success: true, role }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error in assign-role:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
