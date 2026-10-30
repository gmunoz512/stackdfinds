import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Home, X, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface HostOnboardingCardProps {
  onComplete?: () => void;
}

const HostOnboardingCard = ({ onComplete }: HostOnboardingCardProps) => {
  const { user } = useAuthContext();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    propertyName: '',
    airbnbUrl: '',
    address: '',
    city: '',
    state: '',
    zip: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (isDismissed) return null;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.propertyName.trim()) {
      newErrors.propertyName = "Property name is required";
    }

    if (formData.airbnbUrl && !/^https?:\/\/.+/.test(formData.airbnbUrl)) {
      newErrors.airbnbUrl = "Please enter a valid URL";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !user) return;
    
    setIsSubmitting(true);
    
    try {
      // Update the user's profile with property information
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.propertyName,
          city: formData.city,
          zip_code: formData.zip,
          // Store additional data in recommendations JSON field for now
          recommendations: {
            property: {
              name: formData.propertyName,
              airbnbUrl: formData.airbnbUrl,
              address: formData.address,
              city: formData.city,
              state: formData.state,
              zip: formData.zip,
            }
          }
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success("Profile updated successfully!");
      onComplete?.();
      setIsDismissed(true);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error("Failed to save profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <Card className="p-6 rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm mb-6">
      <div className="flex items-start gap-4">
        {/* Gradient icon */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-iris-strong to-hot flex items-center justify-center flex-shrink-0">
          <Home className="w-6 h-6 text-paper" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-semibold">Complete your profile</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 rounded-lg hover:bg-muted/50 transition-colors"
                aria-label={isExpanded ? "Collapse" : "Expand"}
              >
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              <button
                onClick={() => setIsDismissed(true)}
                className="p-1 rounded-lg hover:bg-muted/50 transition-colors"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Add your property details to start connecting with vendors
          </p>
          
          {isExpanded && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="propertyName" className="text-sm text-muted-foreground">
                  Property Name *
                </Label>
                <Input 
                  id="propertyName" 
                  name="propertyName"
                  value={formData.propertyName}
                  onChange={handleChange}
                  placeholder="Beach House Retreat" 
                  className={`rounded-xl border-border/50 ${errors.propertyName ? "border-destructive" : ""}`}
                />
                {errors.propertyName && (
                  <p className="text-xs text-destructive">{errors.propertyName}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="airbnbUrl" className="text-sm text-muted-foreground">
                  Airbnb Listing URL
                </Label>
                <Input 
                  id="airbnbUrl" 
                  name="airbnbUrl"
                  type="url"
                  value={formData.airbnbUrl}
                  onChange={handleChange}
                  placeholder="https://airbnb.com/rooms/..." 
                  className={`rounded-xl border-border/50 ${errors.airbnbUrl ? "border-destructive" : ""}`}
                />
                {errors.airbnbUrl && (
                  <p className="text-xs text-destructive">{errors.airbnbUrl}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-sm text-muted-foreground">
                  Address
                </Label>
                <Input 
                  id="address" 
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="123 Ocean Drive" 
                  className="rounded-xl border-border/50"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-sm text-muted-foreground">
                    City
                  </Label>
                  <Input 
                    id="city" 
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="Miami" 
                    className="rounded-xl border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state" className="text-sm text-muted-foreground">
                    State
                  </Label>
                  <Input 
                    id="state" 
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="FL" 
                    className="rounded-xl border-border/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip" className="text-sm text-muted-foreground">
                    Zip
                  </Label>
                  <Input 
                    id="zip" 
                    name="zip"
                    value={formData.zip}
                    onChange={handleChange}
                    placeholder="33139" 
                    className="rounded-xl border-border/50"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsDismissed(true)}
                >
                  Skip for now
                </Button>
                <Button 
                  type="submit" 
                  variant="gradient" 
                  size="sm"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Card>
  );
};

export default HostOnboardingCard;
