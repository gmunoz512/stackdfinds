import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-BOOKING-CHECKOUT] ${step}${detailsStr}`);
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

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { 
      experienceName, 
      vendorName, 
      date, 
      time, 
      guests, 
      totalPrice,
      originalPrice,
      vendorId,
      hostId,
      promoCode,
      discountAmount
    } = await req.json();

    logStep("Booking details received", { experienceName, vendorName, date, time, guests, totalPrice, vendorId, hostId });

    if (!experienceName || !guests || guests <= 0) {
      throw new Error("Invalid booking details");
    }

    // Get vendor profile with commission settings AND price
    const { data: vendorProfile, error: vendorError } = await supabaseAdmin
      .from("vendor_profiles")
      .select("stripe_account_id, stripe_onboarding_complete, commission_percentage, price_per_person, name")
      .eq("id", vendorId)
      .single();

    if (vendorError || !vendorProfile) {
      throw new Error("Vendor not found");
    }

    logStep("Vendor profile fetched", { id: vendorId, name: vendorProfile.name, price: vendorProfile.price_per_person });

    // SECURITY: Calculate total price server-side
    let calculatedTotal = (vendorProfile.price_per_person || 0) * guests;
    let finalDiscountAmount = 0;

    if (promoCode) {
      const { data: promoData, error: promoError } = await supabaseAdmin.rpc('validate_promo_code', {
        p_code: promoCode,
        p_order_amount: calculatedTotal
      });
      
      if (!promoError && promoData && promoData.length > 0 && promoData[0].valid) {
        finalDiscountAmount = Number(promoData[0].discount_amount);
        logStep("Promo code applied", { code: promoCode, discount: finalDiscountAmount });
      }
    }

    const finalAmountToCharge = Math.max(0, calculatedTotal - finalDiscountAmount);

    logStep("Price calculation", { 
      basePrice: vendorProfile.price_per_person, 
      guests, 
      subtotal: calculatedTotal, 
      discount: finalDiscountAmount,
      finalCharge: finalAmountToCharge 
    });

    // Get platform fee percentage
    const { data: platformSettings } = await supabaseAdmin
      .from("platform_settings")
      .select("platform_fee_percentage")
      .single();

    const platformFeePercent = platformSettings?.platform_fee_percentage || 3;
    const hostCommissionPercent = vendorProfile?.commission_percentage || 0;

    // Validate host
    let validHostId: string | null = null;

    if (hostId) {
      const { data: hostVendorLink } = await supabaseAdmin
        .from("host_vendor_links")
        .select("id")
        .eq("host_user_id", hostId)
        .eq("vendor_profile_id", vendorId)
        .single();

      if (hostVendorLink) {
        validHostId = hostId;
        logStep("Host validated", { hostId });
      } else {
        logStep("Host not linked to this vendor", { hostId, vendorId });
      }
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    // Check if a Stripe customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Calculate payment splits
    const totalAmountCents = Math.round(finalAmountToCharge * 100);
    
    let platformFeeCents: number;
    let hostPayoutCents: number;
    
    if (validHostId) {
      platformFeeCents = Math.round(totalAmountCents * (platformFeePercent / 100));
      hostPayoutCents = Math.round(totalAmountCents * (hostCommissionPercent / 100));
    } else {
      platformFeeCents = Math.round(totalAmountCents * ((platformFeePercent + hostCommissionPercent) / 100));
      hostPayoutCents = 0;
    }
    
    const vendorPayoutCents = totalAmountCents - platformFeeCents - hostPayoutCents;

    logStep("Payment splits calculated (ESCROW)", {
      totalAmountCents,
      platformFeeCents,
      hostPayoutCents,
      vendorPayoutCents,
      hasValidHost: !!validHostId
    });

    const origin = req.headers.get("origin") || "http://localhost:5173";
    
    // ESCROW: Platform holds ALL funds. No transfer_data.destination.
    // Transfers to vendor and host are created by release-payouts after experience completes.
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: experienceName,
              description: `${vendorName} - ${date} at ${time} for ${guests} guest${guests > 1 ? 's' : ''}`,
            },
            unit_amount: totalAmountCents,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/booking/${vendorId}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/vendor/${vendorId}/payment`,
      metadata: {
        vendor_id: vendorId,
        vendor_name: vendorProfile.name,
        experience_name: experienceName,
        date: date,
        time: time,
        guests: guests.toString(),
        user_id: user.id,
        guest_email: user.email,
        host_user_id: validHostId || "",
        platform_fee_cents: platformFeeCents.toString(),
        vendor_payout_cents: vendorPayoutCents.toString(),
        host_payout_cents: hostPayoutCents.toString(),
        promo_code: promoCode || "",
        discount_amount: finalDiscountAmount.toString(),
        original_amount: calculatedTotal.toString(),
        escrow: "true",
      },
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);

    logStep("Checkout session created (ESCROW mode)", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
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