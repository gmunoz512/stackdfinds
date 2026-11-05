import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Store, Percent } from "lucide-react";
import { Link } from "react-router-dom";
import HostBottomNav from "@/components/HostBottomNav";
import { useSmartBack } from "@/hooks/use-smart-back";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const isMissingRelation = (error: { code?: string; message?: string } | null) => {
  if (!error) return false;
  const msg = (error.message || '').toLowerCase();
  return (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    msg.includes('does not exist') ||
    msg.includes('could not find the table')
  );
};

const HostActiveVendors = () => {
  const goBack = useSmartBack("/host/dashboard");
  const { user } = useAuthContext();

  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ['hostLinkedVendorsActive', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data: links, error: linksError } = await supabase
        .from('host_vendor_links')
        .select('vendor_profile_id')
        .eq('host_user_id', user.id);

      if (linksError) {
        if (isMissingRelation(linksError)) return [];
        console.error('host_vendor_links read failed', linksError);
        return [];
      }

      if (!links || links.length === 0) return [];

      const vendorIds = links.map(l => l.vendor_profile_id);

      // commission_percentage is the live affiliate rate vendors set at onboarding.
      // Do not use host_commission_percentage (legacy / unused for payouts).
      const { data: profiles, error: profilesError } = await supabase
        .from('vendor_profiles')
        .select('id, name, category, description, commission_percentage')
        .in('id', vendorIds);

      if (profilesError) {
        if (isMissingRelation(profilesError)) return [];
        console.error('vendor_profiles read failed', profilesError);
        return [];
      }

      return profiles || [];
    },
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-[375px] mx-auto px-4 py-6 space-y-6">
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
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Partner with vendors to earn commissions on guest referrals
              </p>
              <Button asChild>
                <Link to="/host/marketplace">Browse marketplace</Link>
              </Button>
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
                          {vendor.commission_percentage ?? '—'}
                          {vendor.commission_percentage != null ? '%' : ''}
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
