import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import VendorBottomNav from "@/components/VendorBottomNav";
import { useToast } from "@/hooks/use-toast";
import { useSmartBack } from "@/hooks/use-smart-back";

const AddService = () => {
  const navigate = useNavigate();
  const goBack = useSmartBack("/vendor/services");
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    serviceName: '',
    description: '',
    duration: '',
    price: '',
    maxCapacity: '',
    category: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.serviceName.trim()) {
      newErrors.serviceName = "Service name is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!formData.duration.trim()) {
      newErrors.duration = "Duration is required";
    }

    if (!formData.price.trim()) {
      newErrors.price = "Price is required";
    }

    if (!formData.maxCapacity.trim()) {
      newErrors.maxCapacity = "Max capacity is required";
    }

    if (!formData.category) {
      newErrors.category = "Category is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      const newService = {
        id: Date.now().toString(),
        name: formData.serviceName,
        description: formData.description,
        duration: formData.duration,
        price: `$${parseFloat(formData.price).toFixed(2)}`,
        capacity: `Max ${formData.maxCapacity} people`
      };

      const stored = localStorage.getItem('vendorServices');
      const existingServices = stored ? JSON.parse(stored) : [];
      const updatedServices = [...existingServices, newService];
      localStorage.setItem('vendorServices', JSON.stringify(updatedServices));

      toast({
        title: "Service added!",
        description: "Your service has been created successfully",
      });
      navigate('/vendor/services');
    } else {
      toast({
        title: "Validation error",
        description: "Please fix the errors in the form",
        variant: "destructive",
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-[375px] mx-auto px-4 py-6 space-y-6">
        <button 
          onClick={goBack}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors active:scale-95"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Services
        </button>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Add Service</h1>
          <p className="text-sm text-muted-foreground">Create a new offering</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="serviceName" className="text-sm font-medium">Service Name *</Label>
              <Input
                id="serviceName"
                name="serviceName"
                value={formData.serviceName}
                onChange={handleChange}
                placeholder="Sunset Kayak Tour"
                className={errors.serviceName ? "border-destructive" : ""}
              />
              {errors.serviceName && (
                <p className="text-xs text-destructive">{errors.serviceName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">Description *</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your service..."
                rows={4}
                className={`rounded-xl resize-none ${errors.description ? "border-destructive" : ""}`}
              />
              {errors.description && (
                <p className="text-xs text-destructive">{errors.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration" className="text-sm font-medium">Duration *</Label>
              <Input
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                placeholder="2 hours"
                className={errors.duration ? "border-destructive" : ""}
              />
              {errors.duration && (
                <p className="text-xs text-destructive">{errors.duration}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price" className="text-sm font-medium">Price *</Label>
              <Input
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                placeholder="80.00"
                className={errors.price ? "border-destructive" : ""}
              />
              {errors.price && (
                <p className="text-xs text-destructive">{errors.price}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxCapacity" className="text-sm font-medium">Max Capacity *</Label>
              <Input
                id="maxCapacity"
                name="maxCapacity"
                type="number"
                min="1"
                value={formData.maxCapacity}
                onChange={handleChange}
                placeholder="6"
                className={errors.maxCapacity ? "border-destructive" : ""}
              />
              {errors.maxCapacity && (
                <p className="text-xs text-destructive">{errors.maxCapacity}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-sm font-medium">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => {
                  setFormData(prev => ({ ...prev, category: value }));
                  if (errors.category) {
                    setErrors(prev => ({ ...prev, category: '' }));
                  }
                }}
              >
                <SelectTrigger id="category" className="rounded-xl">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="water-sports">Water Sports</SelectItem>
                  <SelectItem value="transportation">Transportation</SelectItem>
                  <SelectItem value="food-dining">Food & Dining</SelectItem>
                  <SelectItem value="wellness">Wellness</SelectItem>
                  <SelectItem value="photography">Photography</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                  <SelectItem value="tours">Tours & Activities</SelectItem>
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-xs text-destructive">{errors.category}</p>
              )}
            </div>

            <Button type="submit" variant="gradient" className="w-full" size="lg">
              Save Service
            </Button>
          </form>
        </Card>
      </div>

      <VendorBottomNav />
    </div>
  );
};

export default AddService;
