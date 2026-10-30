import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import HostBottomNav from "@/components/HostBottomNav";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { vendorSchema, type VendorFormData } from "@/lib/validations";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { useSmartBack } from "@/hooks/use-smart-back";

const AddVendor = () => {
  const navigate = useNavigate();
  const goBack = useSmartBack("/host/vendors");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<VendorFormData>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      vendorName: "",
      vendorEmail: "",
      category: "",
      commission: "",
      recommendation: "",
    },
  });

  const handleSubmit = async (data: VendorFormData) => {
    setIsSubmitting(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Please sign in with a Supabase account", {
          description: "Visit /auth/host to create an account"
        });
        navigate('/auth/host');
        return;
      }

      const { error } = await supabase.from('vendors').insert({
        user_id: user.id,
        name: data.vendorName.trim(),
        email: data.vendorEmail.trim(),
        category: data.category,
        commission: parseFloat(data.commission),
        description: data.recommendation.trim(),
      });

      if (error) {
        throw error;
      }

      toast.success("Vendor added successfully!");
      navigate('/host/vendors');
    } catch (error) {
      const message = error instanceof Error ? error.message : "Please try again";
      toast.error("Failed to add vendor", {
        description: message
      });
    } finally {
      setIsSubmitting(false);
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
          Back to Vendors
        </button>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Add New Vendor</h1>
          <p className="text-sm text-muted-foreground">Invite a local service provider</p>
        </div>

        <Card className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="vendorName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Vendor Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Ocean Adventures" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vendorEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Vendor Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="contact@oceanadventures.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="commission"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Proposed Commission (%)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="20"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Vendor must accept this rate. Typical range: 15–25%.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recommendation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Why recommend them?</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell your guests why you recommend this vendor..."
                        rows={4}
                        className="rounded-xl resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button 
                type="submit" 
                variant="gradient" 
                className="w-full" 
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send Invitation"}
              </Button>
            </form>
          </Form>
        </Card>
      </div>

      <HostBottomNav />
    </div>
  );
};

export default AddVendor;
