import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CHECK-CONNECT-STATUS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const { accountType } = await req.json(); // 'vendor' or 'host'

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    let stripeAccountId: string | null = null;

    if (accountType === 'vendor') {
      const { data: vendorProfile } = await supabaseAdmin
        .from("vendor_profiles")
        .select("stripe_account_id")
        .eq("user_id", user.id)
        .single();
      stripeAccountId = vendorProfile?.stripe_account_id;
    } else {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("stripe_account_id")
        .eq("user_id", user.id)
        .single();
      stripeAccountId = profile?.stripe_account_id;
    }

    if (!stripeAccountId) {
      return new Response(JSON.stringify({ 
        connected: false, 
        onboardingComplete: false 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const account = await stripe.accounts.retrieve(stripeAccountId);

    const isComplete = account.details_submitted && account.payouts_enabled;
    logStep("Account status", { 
      accountId: stripeAccountId, 
      detailsSubmitted: account.details_submitted,
      payoutsEnabled: account.payouts_enabled,
      isComplete 
    });

    // Update database if onboarding is complete
    if (isComplete) {
      if (accountType === 'vendor') {
        await supabaseAdmin
          .from("vendor_profiles")
          .update({ stripe_onboarding_complete: true })
          .eq("user_id", user.id);
      } else {
        await supabaseAdmin
          .from("profiles")
          .update({ stripe_onboarding_complete: true })
          .eq("user_id", user.id);
      }
    }

    return new Response(JSON.stringify({ 
      connected: true, 
      onboardingComplete: isComplete,
      accountId: stripeAccountId
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
