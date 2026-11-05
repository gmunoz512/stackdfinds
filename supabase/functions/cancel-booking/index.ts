import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CANCEL-BOOKING] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseClient.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;
    logStep("User authenticated", { userId });

    const { bookingId, reason, guestCancellation } = await req.json();
    logStep("Cancellation request received", { bookingId, reason, guestCancellation, userId });

    if (!bookingId) {
      throw new Error("Booking ID is required");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { data: booking, error: bookingError } = await supabaseAdmin
      .from("bookings")
      .select("*, vendor_profiles(user_id)")
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      throw new Error("Booking not found");
    }

    // Authorization check
    const isBookingOwner = booking.user_id === userId;
    const isVendor = booking.vendor_profiles?.user_id === userId;
    const isHost = booking.host_user_id === userId;

    if (!isBookingOwner && !isVendor && !isHost) {
      return new Response(
        JSON.stringify({ error: "You are not authorized to cancel this booking" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (booking.status === "cancelled" || booking.status === "refunded") {
      return new Response(JSON.stringify({ success: true, message: "Booking already cancelled" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check cancellation window for guest-initiated cancellations
    if (guestCancellation && isBookingOwner && booking.vendor_profile_id) {
      const { data: vendorProfile } = await supabaseAdmin
        .from("vendor_profiles")
        .select("cancellation_hours, name")
        .eq("id", booking.vendor_profile_id)
        .single();

      const cancellationHours = vendorProfile?.cancellation_hours ?? 24;
      const bookingDateTime = new Date(`${booking.booking_date}T${booking.booking_time || '00:00'}:00`);
      const now = new Date();
      const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

      logStep("Checking cancellation window", { hoursUntilBooking, cancellationHours });

      if (hoursUntilBooking < cancellationHours) {
        const message = `Cancellation is not allowed within ${cancellationHours} hours of the booking. Your booking is in ${Math.max(0, Math.floor(hoursUntilBooking))} hours.`;
        return new Response(JSON.stringify({ 
          success: false, 
          error: "CANCELLATION_WINDOW_EXPIRED",
          message,
          cancellationHours,
          hoursUntilBooking: Math.floor(hoursUntilBooking)
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ESCROW REFUND: If funds are held (payout_status = "held"), issue a Stripe refund
    let refundId: string | null = null;
    if (booking.payout_status === "held" && booking.stripe_payment_intent_id) {
      try {
        const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
        if (stripeKey) {
          const stripe = new Stripe(stripeKey, {
            apiVersion: "2025-08-27.basil",
          });

          const refund = await stripe.refunds.create({
            payment_intent: booking.stripe_payment_intent_id,
            reason: "requested_by_customer",
          });
          refundId = refund.id;
          logStep("Stripe refund issued", { refundId: refund.id, amount: refund.amount });
        }
      } catch (refundError) {
        const errorMsg = refundError instanceof Error ? refundError.message : String(refundError);
        logStep("Stripe refund failed", { error: errorMsg });
        // Continue with cancellation even if refund fails - admin can handle manually
      }
    }

    // Update booking status
    const { error: updateError } = await supabaseAdmin
      .from("bookings")
      .update({ 
        status: refundId ? "refunded" : "cancelled",
        payment_status: refundId ? "refunded" : undefined,
        payout_status: refundId ? "refunded" : booking.payout_status,
      })
      .eq("id", bookingId);

    if (updateError) {
      throw updateError;
    }

    logStep("Booking cancelled", { bookingId, refundId, cancelledBy: userId });

    // Send notifications
    const { data: guestUserData } = await supabaseAdmin.auth.admin.getUserById(booking.user_id);
    const guestEmail = guestUserData?.user?.email;

    let vendorEmail: string | null = null;
    if (booking.vendor_profile_id) {
      const { data: vendorProfile } = await supabaseAdmin
        .from("vendor_profiles")
        .select("user_id")
        .eq("id", booking.vendor_profile_id)
        .single();

      if (vendorProfile?.user_id) {
        const { data: vendorUserData } = await supabaseAdmin.auth.admin.getUserById(vendorProfile.user_id);
        vendorEmail = vendorUserData?.user?.email || null;
      }
    }

    // Guest cancellation notification
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
              type: "guest_cancellation",
              guestEmail,
              experienceName: booking.experience_name,
              vendorName: booking.vendor_name,
              date: booking.booking_date,
              time: booking.booking_time,
              guests: booking.guests,
              totalAmount: booking.total_amount,
              currency: booking.currency,
              reason: reason || "No reason provided",
              refunded: !!refundId,
            }),
          }
        );
        logStep("Guest cancellation email sent");
      } catch (error) {
        logStep("Guest cancellation email failed", { error: String(error) });
      }
    }

    // Vendor cancellation notification
    if (vendorEmail) {
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
              type: "vendor_cancellation",
              vendorEmail,
              guestEmail,
              experienceName: booking.experience_name,
              date: booking.booking_date,
              time: booking.booking_time,
              guests: booking.guests,
              totalAmount: booking.total_amount,
              vendorPayoutAmount: booking.vendor_payout_amount,
              currency: booking.currency,
              reason: reason || "No reason provided",
            }),
          }
        );
        logStep("Vendor cancellation email sent");
      } catch (error) {
        logStep("Vendor cancellation email failed", { error: String(error) });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: refundId ? "Booking cancelled and refund issued" : "Booking cancelled",
      refunded: !!refundId,
    }), {
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
