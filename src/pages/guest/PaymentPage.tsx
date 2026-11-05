import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Loader2, Lock, Tag, Check, X } from "lucide-react";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { signInPath } from "@/lib/authGate";
import { useState } from "react";
import { useBooking } from "@/contexts/BookingContext";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const PaymentPage = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { bookingData, updateBookingData } = useBooking();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading, user } = useAuthContext();
  const [isProcessing, setIsProcessing] = useState(false);
  const [promoCode, setPromoCode] = useState(bookingData.promoCode || '');
  const [isValidatingPromo, setIsValidatingPromo] = useState(false);
  const [promoApplied, setPromoApplied] = useState(!!bookingData.promoCode);
  const [promoError, setPromoError] = useState('');
  const [checkoutUnavailable, setCheckoutUnavailable] = useState(false);

  // Get hostId from URL or booking context
  const hostId = searchParams.get('host') || bookingData.hostId;

  // Calculate the final price to display
  const displayPrice = bookingData.finalPrice ?? bookingData.totalPrice;

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      setPromoError('Please enter a promo code');
      return;
    }

    setIsValidatingPromo(true);
    setPromoError('');

    try {
      // Use edge function for secure promo validation (doesn't expose promo code list)
      const { data, error } = await supabase.functions.invoke('validate-promo-code', {
        body: { 
          code: promoCode.trim(),
          orderAmount: bookingData.totalPrice
        }
      });

      if (error) throw error;

      if (data) {
        if (data.valid) {
          const discountAmount = Number(data.discount_amount);
          const finalPrice = Math.max(0, bookingData.totalPrice - discountAmount);
          
          updateBookingData({
            promoCode: promoCode.trim().toUpperCase(),
            discountAmount,
            finalPrice
          });
          
          setPromoApplied(true);
          toast({
            title: "Promo code applied!",
            description: data.message,
          });
        } else {
          setPromoError(data.message || 'Invalid promo code');
        }
      }
    } catch (error) {
      console.error('Promo validation error:', error);
      setPromoError('Failed to validate promo code');
    } finally {
      setIsValidatingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setPromoCode('');
    setPromoApplied(false);
    setPromoError('');
    updateBookingData({
      promoCode: undefined,
      discountAmount: undefined,
      finalPrice: undefined
    });
  };

  const handleStripeCheckout = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Login required",
        description: "Please log in to complete your booking",
        variant: "destructive",
      });
      navigate(signInPath(`${location.pathname}${location.search}`));
      return;
    }

    if (!bookingData.experienceName || bookingData.totalPrice <= 0) {
      toast({
        title: "Booking error",
        description: "Invalid booking details. Please start over.",
        variant: "destructive",
      });
      navigate(`/vendor/${id}`);
      return;
    }

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-booking-checkout', {
        body: {
          experienceName: bookingData.experienceName,
          vendorName: bookingData.vendorName,
          date: bookingData.date,
          time: bookingData.time,
          guests: bookingData.guests,
          totalPrice: displayPrice,
          originalPrice: bookingData.totalPrice,
          vendorId: id,
          hostId: hostId || null,
          promoCode: bookingData.promoCode || null,
          discountAmount: bookingData.discountAmount || 0,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setCheckoutUnavailable(true);
      toast({
        title: "Checkout unavailable",
        description: "Stripe checkout needs test keys in this environment. You can still preview the confirmation screen.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const openConfirmationPreview = () => {
    navigate(`/vendor/${id}/confirmed`);
  };

  const hasBookingDetails = Boolean(bookingData.experienceName && bookingData.date && bookingData.totalPrice > 0);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasBookingDetails) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="p-8 text-center max-w-sm space-y-4">
          <h1 className="text-xl font-medium">No booking to pay for</h1>
          <p className="text-sm text-muted-foreground">
            Choose a vendor and complete the booking form first.
          </p>
          <Button variant="gradient" onClick={() => navigate(id ? `/vendor/${id}` : '/appview')}>
            {id ? 'Back to vendor' : 'Back to Explore'}
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="max-w-[375px] mx-auto">
        {/* Progress Indicator */}
        <div className="bg-card border-b p-4">
          <div className="text-center text-sm text-muted-foreground mb-2">Step 2 of 3</div>
          <div className="flex gap-1">
            <div className="h-1 flex-1 bg-gradient-to-r from-brand to-hot rounded-full" />
            <div className="h-1 flex-1 bg-gradient-to-r from-brand to-hot rounded-full" />
            <div className="h-1 flex-1 bg-muted rounded-full" />
          </div>
        </div>

        {/* Header */}
        <div className="px-4 py-4 border-b bg-card">
          <Link 
            to={`/vendor/${id}/book`}
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors active:scale-95"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </div>

        <div className="px-4 py-6 space-y-6">
          {/* Header */}
          <div className="space-y-1">
            <h1 className="text-2xl font-medium">Confirm & Pay</h1>
            <p className="text-sm text-muted-foreground">Review your booking and complete payment</p>
          </div>

          {/* Booking Summary */}
          <Card className="p-4 bg-muted/30">
            <h3 className="font-semibold mb-3">Booking Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Experience</span>
                <span className="font-medium text-right max-w-[180px]">{bookingData.experienceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span className="font-medium">{bookingData.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time</span>
                <span className="font-medium">{bookingData.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Guests</span>
                <span className="font-medium">{bookingData.guests}</span>
              </div>
              
              <div className="pt-2 mt-2 border-t space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">${bookingData.totalPrice}</span>
                </div>
                
                {promoApplied && bookingData.discountAmount && (
                  <div className="flex justify-between text-success-strong">
                    <span className="flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      Promo ({bookingData.promoCode})
                    </span>
                    <span>-${bookingData.discountAmount.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-semibold">Total</span>
                  <div className="text-right">
                    {promoApplied && bookingData.discountAmount ? (
                      <>
                        <span className="text-muted-foreground line-through text-sm mr-2">${bookingData.totalPrice}</span>
                        <span className="font-bold text-lg text-success-strong">${displayPrice.toFixed(2)}</span>
                      </>
                    ) : (
                      <span className="font-bold text-lg">${bookingData.totalPrice}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Promo Code Section */}
          <Card className="p-4 bg-muted/30">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Promo Code
            </h3>
            
            {promoApplied ? (
              <div className="flex items-center justify-between bg-success/10 border border-success/30 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-success-strong" />
                  <span className="font-medium text-success-strong">{bookingData.promoCode}</span>
                  <span className="text-sm text-muted-foreground">
                    (-${bookingData.discountAmount?.toFixed(2)})
                  </span>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleRemovePromo}
                  className="h-8 w-8 p-0 hover:bg-destructive/10"
                >
                  <X className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter promo code"
                    value={promoCode}
                    onChange={(e) => {
                      setPromoCode(e.target.value.toUpperCase());
                      setPromoError('');
                    }}
                    className="flex-1 uppercase"
                    disabled={isValidatingPromo}
                  />
                  <Button 
                    variant="outline" 
                    onClick={handleApplyPromo}
                    disabled={isValidatingPromo || !promoCode.trim()}
                  >
                    {isValidatingPromo ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Apply'
                    )}
                  </Button>
                </div>
                {promoError && (
                  <p className="text-sm text-destructive animate-fade-in">{promoError}</p>
                )}
              </div>
            )}
          </Card>

          {/* User Info */}
          {isAuthenticated && user && (
            <Card className="p-4 bg-muted/30">
              <h3 className="font-semibold mb-2">Booking as</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </Card>
          )}

          {/* Stripe Checkout Button */}
          <div className="space-y-4">
            <Button 
              variant="gradient" 
              className="w-full" 
              size="lg"
              onClick={handleStripeCheckout}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Redirecting to checkout...
                </>
              ) : (
                <>Proceed to Payment - ${displayPrice.toFixed(2)}</>
              )}
            </Button>

            {(checkoutUnavailable || !isAuthenticated) && (
              <Button
                variant="outline"
                className="w-full"
                size="lg"
                onClick={openConfirmationPreview}
              >
                View confirmation preview
              </Button>
            )}

            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Lock className="h-3 w-3" />
              <span>Secure payment powered by Stripe</span>
            </div>
          </div>

          {/* Not logged in prompt */}
          {!isAuthenticated && (
            <Card className="p-4 border-brand/30 bg-brand/5">
              <p className="text-sm text-center">
                Please{" "}
                <Link to={signInPath(`${location.pathname}${location.search}`)} className="text-primary underline font-medium">
                  log in
                </Link>{" "}
                to complete your booking
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;
