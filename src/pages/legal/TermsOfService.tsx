import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import stackdLogo from "@/assets/stackd-logo-new.png";

const TermsOfService = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <img src={stackdLogo} alt="Stackd" className="h-8 w-8" />
            <span className="font-display text-xl font-bold bg-gradient-to-r from-brand via-hot to-iris-strong bg-clip-text text-transparent">
              stackd
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-neutral dark:prose-invert max-w-none">
          <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
          <p className="text-muted-foreground mb-8">Last updated: February 2, 2026</p>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using Stackd's mobile application and website (the "Service"), you agree 
              to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, 
              please do not use our Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">2. Description of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              Stackd is a platform that connects vacation rental guests with local experiences, 
              activities, and services curated by property hosts and provided by local vendors. 
              We facilitate bookings between guests and vendors but are not directly responsible 
              for the experiences or services provided.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">3. User Accounts</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              To use certain features of the Service, you must create an account. You agree to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">4. User Types and Responsibilities</h2>
            
            <h3 className="text-lg font-medium mt-6 mb-3">Guests</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Guests are users who book experiences and services through the platform. Guests agree to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Provide accurate booking information</li>
              <li>Arrive on time for booked experiences</li>
              <li>Follow vendor rules and safety guidelines</li>
              <li>Treat vendors and their property with respect</li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3">Hosts</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Hosts are property owners who curate experiences for their guests. Hosts agree to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Only recommend vendors they believe provide quality services</li>
              <li>Maintain accurate property and contact information</li>
              <li>Disclose any commission relationships with vendors</li>
            </ul>

            <h3 className="text-lg font-medium mt-6 mb-3">Vendors</h3>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Vendors are service providers who offer experiences through the platform. Vendors agree to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Provide accurate descriptions of services and pricing</li>
              <li>Maintain all necessary licenses and insurance</li>
              <li>Honor confirmed bookings except for valid cancellations</li>
              <li>Provide safe and professional services</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">5. Booking and Payment Terms</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              All payments are processed securely through Stripe. By making a booking, you agree to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Pay the full amount at the time of booking unless otherwise specified</li>
              <li>Accept the vendor's cancellation and refund policies</li>
              <li>Understand that refunds are subject to vendor policies and platform fees</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 id="cancellation" className="text-xl font-semibold mb-4">6. Cancellation Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              Cancellation policies vary by vendor and are displayed at the time of booking. 
              Generally, cancellations made within the specified cancellation window may be eligible 
              for a full or partial refund. Platform fees may be non-refundable. Please review the 
              specific cancellation policy before completing your booking.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">7. Prohibited Activities</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              You agree not to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Use the Service for any unlawful purpose</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Post false, misleading, or fraudulent content</li>
              <li>Attempt to circumvent platform fees or payments</li>
              <li>Interfere with the proper functioning of the Service</li>
              <li>Scrape or collect user data without authorization</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">8. Intellectual Property</h2>
            <p className="text-muted-foreground leading-relaxed">
              The Service and its original content, features, and functionality are owned by Stackd 
              and are protected by international copyright, trademark, and other intellectual property 
              laws. You may not copy, modify, or distribute our content without prior written permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">9. Disclaimer of Warranties</h2>
            <p className="text-muted-foreground leading-relaxed">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. 
              WE DO NOT GUARANTEE THE QUALITY, SAFETY, OR LEGALITY OF EXPERIENCES PROVIDED BY VENDORS. 
              YOU USE THE SERVICE AT YOUR OWN RISK.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">10. Limitation of Liability</h2>
            <p className="text-muted-foreground leading-relaxed">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, STACKD SHALL NOT BE LIABLE FOR ANY INDIRECT, 
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO 
              LOSS OF PROFITS, DATA, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR USE OF THE SERVICE.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">11. Indemnification</h2>
            <p className="text-muted-foreground leading-relaxed">
              You agree to indemnify and hold harmless Stackd and its officers, directors, employees, 
              and agents from any claims, damages, losses, or expenses arising from your use of the 
              Service or violation of these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">12. Dispute Resolution</h2>
            <p className="text-muted-foreground leading-relaxed">
              Any disputes arising from these Terms or your use of the Service shall first be 
              attempted to be resolved through good-faith negotiation. If negotiation fails, 
              disputes shall be resolved through binding arbitration in accordance with the 
              rules of the American Arbitration Association.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">13. Termination</h2>
            <p className="text-muted-foreground leading-relaxed">
              We may terminate or suspend your account and access to the Service immediately, 
              without prior notice, for any reason, including breach of these Terms. Upon 
              termination, your right to use the Service will immediately cease.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">14. Governing Law</h2>
            <p className="text-muted-foreground leading-relaxed">
              These Terms shall be governed by and construed in accordance with the laws of the 
              State of California, United States, without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">15. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these Terms at any time. We will notify users of any 
              material changes by posting the new Terms on this page and updating the "Last updated" 
              date. Your continued use of the Service after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold mb-4">16. Contact Us</h2>
            <p className="text-muted-foreground leading-relaxed">
              If you have any questions about these Terms, please contact us:
            </p>
            <ul className="list-none mt-4 text-muted-foreground space-y-1">
              <li><strong>Email:</strong> hello@stackd.app</li>
              <li><strong>Location:</strong> San Diego, CA, United States</li>
            </ul>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>© 2026 Stackd. All rights reserved.</p>
          <div className="flex justify-center gap-4 mt-2">
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
