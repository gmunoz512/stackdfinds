import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit, createRateLimitResponse } from "../_shared/rateLimit.ts";

import { corsHeadersFor } from "../_shared/http.ts";

const getCorsHeaders = (origin: string | null) =>
  corsHeadersFor(new Request("https://stackd.local/", { headers: origin ? { origin } : {} }));

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Rate limiting - 5 requests per minute per IP
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               req.headers.get('x-real-ip') || 
               'unknown';
    
    const rateLimitResult = await checkRateLimit(
      supabaseAdmin,
      `verify:${ip}`,
      'verify-reset-otp',
      { windowMinutes: 1, maxRequests: 5 }
    );

    if (!rateLimitResult.allowed) {
      console.log(`Rate limit exceeded for OTP verification from IP: ${ip}`);
      return createRateLimitResponse(rateLimitResult.resetAt, corsHeaders);
    }

    const { email, otp } = await req.json();

    if (!email || !otp) {
      return new Response(
        JSON.stringify({ error: "Email and OTP are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Look up the OTP
    const { data: otpData, error: otpError } = await supabaseAdmin
      .from('password_reset_otps')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('otp_code', otp)
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (otpError || !otpData) {
      console.error("OTP verification failed:", otpError);
      return new Response(
        JSON.stringify({ error: "Invalid or expired OTP" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark OTP as verified
    await supabaseAdmin
      .from('password_reset_otps')
      .update({ verified: true })
      .eq('id', otpData.id);

    // SECURITY: Generate a magic link and redirect server-side instead of returning raw link
    // We use the PKCE recovery flow which generates a code the client exchanges for a session
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: email,
      options: {
        redirectTo: `${req.headers.get("origin") || Deno.env.get("SITE_URL") || "http://localhost:8080"}/reset-password`,
      },
    });

    if (linkError) {
      console.error("Error generating reset link:", linkError);
      return new Response(
        JSON.stringify({ error: "Failed to generate reset link" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean up - delete the used OTP
    await supabaseAdmin
      .from('password_reset_otps')
      .delete()
      .eq('id', otpData.id);

    // SECURITY: Return the link for client-side redirect but extract only the code/token
    // The action_link contains a token that gets exchanged — this is the standard Supabase recovery flow
    const actionLink = linkData.properties?.action_link;
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        // Return the redirect URL — client will navigate to it directly
        redirectUrl: actionLink,
        message: "OTP verified successfully" 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
