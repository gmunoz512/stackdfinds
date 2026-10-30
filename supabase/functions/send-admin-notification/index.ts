import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface BookingNotification {
  type: "booking" | "promo_used" | "vendor_booking" | "guest_confirmation" | "booking_reminder" | "host_commission" | "guest_cancellation" | "vendor_cancellation" | "vendor_submitted_for_review" | "vendor_approved" | "vendor_rejected" | "vendor_changes_requested";
  experienceName?: string;
  vendorName?: string;
  vendorEmail?: string;
  vendorId?: string;
  hostEmail?: string;
  guestEmail?: string;
  guestName?: string;
  date?: string;
  time?: string;
  guests?: number;
  totalAmount?: number;
  vendorPayoutAmount?: number;
  hostPayoutAmount?: number;
  currency?: string;
  promoCode?: string;
  discountAmount?: number;
  originalAmount?: number;
  reason?: string;
  verificationNotes?: string;
}

const ADMIN_EMAIL = "admin@stackd.app"; // Change this to actual admin email

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // SECURITY: Only allow calls with the service role key (internal function-to-function calls)
  const authHeader = req.headers.get("Authorization");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  if (!authHeader || !serviceRoleKey || authHeader !== `Bearer ${serviceRoleKey}`) {
    console.error("[ADMIN-NOTIFICATION] Unauthorized access attempt");
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    const notification: BookingNotification = await req.json();
    console.log("[ADMIN-NOTIFICATION] Received:", notification);

    let subject: string;
    let htmlContent: string;

    if (notification.type === "booking") {
      subject = `🎉 New Booking: ${notification.experienceName}`;
      htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #f97316; margin-bottom: 20px;">New Booking Received!</h1>
          
          <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <h2 style="margin: 0 0 15px 0; color: #1e293b;">${notification.experienceName}</h2>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Vendor</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600;">${notification.vendorName || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Guest Email</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600;">${notification.guestEmail || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Date</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600;">${notification.date}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Time</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600;">${notification.time}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Guests</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600;">${notification.guests}</td>
              </tr>
              ${notification.promoCode ? `
              <tr>
                <td style="padding: 8px 0; color: #16a34a;">Promo Code Used</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #16a34a;">${notification.promoCode} (-$${notification.discountAmount?.toFixed(2)})</td>
              </tr>
              ` : ''}
              <tr style="border-top: 2px solid #e2e8f0;">
                <td style="padding: 12px 0; font-weight: 600; font-size: 18px;">Total</td>
                <td style="padding: 12px 0; text-align: right; font-weight: 700; font-size: 18px; color: #f97316;">$${notification.totalAmount?.toFixed(2)} ${notification.currency?.toUpperCase()}</td>
              </tr>
            </table>
          </div>
          
          <p style="color: #64748b; font-size: 14px;">This is an automated notification from Stackd.</p>
        </div>
      `;
    } else if (notification.type === "promo_used") {
      subject = `🏷️ Promo Code Used: ${notification.promoCode}`;
      htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #16a34a; margin-bottom: 20px;">Promo Code Used!</h1>
          
          <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #bbf7d0;">
            <h2 style="margin: 0 0 15px 0; color: #166534;">${notification.promoCode}</h2>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Experience</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600;">${notification.experienceName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Guest Email</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600;">${notification.guestEmail || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Original Amount</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600;">$${notification.originalAmount?.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #16a34a;">Discount Applied</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #16a34a;">-$${notification.discountAmount?.toFixed(2)}</td>
              </tr>
              <tr style="border-top: 2px solid #bbf7d0;">
                <td style="padding: 12px 0; font-weight: 600; font-size: 18px;">Final Amount</td>
                <td style="padding: 12px 0; text-align: right; font-weight: 700; font-size: 18px; color: #f97316;">$${notification.totalAmount?.toFixed(2)}</td>
              </tr>
            </table>
          </div>
          
          <p style="color: #64748b; font-size: 14px;">This is an automated notification from Stackd.</p>
        </div>
      `;
    } else if (notification.type === "vendor_booking") {
      // Vendor notification - send to vendor email
      subject = `🎉 New Booking for ${notification.experienceName}!`;
      htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #f97316; margin-bottom: 20px;">You Have a New Booking!</h1>
          
          <div style="background: #fff7ed; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #fed7aa;">
            <h2 style="margin: 0 0 15px 0; color: #1e293b;">${notification.experienceName}</h2>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Guest Email</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600;">${notification.guestEmail || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Date</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600;">${notification.date}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Time</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600;">${notification.time}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Guests</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600;">${notification.guests}</td>
              </tr>
              <tr style="border-top: 2px solid #fed7aa;">
                <td style="padding: 12px 0; font-weight: 600; font-size: 18px;">Your Payout</td>
                <td style="padding: 12px 0; text-align: right; font-weight: 700; font-size: 18px; color: #16a34a;">$${notification.vendorPayoutAmount?.toFixed(2)} ${notification.currency?.toUpperCase()}</td>
              </tr>
            </table>
          </div>
          
          <p style="color: #64748b; font-size: 14px;">Please reach out to the guest to confirm any additional details.</p>
          <p style="color: #64748b; font-size: 14px;">This is an automated notification from Stackd.</p>
        </div>
      `;

      const vendorEmailResponse = await resend.emails.send({
        from: "Stackd <notifications@resend.dev>",
        to: [notification.vendorEmail!],
        subject,
        html: htmlContent,
      });

      console.log("[ADMIN-NOTIFICATION] Vendor email sent:", vendorEmailResponse);

      return new Response(JSON.stringify({ success: true, emailResponse: vendorEmailResponse }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    } else if (notification.type === "guest_confirmation") {
      // Guest confirmation email
      subject = `✅ Booking Confirmed: ${notification.experienceName}`;
      htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #16a34a; margin-bottom: 10px;">🎉 Booking Confirmed!</h1>
            <p style="color: #64748b; font-size: 16px; margin: 0;">Thank you for your booking${notification.guestName ? `, ${notification.guestName}` : ''}!</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%); border-radius: 16px; padding: 24px; margin-bottom: 20px; border: 1px solid #bbf7d0;">
            <h2 style="margin: 0 0 20px 0; color: #1e293b; font-size: 22px;">${notification.experienceName}</h2>
            
            <div style="display: flex; align-items: center; margin-bottom: 16px;">
              <span style="font-size: 24px; margin-right: 12px;">📅</span>
              <div>
                <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Date & Time</p>
                <p style="margin: 4px 0 0 0; font-weight: 600; font-size: 16px; color: #1e293b;">${notification.date} at ${notification.time}</p>
              </div>
            </div>
            
            <div style="display: flex; align-items: center; margin-bottom: 16px;">
              <span style="font-size: 24px; margin-right: 12px;">👥</span>
              <div>
                <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Guests</p>
                <p style="margin: 4px 0 0 0; font-weight: 600; font-size: 16px; color: #1e293b;">${notification.guests} ${notification.guests === 1 ? 'person' : 'people'}</p>
              </div>
            </div>
            
            ${notification.vendorName ? `
            <div style="display: flex; align-items: center; margin-bottom: 16px;">
              <span style="font-size: 24px; margin-right: 12px;">🏢</span>
              <div>
                <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Hosted By</p>
                <p style="margin: 4px 0 0 0; font-weight: 600; font-size: 16px; color: #1e293b;">${notification.vendorName}</p>
              </div>
            </div>
            ` : ''}
          </div>
          
          <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 15px 0; color: #1e293b;">Payment Summary</h3>
            <table style="width: 100%; border-collapse: collapse;">
              ${notification.promoCode ? `
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Original Price</td>
                <td style="padding: 8px 0; text-align: right; text-decoration: line-through; color: #94a3b8;">$${notification.originalAmount?.toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #16a34a;">Promo Code (${notification.promoCode})</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #16a34a;">-$${notification.discountAmount?.toFixed(2)}</td>
              </tr>
              ` : ''}
              <tr style="border-top: 2px solid #e2e8f0;">
                <td style="padding: 12px 0; font-weight: 700; font-size: 18px; color: #1e293b;">Total Paid</td>
                <td style="padding: 12px 0; text-align: right; font-weight: 700; font-size: 18px; color: #f97316;">$${notification.totalAmount?.toFixed(2)} ${notification.currency?.toUpperCase()}</td>
              </tr>
            </table>
          </div>
          
          <div style="background: #fffbeb; border-radius: 12px; padding: 16px; margin-bottom: 20px; border: 1px solid #fde68a;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>💡 Important:</strong> Please arrive 10-15 minutes before your scheduled time. If you need to make any changes, contact the vendor directly.
            </p>
          </div>
          
          <p style="color: #64748b; font-size: 14px; text-align: center;">We hope you have an amazing experience!</p>
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">This is an automated confirmation from Stackd.</p>
        </div>
      `;

      const guestEmailResponse = await resend.emails.send({
        from: "Stackd <notifications@resend.dev>",
        to: [notification.guestEmail!],
        subject,
        html: htmlContent,
      });

      console.log("[ADMIN-NOTIFICATION] Guest confirmation email sent:", guestEmailResponse);

      return new Response(JSON.stringify({ success: true, emailResponse: guestEmailResponse }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    } else if (notification.type === "booking_reminder") {
      // Booking reminder email - 72 hours before
      subject = `⏰ Reminder: ${notification.experienceName} in 3 Days!`;
      htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #f97316; margin-bottom: 10px;">⏰ Your Experience is Coming Up!</h1>
            <p style="color: #64748b; font-size: 16px; margin: 0;">Just a friendly reminder about your upcoming booking.</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border-radius: 16px; padding: 24px; margin-bottom: 20px; border: 1px solid #fed7aa;">
            <h2 style="margin: 0 0 20px 0; color: #1e293b; font-size: 22px;">${notification.experienceName}</h2>
            
            <div style="background: white; border-radius: 12px; padding: 16px; margin-bottom: 16px;">
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <span style="font-size: 24px; margin-right: 12px;">📅</span>
                <div>
                  <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Date</p>
                  <p style="margin: 4px 0 0 0; font-weight: 600; font-size: 18px; color: #1e293b;">${notification.date}</p>
                </div>
              </div>
              
              <div style="display: flex; align-items: center; margin-bottom: 12px;">
                <span style="font-size: 24px; margin-right: 12px;">🕐</span>
                <div>
                  <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Time</p>
                  <p style="margin: 4px 0 0 0; font-weight: 600; font-size: 18px; color: #1e293b;">${notification.time}</p>
                </div>
              </div>
              
              <div style="display: flex; align-items: center;">
                <span style="font-size: 24px; margin-right: 12px;">👥</span>
                <div>
                  <p style="margin: 0; color: #64748b; font-size: 12px; text-transform: uppercase;">Guests</p>
                  <p style="margin: 4px 0 0 0; font-weight: 600; font-size: 18px; color: #1e293b;">${notification.guests} ${notification.guests === 1 ? 'person' : 'people'}</p>
                </div>
              </div>
            </div>
            
            ${notification.vendorName ? `
            <p style="margin: 0; color: #64748b; font-size: 14px;">Hosted by <strong style="color: #1e293b;">${notification.vendorName}</strong></p>
            ` : ''}
          </div>
          
          <div style="background: #f0f9ff; border-radius: 12px; padding: 16px; margin-bottom: 20px; border: 1px solid #bae6fd;">
            <h3 style="margin: 0 0 12px 0; color: #0369a1; font-size: 16px;">📋 Quick Checklist</h3>
            <ul style="margin: 0; padding-left: 20px; color: #1e293b;">
              <li style="margin-bottom: 8px;">Arrive 10-15 minutes early</li>
              <li style="margin-bottom: 8px;">Check any specific requirements from the vendor</li>
              <li style="margin-bottom: 8px;">Bring appropriate attire/gear if needed</li>
              <li>Have your confirmation email ready</li>
            </ul>
          </div>
          
          <p style="color: #64748b; font-size: 14px; text-align: center;">We're excited for your upcoming experience! 🎉</p>
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">This is an automated reminder from Stackd.</p>
        </div>
      `;

      const reminderEmailResponse = await resend.emails.send({
        from: "Stackd <notifications@resend.dev>",
        to: [notification.guestEmail!],
        subject,
        html: htmlContent,
      });

      console.log("[ADMIN-NOTIFICATION] Booking reminder email sent:", reminderEmailResponse);

      return new Response(JSON.stringify({ success: true, emailResponse: reminderEmailResponse }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    } else if (notification.type === "host_commission") {
      // Host commission notification
      subject = `💰 You Earned a Commission: ${notification.experienceName}`;
      htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #16a34a; margin-bottom: 10px;">💰 Commission Earned!</h1>
            <p style="color: #64748b; font-size: 16px; margin: 0;">Great news! You've earned a referral commission from a booking.</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 16px; padding: 24px; margin-bottom: 20px; border: 1px solid #86efac;">
            <div style="text-align: center; margin-bottom: 20px;">
              <p style="margin: 0; color: #64748b; font-size: 14px; text-transform: uppercase;">Your Commission</p>
              <p style="margin: 8px 0 0 0; font-weight: 700; font-size: 36px; color: #16a34a;">$${notification.hostPayoutAmount?.toFixed(2)}</p>
              <p style="margin: 4px 0 0 0; color: #64748b; font-size: 14px;">${notification.currency?.toUpperCase()}</p>
            </div>
          </div>
          
          <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <h3 style="margin: 0 0 15px 0; color: #1e293b;">Booking Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Experience</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600;">${notification.experienceName}</td>
              </tr>
              ${notification.vendorName ? `
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Vendor</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600;">${notification.vendorName}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Date</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600;">${notification.date}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Time</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600;">${notification.time}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Guests</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600;">${notification.guests}</td>
              </tr>
              <tr style="border-top: 2px solid #e2e8f0;">
                <td style="padding: 12px 0; color: #64748b;">Total Booking Amount</td>
                <td style="padding: 12px 0; text-align: right; font-weight: 600;">$${notification.totalAmount?.toFixed(2)}</td>
              </tr>
            </table>
          </div>
          
          <div style="background: #fffbeb; border-radius: 12px; padding: 16px; margin-bottom: 20px; border: 1px solid #fde68a;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>💡 Note:</strong> Your commission will be transferred to your connected Stripe account. Make sure your payment settings are up to date.
            </p>
          </div>
          
          <p style="color: #64748b; font-size: 14px; text-align: center;">Thank you for being a valued host partner! 🎉</p>
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">This is an automated notification from Stackd.</p>
        </div>
      `;

      const hostEmailResponse = await resend.emails.send({
        from: "Stackd <notifications@resend.dev>",
        to: [notification.hostEmail!],
        subject,
        html: htmlContent,
      });

      console.log("[ADMIN-NOTIFICATION] Host commission email sent:", hostEmailResponse);

      return new Response(JSON.stringify({ success: true, emailResponse: hostEmailResponse }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    } else if (notification.type === "guest_cancellation") {
      // Guest cancellation notification
      subject = `❌ Booking Cancelled: ${notification.experienceName}`;
      htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #dc2626; margin-bottom: 10px;">❌ Booking Cancelled</h1>
            <p style="color: #64748b; font-size: 16px; margin: 0;">We're sorry to inform you that your booking has been cancelled.</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-radius: 16px; padding: 24px; margin-bottom: 20px; border: 1px solid #fecaca;">
            <h2 style="margin: 0 0 20px 0; color: #1e293b; font-size: 22px;">${notification.experienceName}</h2>
            
            <table style="width: 100%; border-collapse: collapse;">
              ${notification.vendorName ? `
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Vendor</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600;">${notification.vendorName}</td>
              </tr>
              ` : ''}
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Date</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600;">${notification.date}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Time</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600;">${notification.time}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Guests</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600;">${notification.guests}</td>
              </tr>
              <tr style="border-top: 2px solid #fecaca;">
                <td style="padding: 12px 0; font-weight: 600; font-size: 16px;">Amount</td>
                <td style="padding: 12px 0; text-align: right; font-weight: 600; font-size: 16px;">$${notification.totalAmount?.toFixed(2)} ${notification.currency?.toUpperCase()}</td>
              </tr>
            </table>
          </div>
          
          ${notification.reason ? `
          <div style="background: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
            <p style="margin: 0; color: #64748b; font-size: 14px;"><strong>Reason:</strong> ${notification.reason}</p>
          </div>
          ` : ''}
          
          <div style="background: #fffbeb; border-radius: 12px; padding: 16px; margin-bottom: 20px; border: 1px solid #fde68a;">
            <p style="margin: 0; color: #92400e; font-size: 14px;">
              <strong>💰 Refund:</strong> If you paid for this booking, a refund will be processed to your original payment method within 5-10 business days.
            </p>
          </div>
          
          <p style="color: #64748b; font-size: 14px; text-align: center;">We hope to see you again soon!</p>
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">This is an automated notification from Stackd.</p>
        </div>
      `;

      const guestCancelEmailResponse = await resend.emails.send({
        from: "Stackd <notifications@resend.dev>",
        to: [notification.guestEmail!],
        subject,
        html: htmlContent,
      });

      console.log("[ADMIN-NOTIFICATION] Guest cancellation email sent:", guestCancelEmailResponse);

      return new Response(JSON.stringify({ success: true, emailResponse: guestCancelEmailResponse }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    } else if (notification.type === "vendor_cancellation") {
      // Vendor cancellation notification
      subject = `⚠️ Booking Cancelled: ${notification.experienceName}`;
      htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #f97316; margin-bottom: 10px;">⚠️ Booking Cancelled</h1>
            <p style="color: #64748b; font-size: 16px; margin: 0;">A booking for your experience has been cancelled.</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border-radius: 16px; padding: 24px; margin-bottom: 20px; border: 1px solid #fed7aa;">
            <h2 style="margin: 0 0 20px 0; color: #1e293b; font-size: 22px;">${notification.experienceName}</h2>
            
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Guest</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600;">${notification.guestEmail || 'N/A'}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Date</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600;">${notification.date}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Time</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600;">${notification.time}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b;">Guests</td>
                <td style="padding: 8px 0; text-align: right; font-weight: 600;">${notification.guests}</td>
              </tr>
              <tr style="border-top: 2px solid #fed7aa;">
                <td style="padding: 12px 0; color: #dc2626; font-weight: 600; font-size: 16px;">Lost Payout</td>
                <td style="padding: 12px 0; text-align: right; font-weight: 600; font-size: 16px; color: #dc2626;">$${notification.vendorPayoutAmount?.toFixed(2)} ${notification.currency?.toUpperCase()}</td>
              </tr>
            </table>
          </div>
          
          ${notification.reason ? `
          <div style="background: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
            <p style="margin: 0; color: #64748b; font-size: 14px;"><strong>Reason:</strong> ${notification.reason}</p>
          </div>
          ` : ''}
          
          <p style="color: #64748b; font-size: 14px; text-align: center;">This time slot is now available for other guests.</p>
          <p style="color: #94a3b8; font-size: 12px; text-align: center;">This is an automated notification from Stackd.</p>
        </div>
      `;

      const vendorCancelEmailResponse = await resend.emails.send({
        from: "Stackd <notifications@resend.dev>",
        to: [notification.vendorEmail!],
        subject,
        html: htmlContent,
      });

      console.log("[ADMIN-NOTIFICATION] Vendor cancellation email sent:", vendorCancelEmailResponse);

      return new Response(JSON.stringify({ success: true, emailResponse: vendorCancelEmailResponse }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    } else if (notification.type === "vendor_submitted_for_review") {
      // Admin notification when vendor submits for review
      subject = `🔔 New Vendor Awaiting Review: ${notification.vendorName}`;
      htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #f97316; margin-bottom: 20px;">New Vendor Submission</h1>
          
          <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <h2 style="margin: 0 0 15px 0; color: #1e293b;">${notification.vendorName}</h2>
            <p style="color: #64748b; margin: 0;">A new vendor has submitted their profile for review.</p>
          </div>
          
          <a href="https://stackbnb.app/admin/vendor-approvals" 
             style="display: inline-block; background: linear-gradient(135deg, #10b981, #14b8a6); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Review Now
          </a>
          
          <p style="color: #64748b; font-size: 14px; margin-top: 20px;">This is an automated notification from Stackd.</p>
        </div>
      `;
      // Send to admin
    } else if (notification.type === "vendor_approved") {
      // Vendor approval notification
      subject = `✅ Your Profile is Approved: ${notification.vendorName}`;
      htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #16a34a; margin-bottom: 10px;">🎉 You're Approved!</h1>
            <p style="color: #64748b; font-size: 16px; margin: 0;">Great news! Your vendor profile has been verified and approved.</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 16px; padding: 24px; margin-bottom: 20px; border: 1px solid #86efac;">
            <h2 style="margin: 0 0 15px 0; color: #1e293b;">${notification.vendorName}</h2>
            <p style="color: #166534; margin: 0;">You can now publish your profile and start accepting bookings!</p>
          </div>
          
          <div style="text-align: center;">
            <a href="https://stackbnb.app/vendor/preview" 
               style="display: inline-block; background: linear-gradient(135deg, #f97316, #ec4899); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Publish Your Profile
            </a>
          </div>
          
          <p style="color: #64748b; font-size: 14px; margin-top: 20px; text-align: center;">Welcome to Stackd! We're excited to have you.</p>
        </div>
      `;

      const vendorApprovedResponse = await resend.emails.send({
        from: "Stackd <notifications@resend.dev>",
        to: [notification.vendorEmail!],
        subject,
        html: htmlContent,
      });

      console.log("[ADMIN-NOTIFICATION] Vendor approved email sent:", vendorApprovedResponse);

      return new Response(JSON.stringify({ success: true, emailResponse: vendorApprovedResponse }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    } else if (notification.type === "vendor_rejected") {
      // Vendor rejection notification
      subject = `❌ Profile Review Update: ${notification.vendorName}`;
      htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #dc2626; margin-bottom: 10px;">Profile Not Approved</h1>
            <p style="color: #64748b; font-size: 16px; margin: 0;">Unfortunately, we weren't able to approve your profile at this time.</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-radius: 16px; padding: 24px; margin-bottom: 20px; border: 1px solid #fecaca;">
            <h2 style="margin: 0 0 15px 0; color: #1e293b;">${notification.vendorName}</h2>
            ${notification.verificationNotes ? `
            <div style="background: white; border-radius: 8px; padding: 16px; margin-top: 16px;">
              <p style="margin: 0; color: #64748b; font-size: 14px;"><strong>Feedback:</strong></p>
              <p style="margin: 8px 0 0 0; color: #1e293b;">${notification.verificationNotes}</p>
            </div>
            ` : ''}
          </div>
          
          <div style="text-align: center;">
            <a href="https://stackbnb.app/vendor/create-profile" 
               style="display: inline-block; background: linear-gradient(135deg, #f97316, #ec4899); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Update Your Profile
            </a>
          </div>
          
          <p style="color: #64748b; font-size: 14px; margin-top: 20px; text-align: center;">You can make changes and resubmit for review.</p>
        </div>
      `;

      const vendorRejectedResponse = await resend.emails.send({
        from: "Stackd <notifications@resend.dev>",
        to: [notification.vendorEmail!],
        subject,
        html: htmlContent,
      });

      console.log("[ADMIN-NOTIFICATION] Vendor rejected email sent:", vendorRejectedResponse);

      return new Response(JSON.stringify({ success: true, emailResponse: vendorRejectedResponse }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    } else if (notification.type === "vendor_changes_requested") {
      // Changes requested notification
      subject = `📝 Changes Requested: ${notification.vendorName}`;
      htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #f97316; margin-bottom: 10px;">Almost There!</h1>
            <p style="color: #64748b; font-size: 16px; margin: 0;">We need a few changes before we can approve your profile.</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border-radius: 16px; padding: 24px; margin-bottom: 20px; border: 1px solid #fed7aa;">
            <h2 style="margin: 0 0 15px 0; color: #1e293b;">${notification.vendorName}</h2>
            ${notification.verificationNotes ? `
            <div style="background: white; border-radius: 8px; padding: 16px; margin-top: 16px;">
              <p style="margin: 0; color: #64748b; font-size: 14px;"><strong>Requested Changes:</strong></p>
              <p style="margin: 8px 0 0 0; color: #1e293b;">${notification.verificationNotes}</p>
            </div>
            ` : ''}
          </div>
          
          <div style="text-align: center;">
            <a href="https://stackbnb.app/vendor/create-profile" 
               style="display: inline-block; background: linear-gradient(135deg, #f97316, #ec4899); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
              Make Changes
            </a>
          </div>
          
          <p style="color: #64748b; font-size: 14px; margin-top: 20px; text-align: center;">Once you've made the changes, resubmit for review.</p>
        </div>
      `;

      const vendorChangesResponse = await resend.emails.send({
        from: "Stackd <notifications@resend.dev>",
        to: [notification.vendorEmail!],
        subject,
        html: htmlContent,
      });

      console.log("[ADMIN-NOTIFICATION] Vendor changes requested email sent:", vendorChangesResponse);

      return new Response(JSON.stringify({ success: true, emailResponse: vendorChangesResponse }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    } else {
      throw new Error("Unknown notification type");
    }

    const emailResponse = await resend.emails.send({
      from: "Stackd <notifications@resend.dev>",
      to: [ADMIN_EMAIL],
      subject,
      html: htmlContent,
    });

    console.log("[ADMIN-NOTIFICATION] Email sent:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("[ADMIN-NOTIFICATION] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
