import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Minus, Plus, Calendar as CalendarIcon, Store } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { useBooking } from "@/contexts/BookingContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useRequireSignIn } from "@/hooks/useRequireSignIn";

interface PriceTier {
  name: string;
  price: number;
}

interface VendorProfile {
  id: string;
  name: string;
  category: string;
  price_per_person: number | null;
  price_tiers: PriceTier[] | null;
  duration: string | null;
  max_guests: number | null;
}

// Category to icon mapping
const categoryIcons: Record<string, string> = {
  'Private Chef': '👨‍🍳',
  'Massage & Spa': '💆',
  'Yacht Charter': '🛥️',
  'Photography': '📸',
  'Tour Guide': '🗺️',
  'Fitness & Yoga': '🧘',
  'Wine Tasting': '🍷',
  'Fishing Charter': '🎣',
  'Water Sports': '🌊',
  'Cooking Class': '👩‍🍳',
  'Transportation': '🚗',
  'default': '✨',
};

const VendorBookingForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { updateBookingData } = useBooking();
  const { toast } = useToast();
  const { requireSignIn } = useRequireSignIn();
  
  const [vendor, setVendor] = useState<VendorProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTierIndex, setSelectedTierIndex] = useState<number>(0);
  
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    guests: 1,
  });

  // Get hostId from URL if guest came from a host's guide
  const hostId = searchParams.get('host');

  useEffect(() => {
    if (id) {
      fetchVendor();
    }
  }, [id]);

  const fetchVendor = async () => {
    try {
      const { data, error } = await supabase
        .from('vendor_profiles')
        .select('id, name, category, price_per_person, price_tiers, duration, max_guests')
        .eq('id', id)
        .eq('is_published', true)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        // Parse price_tiers from JSON safely
        let priceTiers: PriceTier[] = [];
        if (Array.isArray(data.price_tiers)) {
          priceTiers = data.price_tiers.map((tier: unknown) => {
            const t = tier as { name?: string; price?: number };
            return {
              name: t.name || '',
              price: t.price || 0,
            };
          });
        }
        
        setVendor({
          ...data,
          price_tiers: priceTiers,
        } as VendorProfile);
        
        // Set selected tier from URL param
        const tierParam = searchParams.get('tier');
        if (tierParam !== null && priceTiers.length > 0) {
          const tierIndex = parseInt(tierParam);
          if (!isNaN(tierIndex) && tierIndex >= 0 && tierIndex < priceTiers.length) {
            setSelectedTierIndex(tierIndex);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching vendor:', error);
      toast({
        title: "Error",
        description: "Failed to load vendor details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/appview');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-8">
        <div className="max-w-[375px] mx-auto">
          <div className="bg-card border-b p-4">
            <Skeleton className="h-4 w-24 mx-auto mb-2" />
            <div className="flex gap-1">
              <Skeleton className="h-1 flex-1" />
              <Skeleton className="h-1 flex-1" />
              <Skeleton className="h-1 flex-1" />
            </div>
          </div>
          <div className="px-4 py-6 space-y-6">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">Vendor not found</p>
          <Button variant="link" className="mt-4" onClick={handleBack}>
            Go back
          </Button>
        </Card>
      </div>
    );
  }

  const maxGuests = vendor.max_guests || 10;
  const hasTiers = vendor.price_tiers && vendor.price_tiers.length > 0;
  const selectedTier = hasTiers ? vendor.price_tiers![selectedTierIndex] : null;
  const pricePerPerson = selectedTier ? selectedTier.price : (vendor.price_per_person || 0);
  const subtotal = pricePerPerson * formData.guests;
  const categoryIcon = categoryIcons[vendor.category] || categoryIcons['default'];

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
      experienceId: vendor.id,
      experienceName: selectedTier ? `${vendor.name} - ${selectedTier.name}` : vendor.name,
      vendorProfileId: vendor.id,
      vendorName: vendor.category,
      date: formData.date,
      time: formData.time,
      guests: formData.guests,
      pricePerPerson: pricePerPerson,
      totalPrice: subtotal,
      hostId: hostId || undefined, // Pass hostId for commission tracking
    });

    // Pass hostId to payment page via URL
    const params = new URLSearchParams();
    if (hostId) {
      params.set('host', hostId);
    }
    navigate(`/vendor/${id}/payment${params.toString() ? `?${params.toString()}` : ''}`);
  };

  const incrementGuests = () => {
    if (formData.guests < maxGuests) {
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
      <div className="max-w-[375px] mx-auto">
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
            <h1 className="text-2xl font-medium">Book Your Experience</h1>
            <p className="text-sm text-muted-foreground">Complete your booking details</p>
          </div>

          {/* Experience Summary */}
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <span className="text-3xl">{categoryIcon}</span>
              <div className="flex-1">
                <h3 className="font-semibold">{vendor.name}</h3>
                <p className="text-sm text-muted-foreground">{vendor.category}</p>
                <p className="text-sm text-muted-foreground mt-1">{vendor.duration || 'Varies'}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">${pricePerPerson}</p>
                <p className="text-xs text-muted-foreground">per person</p>
              </div>
            </div>
          </Card>

          {/* Service Type Selector (if has tiers) */}
          {hasTiers && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Service Type *</Label>
              <Select
                value={selectedTierIndex.toString()}
                onValueChange={(val) => setSelectedTierIndex(parseInt(val))}
              >
                <SelectTrigger className="w-full bg-background">
                  <SelectValue placeholder="Choose service type" />
                </SelectTrigger>
                <SelectContent className="bg-card z-50">
                  {vendor.price_tiers!.map((tier, idx) => (
                    <SelectItem key={idx} value={idx.toString()}>
                      {tier.name} - ${tier.price}/person
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
                    <p className="text-sm text-muted-foreground">Max {maxGuests}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
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
                      onClick={incrementGuests}
                      disabled={formData.guests >= maxGuests}
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
                    ${pricePerPerson} × {formData.guests} {formData.guests === 1 ? 'guest' : 'guests'}
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

export default VendorBookingForm;
