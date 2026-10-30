import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Store, Loader2, Sparkles, Upload, Instagram, UtensilsCrossed, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

interface VendorOnboardingWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STEPS = [
  { id: 1, label: "Basic Info" },
  { id: 2, label: "Photos" },
  { id: 3, label: "Pricing" },
  { id: 4, label: "Description" },
];

const CATEGORIES = [
  "Water Sports",
  "Tours & Sightseeing",
  "Food & Dining",
  "Wellness & Spa",
  "Adventure",
  "Cultural Experiences",
  "Photography",
  "Transportation",
  "Private Chef",
  "Fishing",
  "Other",
];

const VendorOnboardingWizard = ({ open, onOpenChange }: VendorOnboardingWizardProps) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    businessName: '',
    listingType: '' as 'experience' | 'restaurant' | '',
    category: '',
    // Step 2: Photos (handled separately)
    // Step 3: Pricing
    pricePerPerson: '',
    duration: '',
    maxGuests: '',
    // Step 4: Description
    description: '',
  });

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step - redirect to the full create profile page
      onOpenChange(false);
      navigate('/vendor/create-profile');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveAndExit = () => {
    // Save progress to session storage for later
    sessionStorage.setItem('vendorOnboardingProgress', JSON.stringify(formData));
    onOpenChange(false);
  };

  const handleGenerateDescription = async () => {
    if (!formData.businessName || !formData.category) {
      return;
    }
    
    setIsGeneratingDescription(true);
    // Simulate AI generation - in real implementation, call the edge function
    setTimeout(() => {
      setFormData(prev => ({
        ...prev,
        description: `Welcome to ${formData.businessName}! We offer exceptional ${formData.category.toLowerCase()} experiences that will make your trip unforgettable. Our team of professionals is dedicated to providing you with the best service and memories that will last a lifetime.`
      }));
      setIsGeneratingDescription(false);
    }, 1500);
  };

  const handleGoToPhotos = () => {
    onOpenChange(false);
    navigate('/vendor/upload-photos');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden rounded-2xl border border-border/50 bg-card/95 backdrop-blur-sm">
        {/* Header with gradient accent */}
        <div className="p-6 border-b border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand to-hot flex items-center justify-center">
              <Store className="w-5 h-5 text-paper" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Set up your listing</h2>
              <p className="text-sm text-muted-foreground">Step {currentStep} of 4</p>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="flex gap-2 mt-4">
            {STEPS.map((step) => (
              <div 
                key={step.id} 
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  step.id <= currentStep 
                    ? "bg-gradient-to-r from-brand to-hot" 
                    : "bg-border/50"
                )} 
              />
            ))}
          </div>
        </div>
        
        {/* Step content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>What's your business called? *</Label>
                <Input
                  value={formData.businessName}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                  placeholder="Ocean Adventures"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label>What type of listing is this? *</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, listingType: 'experience' }))}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                      formData.listingType === 'experience'
                        ? "border-brand bg-brand/10"
                        : "border-border hover:border-brand/50"
                    )}
                  >
                    <PartyPopper className="h-6 w-6 text-brand" />
                    <span className="font-medium">Experience</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, listingType: 'restaurant' }))}
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                      formData.listingType === 'restaurant'
                        ? "border-brand bg-brand/10"
                        : "border-border hover:border-brand/50"
                    )}
                  >
                    <UtensilsCrossed className="h-6 w-6 text-brand" />
                    <span className="font-medium">Restaurant</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select a category..." />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Add photos to make your listing stand out. You can upload directly or import from Instagram.
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleGoToPhotos}
                  className="p-6 rounded-xl border-2 border-dashed border-border hover:border-brand/50 transition-all flex flex-col items-center gap-2"
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm font-medium">Upload Photos</span>
                </button>
                <button
                  type="button"
                  onClick={handleGoToPhotos}
                  className="p-6 rounded-xl border-2 border-dashed border-border hover:border-hot/50 transition-all flex flex-col items-center gap-2"
                >
                  <Instagram className="h-8 w-8 text-hot" />
                  <span className="text-sm font-medium">Import from Instagram</span>
                </button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                You can add or edit photos later from your profile settings
              </p>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Price per person ($)</Label>
                <Input
                  type="number"
                  value={formData.pricePerPerson}
                  onChange={(e) => setFormData(prev => ({ ...prev, pricePerPerson: e.target.value }))}
                  placeholder="75"
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label>Duration</Label>
                <Select
                  value={formData.duration}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, duration: value }))}
                >
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select duration..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30min">30 minutes</SelectItem>
                    <SelectItem value="1hr">1 hour</SelectItem>
                    <SelectItem value="2hr">2 hours</SelectItem>
                    <SelectItem value="3hr">3 hours</SelectItem>
                    <SelectItem value="half-day">Half day (4-5 hours)</SelectItem>
                    <SelectItem value="full-day">Full day (6+ hours)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Maximum guests</Label>
                <Input
                  type="number"
                  value={formData.maxGuests}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxGuests: e.target.value }))}
                  placeholder="10"
                  className="rounded-xl"
                />
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Description</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleGenerateDescription}
                    disabled={isGeneratingDescription || !formData.businessName}
                    className="text-xs gap-1"
                  >
                    {isGeneratingDescription ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                    Generate with AI
                  </Button>
                </div>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Tell guests what makes your experience special..."
                  className="rounded-xl min-h-[150px] resize-none"
                />
              </div>
            </div>
          )}
        </div>
        
        {/* Footer with actions */}
        <div className="p-6 border-t border-border/50 flex justify-between">
          <Button 
            variant="ghost" 
            onClick={currentStep === 1 ? handleSaveAndExit : handleBack}
          >
            {currentStep === 1 ? "Save & Exit" : "Back"}
          </Button>
          <Button 
            variant="gradient" 
            onClick={handleNext}
            disabled={currentStep === 1 && (!formData.businessName || !formData.listingType)}
          >
            {currentStep === 4 ? "Continue to Full Editor" : "Continue"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VendorOnboardingWizard;
