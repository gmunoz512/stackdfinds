import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[BOOKING-REMINDERS] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Starting reminder check");

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Calculate the date range for 72 hours from now (with 1 hour buffer)
    const now = new Date();
    const reminderWindowStart = new Date(now.getTime() + 71 * 60 * 60 * 1000); // 71 hours
    const reminderWindowEnd = new Date(now.getTime() + 73 * 60 * 60 * 1000); // 73 hours

    // Format dates for comparison (YYYY-MM-DD)
    const startDate = reminderWindowStart.toISOString().split('T')[0];
    const endDate = reminderWindowEnd.toISOString().split('T')[0];

    logStep("Checking for bookings", { startDate, endDate });

    // Query bookings that need reminders
    const { data: bookings, error: queryError } = await supabaseAdmin
      .from("bookings")
      .select("*")
      .in("booking_date", [startDate, endDate])
      .eq("status", "confirmed")
      .is("reminder_sent_at", null);

    if (queryError) {
      logStep("Query error", { error: queryError.message });
      throw queryError;
    }

    logStep("Found bookings", { count: bookings?.length || 0 });

    if (!bookings || bookings.length === 0) {
      return new Response(JSON.stringify({ success: true, remindersCount: 0 }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let remindersSent = 0;

    for (const booking of bookings) {
      try {
        // Check if booking is within 72 hour window
        const bookingDateTime = new Date(`${booking.booking_date}T${booking.booking_time || '00:00'}:00`);
        const hoursUntilBooking = (bookingDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (hoursUntilBooking < 71 || hoursUntilBooking > 73) {
          logStep("Booking outside window", { bookingId: booking.id, hoursUntilBooking });
          continue;
        }

        // Get user email
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(booking.user_id);
        const guestEmail = userData?.user?.email;

        if (!guestEmail) {
          logStep("No email for user", { userId: booking.user_id });
          continue;
        }

        // Send reminder notification
        const reminderPayload = {
          type: "booking_reminder",
          guestEmail,
          experienceName: booking.experience_name,
          vendorName: booking.vendor_name,
          date: booking.booking_date,
          time: booking.booking_time,
          guests: booking.guests,
        };

        const response = await fetch(
          `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-admin-notification`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
            },
            body: JSON.stringify(reminderPayload),
          }
        );

        if (response.ok) {
          // Mark reminder as sent
          await supabaseAdmin
            .from("bookings")
            .update({ reminder_sent_at: new Date().toISOString() })
            .eq("id", booking.id);

          remindersSent++;
          logStep("Reminder sent", { bookingId: booking.id, guestEmail });
        } else {
          const errorText = await response.text();
          logStep("Reminder failed", { bookingId: booking.id, error: errorText });
        }
      } catch (bookingError) {
        const errorMsg = bookingError instanceof Error ? bookingError.message : String(bookingError);
        logStep("Error processing booking", { bookingId: booking.id, error: errorMsg });
      }
    }

    logStep("Completed", { remindersSent });

    return new Response(JSON.stringify({ success: true, remindersCount: remindersSent }), {
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
