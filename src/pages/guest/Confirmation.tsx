import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, Calendar, Users, Mail, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import stackdLogo from "@/assets/stackd-logo-new.png";

const Confirmation = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={stackdLogo} alt="stackd logo" className="h-8 w-8 drop-shadow-lg" />
            <span className="text-xl font-bold font-display bg-gradient-to-r from-brand via-hot to-iris-strong bg-clip-text text-transparent">
              stackd
            </span>
          </Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-4">
            <CheckCircle className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-3">Booking Confirmed!</h1>
          <p className="text-lg text-muted-foreground">
            Your experience is confirmed. Check your email for details and directions.
          </p>
        </div>

        <Card className="p-8 space-y-6">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Sunset Kayak Tour</h2>
            <p className="text-lg text-muted-foreground">Ocean Adventures</p>

            <div className="grid gap-3 pt-4">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Calendar className="h-5 w-5" />
                <span>Aug 18, 2024 at 6:00 PM</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Users className="h-5 w-5" />
                <span>2 guests</span>
              </div>
              <div className="flex items-center gap-3 text-muted-foreground">
                <Mail className="h-5 w-5" />
                <span>Confirmation sent to sarah@example.com</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t">
            <h3 className="font-semibold mb-4">Contact Vendor</h3>
            <div className="bg-muted/30 rounded-lg p-4 space-y-2">
              <p className="font-medium">Ocean Adventures</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>+1 (555) 123-4567</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button asChild variant="outline" className="flex-1">
              <Link to="/bookings">View My Bookings</Link>
            </Button>
            <Button asChild className="flex-1">
              <Link to="/storefront/beachhouse">Back to Experiences</Link>
            </Button>
          </div>
        </Card>

        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-6 py-3 bg-primary/5 border border-primary/20 rounded-lg">
            <CheckCircle className="h-5 w-5 text-primary" />
            <p className="text-sm text-muted-foreground">
              Your booking helps support local businesses recommended by your host
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Confirmation;
