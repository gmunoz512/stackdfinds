import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Store, Percent } from "lucide-react";
import HostBottomNav from "@/components/HostBottomNav";
import { useSmartBack } from "@/hooks/use-smart-back";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";

const HostActiveVendors = () => {
  const goBack = useSmartBack("/host/dashboard");
  const { user } = useAuthContext();

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ['hostLinkedVendors', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get linked vendor IDs
      const { data: links } = await supabase
        .from('host_vendor_links')
        .select('vendor_profile_id')
        .eq('host_user_id', user.id);

      if (!links || links.length === 0) return [];

      const vendorIds = links.map(l => l.vendor_profile_id);

      // Fetch vendor profiles
      const { data: profiles } = await supabase
        .from('vendor_profiles')
        .select('id, name, category, description, host_commission_percentage')
        .in('id', vendorIds);

      return profiles || [];
    },
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-[375px] mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="space-y-4">
          <button
            onClick={goBack}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
          <div>
            <h1 className="text-2xl font-bold">Active Vendors</h1>
            <p className="text-sm text-muted-foreground">Your partner vendors</p>
          </div>
        </div>

        {/* Vendors List */}
        <div className="space-y-3">
          {isLoading ? (
            <>
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
              ))}
            </>
          ) : vendors.length === 0 ? (
            <Card className="p-8 text-center">
              <Store className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="font-medium text-foreground">No linked vendors yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Partner with vendors to earn commissions on guest referrals
              </p>
            </Card>
          ) : (
            vendors.map((vendor) => (
              <Card key={vendor.id} className="p-4 hover:shadow-xl transition-all duration-200">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-base">{vendor.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{vendor.description || vendor.category}</p>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                        <Store className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{vendor.category}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Commission</p>
                      <div className="flex items-center gap-1">
                        <Percent className="h-3 w-3 text-primary" />
                        <p className="text-sm font-bold text-primary">
                          {vendor.host_commission_percentage || 15}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      <HostBottomNav />
    </div>
  );
};

export default HostActiveVendors;
