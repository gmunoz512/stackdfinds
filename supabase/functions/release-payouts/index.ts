import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[RELEASE-PAYOUTS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Scheduler-only authorization: must present the shared cron secret.
  const cronSecret = Deno.env.get("CRON_SECRET");
  const providedSecret = req.headers.get("x-cron-secret");
  if (!cronSecret || !providedSecret || providedSecret !== cronSecret) {
    logStep("Unauthorized request - missing or invalid cron secret");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    logStep("Starting payout release check");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const now = new Date();

    // Get all confirmed bookings with held payouts
    // We fetch broadly and filter per-host based on trust score
    const cutoff7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const cutoffDate7 = cutoff7Days.toISOString().split('T')[0];

    logStep("Looking for bookings to release", { cutoffDate7, now: now.toISOString() });

    const { data: bookings, error: queryError } = await supabaseAdmin
      .from("bookings")
      .select("*")
      .eq("status", "confirmed")
      .eq("payout_status", "held")
      .lte("booking_date", cutoffDate7);

    if (queryError) {
      logStep("Query error", { error: queryError.message });
      throw queryError;
    }

    logStep("Found candidate bookings", { count: bookings?.length || 0 });

    if (!bookings || bookings.length === 0) {
      return new Response(JSON.stringify({ success: true, released: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cache host profiles to avoid repeated lookups
    const hostProfileCache = new Map<string, { host_trust_score: number; first_booking_completed_at: string | null }>();

    let released = 0;
    let errors = 0;
    let skipped = 0;

    for (const booking of bookings) {
      try {
        const bookingDateTime = new Date(`${booking.booking_date}T${booking.booking_time || '23:59'}:00`);
        const hoursSinceBooking = (now.getTime() - bookingDateTime.getTime()) / (1000 * 60 * 60);

        // All vendors are paid 24 hours after the event date
        const requiredHours = 24;

        if (hoursSinceBooking < requiredHours) {
          logStep("Skipping - delay not met", { 
            bookingId: booking.id, 
            hoursSinceBooking: Math.round(hoursSinceBooking), 
            requiredHours 
          });
          skipped++;
          continue;
        }

        // Atomically claim this booking: held -> processing.
        // If another concurrent run already claimed it, zero rows come back and we skip.
        const { data: claimed, error: claimError } = await supabaseAdmin
          .from("bookings")
          .update({ payout_status: "processing" })
          .eq("id", booking.id)
          .eq("payout_status", "held")
          .select("id");

        if (claimError) {
          logStep("Claim error", { bookingId: booking.id, error: claimError.message });
          errors++;
          continue;
        }

        if (!claimed || claimed.length === 0) {
          logStep("Skipping - already claimed by another run", { bookingId: booking.id });
          skipped++;
          continue;
        }

        logStep("Processing payout release", { bookingId: booking.id, hoursSinceBooking: Math.round(hoursSinceBooking) });

        const vendorPayoutCents = Math.round((booking.vendor_payout_amount || 0) * 100);
        const hostPayoutCents = Math.round((booking.host_payout_amount || 0) * 100);

        // Transfer to vendor
        if (vendorPayoutCents > 0 && booking.vendor_profile_id) {
          const { data: vendorProfile } = await supabaseAdmin
            .from("vendor_profiles")
            .select("stripe_account_id, stripe_onboarding_complete")
            .eq("id", booking.vendor_profile_id)
            .single();

          if (vendorProfile?.stripe_account_id && vendorProfile?.stripe_onboarding_complete) {
            const transfer = await stripe.transfers.create({
              amount: vendorPayoutCents,
              currency: booking.currency || "usd",
              destination: vendorProfile.stripe_account_id,
              transfer_group: booking.stripe_session_id || booking.id,
              metadata: { booking_id: booking.id, type: "vendor_payout" },
            }, {
              idempotencyKey: `booking:${booking.id}:vendor-payout`,
            });
            logStep("Vendor transfer created", { transferId: transfer.id, amount: vendorPayoutCents });
          } else {
            logStep("Vendor not set up for Stripe Connect, skipping vendor transfer", { bookingId: booking.id });
          }
        }

        // Transfer to host
        if (hostPayoutCents > 0 && booking.host_user_id) {
          const { data: hostProfile } = await supabaseAdmin
            .from("profiles")
            .select("stripe_account_id, stripe_onboarding_complete")
            .eq("user_id", booking.host_user_id)
            .single();

          if (hostProfile?.stripe_account_id && hostProfile?.stripe_onboarding_complete) {
            const transfer = await stripe.transfers.create({
              amount: hostPayoutCents,
              currency: booking.currency || "usd",
              destination: hostProfile.stripe_account_id,
              transfer_group: booking.stripe_session_id || booking.id,
              metadata: { booking_id: booking.id, type: "host_commission" },
            }, {
              idempotencyKey: `booking:${booking.id}:host-payout`,
            });
            logStep("Host transfer created", { transferId: transfer.id, amount: hostPayoutCents });
          } else {
            logStep("Host not set up for Stripe Connect, skipping host transfer", { bookingId: booking.id });
          }
        }

        // Keep booking completion and payout completion explicit. `paid` is the
        // terminal payout state; legacy `processed` rows remain readable.
        await supabaseAdmin
          .from("bookings")
          .update({ status: "completed", payout_status: "paid" })
          .eq("id", booking.id);

        logStep("Booking completed and payouts released", { bookingId: booking.id });
        released++;
      } catch (bookingError) {
        const errorMsg = bookingError instanceof Error ? bookingError.message : String(bookingError);
        logStep("Error processing booking", { bookingId: booking.id, error: errorMsg });
        
        await supabaseAdmin
          .from("bookings")
          .update({ payout_status: "failed" })
          .eq("id", booking.id);
        
        errors++;
      }
    }

    logStep("Completed", { released, errors, skipped, total: bookings.length });

    return new Response(JSON.stringify({ success: true, released, errors, skipped }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
