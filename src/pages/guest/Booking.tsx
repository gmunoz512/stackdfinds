import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, Users, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import stackdLogo from "@/assets/stackd-logo-new.png";

const Booking = () => {
  const navigate = useNavigate();
  const [guests, setGuests] = useState(2);

  const handleConfirm = () => {
    navigate("/confirmation");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <img src={stackdLogo} alt="stackd logo" className="h-8 w-8 drop-shadow-lg" />
              <span className="text-xl font-bold font-display bg-gradient-to-r from-brand via-hot to-iris-strong bg-clip-text text-transparent">
                stackd
              </span>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Button variant="ghost" className="mb-6" onClick={() => window.history.length > 1 ? navigate(-1) : navigate('/appview')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <h1 className="text-3xl font-bold mb-8">Book Your Experience</h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <div className="space-y-4 mb-6">
                <h2 className="text-xl font-semibold">Sunset Kayak Tour</h2>
                <p className="text-muted-foreground">Ocean Adventures</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="date">Select Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="date"
                      type="date"
                      className="pl-10"
                      defaultValue="2024-08-18"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Select Time</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <select
                      id="time"
                      className="w-full pl-10 h-11 rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option>6:00 PM - 8:00 PM</option>
                      <option>5:30 PM - 7:30 PM</option>
                      <option>7:00 PM - 9:00 PM</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="guests">Number of Guests</Label>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Remove a guest"
                      onClick={() => setGuests(Math.max(1, guests - 1))}
                    >
                      -
                    </Button>
                    <div className="flex items-center gap-2 min-w-[120px] justify-center">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{guests} {guests === 1 ? 'Guest' : 'Guests'}</span>
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Add a guest"
                      onClick={() => setGuests(Math.min(6, guests + 1))}
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Payment Details</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" placeholder="Sarah Johnson" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input id="email" type="email" placeholder="sarah@example.com" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" type="tel" placeholder="+1 (555) 555-5555" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="card">Card Number</Label>
                  <Input id="card" placeholder="0000 0000 0000 0000" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiry">Expiration</Label>
                    <Input id="expiry" placeholder="MM/YY" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input id="cvv" placeholder="123" />
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Summary Card */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-24">
              <h3 className="text-lg font-semibold mb-4">Booking Summary</h3>
              <div className="space-y-4">
                <div className="pb-4 border-b space-y-1">
                  <p className="font-medium">Sunset Kayak Tour</p>
                  <p className="text-sm text-muted-foreground">Aug 18, 2024 • 6:00 PM</p>
                  <p className="text-sm text-muted-foreground">{guests} guests</p>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">${80} × {guests} guests</span>
                    <span>${80 * guests}.00</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center font-semibold text-lg">
                    <span>Total</span>
                    <span className="text-primary">${80 * guests}.00</span>
                  </div>
                </div>

                <Button size="lg" className="w-full" onClick={handleConfirm}>
                  Confirm & Pay
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Free cancellation up to 24 hours before the experience
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booking;
