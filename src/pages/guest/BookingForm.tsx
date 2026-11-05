import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Minus, Plus, Calendar as CalendarIcon } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { experiences } from "@/data/mockData";
import { useState } from "react";
import { useBooking } from "@/contexts/BookingContext";
import { useSearch } from "@/contexts/SearchContext";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useRequireSignIn } from "@/hooks/useRequireSignIn";

const BookingForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { updateBookingData } = useBooking();
  const { selectedDate: searchDate } = useSearch();
  const { toast } = useToast();
  const { requireSignIn } = useRequireSignIn();
  
  const experience = experiences.find(exp => exp.id === Number(id));

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/appview');
    }
  };
  
  const [formData, setFormData] = useState({
    date: searchDate ? format(searchDate, 'yyyy-MM-dd') : '',
    time: '',
    guests: 1,
  });

  if (!experience) {
    return null;
  }

  const subtotal = experience.price * formData.guests;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!requireSignIn("book")) return;
    
    if (!formData.date || !formData.time) {
      toast({
        title: "Missing information",
        description: "Please select a date and time",
        variant: "destructive",
      });
      return;
    }

    updateBookingData({
      experienceId: experience.id.toString(),
      experienceName: experience.name,
      vendorName: experience.vendor,
      date: formData.date,
      time: formData.time,
      guests: formData.guests,
      pricePerPerson: experience.price,
      totalPrice: subtotal,
    });

    navigate(`/booking/${id}/payment`);
  };

  const incrementGuests = () => {
    if (formData.guests < experience.maxGuests) {
      setFormData(prev => ({ ...prev, guests: prev.guests + 1 }));
    }
  };

  const decrementGuests = () => {
    if (formData.guests > 1) {
      setFormData(prev => ({ ...prev, guests: prev.guests - 1 }));
    }
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="max-w-[375px] md:max-w-xl lg:max-w-2xl mx-auto">
        {/* Progress Indicator */}
        <div className="bg-card border-b p-4">
          <div className="text-center text-sm text-muted-foreground mb-2">Step 1 of 3</div>
          <div className="flex gap-1">
            <div className="h-1 flex-1 bg-gradient-to-r from-brand to-hot rounded-full" />
            <div className="h-1 flex-1 bg-muted rounded-full" />
            <div className="h-1 flex-1 bg-muted rounded-full" />
          </div>
        </div>

        {/* Header */}
        <div className="px-4 py-4 border-b bg-card">
          <button 
            onClick={handleBack}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors active:scale-95"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
        </div>

        <div className="px-4 py-6 space-y-6">
          {/* Header */}
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Book Your Experience</h1>
            <p className="text-sm text-muted-foreground">Complete your booking details</p>
          </div>

          {/* Experience Summary */}
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <span className="text-3xl">{experience.categoryIcon}</span>
              <div className="flex-1">
                <h3 className="font-semibold">{experience.name}</h3>
                <p className="text-sm text-muted-foreground">{experience.vendor}</p>
                <p className="text-sm text-muted-foreground mt-1">{experience.duration}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">${experience.price}</p>
                <p className="text-xs text-muted-foreground">per person</p>
              </div>
            </div>
          </Card>

          {/* Booking Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-medium">Select Date *</Label>
              <div className="relative">
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
                <CalendarIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time" className="text-sm font-medium">Select Time *</Label>
              <Select
                value={formData.time}
                onValueChange={(value) => setFormData(prev => ({ ...prev, time: value }))}
                required
              >
                <SelectTrigger id="time" className="rounded-xl">
                  <SelectValue placeholder="Choose a time" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="9:00 AM">9:00 AM</SelectItem>
                  <SelectItem value="10:00 AM">10:00 AM</SelectItem>
                  <SelectItem value="11:00 AM">11:00 AM</SelectItem>
                  <SelectItem value="12:00 PM">12:00 PM</SelectItem>
                  <SelectItem value="2:00 PM">2:00 PM</SelectItem>
                  <SelectItem value="3:00 PM">3:00 PM</SelectItem>
                  <SelectItem value="4:00 PM">4:00 PM</SelectItem>
                  <SelectItem value="6:00 PM">6:00 PM</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Number of Guests *</Label>
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Guests</p>
                    <p className="text-sm text-muted-foreground">Max {experience.maxGuests}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="Remove a guest"
                      onClick={decrementGuests}
                      disabled={formData.guests <= 1}
                      className="h-8 w-8 rounded-full"
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="text-lg font-semibold w-8 text-center">{formData.guests}</span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label="Add a guest"
                      onClick={incrementGuests}
                      disabled={formData.guests >= experience.maxGuests}
                      className="h-8 w-8 rounded-full"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>

            {/* Subtotal */}
            <Card className="p-4 bg-muted/30">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    ${experience.price} × {formData.guests} {formData.guests === 1 ? 'guest' : 'guests'}
                  </p>
                  <p className="text-lg font-bold mt-1">Total: ${subtotal}</p>
                </div>
              </div>
            </Card>

            <Button type="submit" variant="gradient" className="w-full" size="lg">
              Continue to Payment
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BookingForm;
