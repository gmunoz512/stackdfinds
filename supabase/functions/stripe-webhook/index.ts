import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Webhook received");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    
    if (!webhookSecret) {
      logStep("STRIPE_WEBHOOK_SECRET not configured — rejecting request");
      return new Response(JSON.stringify({ error: "Webhook not configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      logStep("Missing stripe-signature header — rejecting request");
      return new Response(JSON.stringify({ error: "Missing signature" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      logStep("Webhook signature verified");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logStep("Webhook signature verification failed", { error: errorMessage });
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    logStep("Event type", { type: event.type });

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      logStep("Processing checkout session", { sessionId: session.id });

      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
        { auth: { persistSession: false } }
      );

      const metadata = session.metadata || {};
      const vendorId = metadata.vendor_id;
      const experienceName = metadata.experience_name || "Experience";
      const vendorName = metadata.vendor_name || null;
      const bookingDate = metadata.date || "";
      const bookingTime = metadata.time || "";
      const guests = parseInt(metadata.guests || "1", 10);
      const userId = metadata.user_id;
      const hostUserId = metadata.host_user_id || null;
      const isEscrow = metadata.escrow === "true";
      
      const platformFeeCents = parseInt(metadata.platform_fee_cents || "0", 10);
      const vendorPayoutCents = parseInt(metadata.vendor_payout_cents || "0", 10);
      const hostPayoutCents = parseInt(metadata.host_payout_cents || "0", 10);

      logStep("Session metadata", { 
        vendorId, experienceName, bookingDate, bookingTime, guests, userId,
        platformFeeCents, vendorPayoutCents, hostPayoutCents, hostUserId, isEscrow
      });

      if (!userId) {
        logStep("No user_id in metadata, skipping booking creation");
        return new Response(JSON.stringify({ received: true, skipped: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // Idempotency check
      const { data: existingBooking } = await supabaseAdmin
        .from("bookings")
        .select("id")
        .eq("stripe_session_id", session.id)
        .single();

      if (existingBooking) {
        logStep("Booking already exists", { bookingId: existingBooking.id });
        return new Response(JSON.stringify({ received: true, duplicate: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      // ESCROW: booking status = "confirmed", payout_status = "held"
      // Funds stay on platform until release-payouts runs 24h after experience
      const { data: booking, error: insertError } = await supabaseAdmin
        .from("bookings")
        .insert({
          user_id: userId,
          vendor_profile_id: vendorId || null,
          stripe_session_id: session.id,
          stripe_payment_intent_id: session.payment_intent as string,
          experience_name: experienceName,
          vendor_name: vendorName,
          booking_date: bookingDate,
          booking_time: bookingTime,
          guests: guests,
          total_amount: (session.amount_total || 0) / 100,
          currency: session.currency || "usd",
          status: "confirmed",
          payment_status: "paid",
          vendor_payout_amount: vendorPayoutCents / 100,
          host_payout_amount: hostPayoutCents / 100,
          platform_fee_amount: platformFeeCents / 100,
          payout_status: "held",
          host_user_id: hostUserId || null,
        })
        .select()
        .single();

      if (insertError) {
        logStep("Failed to insert booking", { error: insertError.message });
        throw insertError;
      }

      logStep("Booking created (ESCROW - confirmed, funds held)", { bookingId: booking.id });

      // Send notifications (same as before)
      const { data: userDataAuth } = await supabaseAdmin.auth.admin.getUserById(userId);
      const guestEmail = userDataAuth?.user?.email || metadata.guest_email;

      // Admin notification
      try {
        await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-admin-notification`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify({
              type: "booking",
              experienceName,
              vendorName,
              guestEmail,
              date: bookingDate,
              time: bookingTime,
              guests,
              totalAmount: (session.amount_total || 0) / 100,
              currency: session.currency || "usd",
              promoCode: metadata.promo_code || null,
              discountAmount: metadata.discount_amount ? parseFloat(metadata.discount_amount) : null,
              originalAmount: metadata.original_amount ? parseFloat(metadata.original_amount) : null,
            }),
          }
        );
        logStep("Admin notification sent");
      } catch (notifError) {
        logStep("Admin notification error", { error: String(notifError) });
      }

      // Vendor notification
      if (vendorId) {
        try {
          const { data: vendorProfile } = await supabaseAdmin
            .from("vendor_profiles")
            .select("user_id")
            .eq("id", vendorId)
            .single();

          if (vendorProfile?.user_id) {
            const { data: vendorUserData } = await supabaseAdmin.auth.admin.getUserById(vendorProfile.user_id);
            const vendorEmail = vendorUserData?.user?.email;

            if (vendorEmail) {
              await fetch(
                `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-admin-notification`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                  },
                  body: JSON.stringify({
                    type: "vendor_booking",
                    vendorEmail,
                    experienceName,
                    guestEmail,
                    date: bookingDate,
                    time: bookingTime,
                    guests,
                    totalAmount: (session.amount_total || 0) / 100,
                    vendorPayoutAmount: vendorPayoutCents / 100,
                    currency: session.currency || "usd",
                  }),
                }
              );
              logStep("Vendor notification sent", { vendorEmail });
            }
          }
        } catch (vendorNotifError) {
          logStep("Vendor notification error", { error: String(vendorNotifError) });
        }
      }

      // Guest confirmation email
      if (guestEmail) {
        try {
          await fetch(
            `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-admin-notification`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
              },
              body: JSON.stringify({
                type: "guest_confirmation",
                guestEmail,
                guestName: metadata.guest_name || null,
                experienceName,
                vendorName,
                date: bookingDate,
                time: bookingTime,
                guests,
                totalAmount: (session.amount_total || 0) / 100,
                currency: session.currency || "usd",
                promoCode: metadata.promo_code || null,
                discountAmount: metadata.discount_amount ? parseFloat(metadata.discount_amount) : null,
                originalAmount: metadata.original_amount ? parseFloat(metadata.original_amount) : null,
              }),
            }
          );
          logStep("Guest confirmation email sent", { guestEmail });
        } catch (guestNotifError) {
          logStep("Guest confirmation email error", { error: String(guestNotifError) });
        }
      }

      // Host commission notification (funds held, will be released later)
      if (hostUserId && hostPayoutCents > 0) {
        const { data: hostUserData } = await supabaseAdmin.auth.admin.getUserById(hostUserId);
        const hostEmail = hostUserData?.user?.email;

        if (hostEmail) {
          try {
            await fetch(
              `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-admin-notification`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                },
                body: JSON.stringify({
                  type: "host_commission",
                  hostEmail,
                  experienceName,
                  vendorName,
                  date: bookingDate,
                  time: bookingTime,
                  guests,
                  totalAmount: (session.amount_total || 0) / 100,
                  hostPayoutAmount: hostPayoutCents / 100,
                  currency: session.currency || "usd",
                }),
              }
            );
            logStep("Host commission notification sent", { hostEmail });
          } catch (hostNotifError) {
            logStep("Host commission notification error", { error: String(hostNotifError) });
          }
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
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
