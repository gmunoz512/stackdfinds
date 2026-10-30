import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { checkRateLimit, createRateLimitResponse } from "../_shared/rateLimit.ts";
import { corsHeadersFor } from "../_shared/http.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const getCorsHeaders = (origin: string | null) =>
  corsHeadersFor(new Request("https://stackd.local/", { headers: origin ? { origin } : {} }));

// SECURITY: Use crypto.getRandomValues() instead of Math.random()
function generateOTP(): string {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  // Generate a 6-digit number between 100000 and 999999
  return (100000 + (array[0] % 900000)).toString();
}

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

    // Rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               req.headers.get('x-real-ip') || 
               'unknown';
    
    const rateLimitResult = await checkRateLimit(
      supabaseAdmin,
      `otp:${ip}`,
      'send-reset-otp',
      { windowMinutes: 1, maxRequests: 3 }
    );

    if (!rateLimitResult.allowed) {
      console.log(`Rate limit exceeded for OTP request from IP: ${ip}`);
      return createRateLimitResponse(rateLimitResult.resetAt, corsHeaders);
    }

    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // SECURITY: Use targeted lookup instead of listUsers() to avoid loading all users
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserByEmail(email.toLowerCase());
    
    if (userError || !userData?.user) {
      // Don't reveal whether user exists
      console.log("User not found for email (or error):", email);
      return new Response(
        JSON.stringify({ success: true, message: "If an account exists, an OTP has been sent." }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Clean up expired OTPs first
    await supabaseAdmin.rpc('cleanup_expired_otps');

    // Delete any existing OTPs for this email
    await supabaseAdmin
      .from('password_reset_otps')
      .delete()
      .eq('email', email.toLowerCase());

    // Generate new OTP
    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    // Store OTP in database
    const { error: insertError } = await supabaseAdmin
      .from('password_reset_otps')
      .insert({
        email: email.toLowerCase(),
        otp_code: otpCode,
        expires_at: expiresAt.toISOString(),
        verified: false
      });

    if (insertError) {
      console.error("Error storing OTP:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to generate OTP" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`OTP generated for ${email}`);

    // Send OTP via email using Resend
    const emailResponse = await resend.emails.send({
      from: "Stackd <onboarding@resend.dev>",
      to: [email],
      subject: "Your Password Reset Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; text-align: center;">Password Reset</h1>
          <p style="color: #666; font-size: 16px;">You requested to reset your password. Use the code below to verify your identity:</p>
          <div style="background-color: #f5f5f5; padding: 30px; text-align: center; margin: 30px 0; border-radius: 8px;">
            <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #333;">${otpCode}</span>
          </div>
          <p style="color: #666; font-size: 14px;">This code will expire in 10 minutes.</p>
          <p style="color: #999; font-size: 12px;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });

    console.log("Email response:", emailResponse);

    if (emailResponse.error) {
      console.error("Resend error:", emailResponse.error);
      return new Response(
        JSON.stringify({ 
          error: emailResponse.error.message || "Failed to send email. Please verify your domain at resend.com/domains."
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "OTP sent to your email"
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
