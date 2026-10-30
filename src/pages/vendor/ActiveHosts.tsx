import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Users } from "lucide-react";
import VendorBottomNav from "@/components/VendorBottomNav";
import { useSmartBack } from "@/hooks/use-smart-back";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

const ActiveHosts = () => {
  const goBack = useSmartBack("/vendor/dashboard");
  const { user } = useAuthContext();

  const { data: hosts = [], isLoading } = useQuery({
    queryKey: ['vendorActiveHosts', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get vendor profile
      const { data: vendorProfile } = await supabase
        .from('vendor_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!vendorProfile) return [];

      // Fetch host links for this vendor
      const { data: hostLinks } = await supabase
        .from('host_vendor_links')
        .select('host_user_id, created_at')
        .eq('vendor_profile_id', vendorProfile.id);

      if (!hostLinks || hostLinks.length === 0) return [];

      // Fetch host profiles
      const hostUserIds = hostLinks.map(link => link.host_user_id);
      const { data: hostProfiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email')
        .in('user_id', hostUserIds);

      return hostLinks.map(link => {
        const profile = hostProfiles?.find(p => p.user_id === link.host_user_id);
        return {
          id: link.host_user_id,
          name: profile?.full_name || 'Host',
          email: profile?.email || '',
          joinedAt: link.created_at,
        };
      });
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-[375px] mx-auto px-4 py-6 space-y-6">
        <button 
          onClick={goBack}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors active:scale-95"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </button>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Active Hosts</h1>
          <p className="text-sm text-muted-foreground">Your partner hosts</p>
        </div>

        <div className="space-y-3 max-h-[calc(100vh-240px)] overflow-y-auto">
          {isLoading ? (
            <>
              {[1, 2].map((i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-start gap-3">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                </Card>
              ))}
            </>
          ) : hosts.length === 0 ? (
            <Card className="p-6 text-center">
              <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground text-sm">No active hosts yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Hosts who add you to their recommended vendors will appear here
              </p>
            </Card>
          ) : (
            hosts.map((host) => (
              <Card
                key={host.id}
                className="p-4 hover:shadow-xl transition-all duration-200 hover:scale-[1.01] active:scale-95"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12 flex-shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-brand-light via-hot to-iris-strong text-paper font-semibold">
                      {host.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm leading-tight">{host.name}</h3>
                    {host.email && (
                      <p className="text-xs text-muted-foreground mt-1">{host.email}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Partnered since {new Date(host.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      <VendorBottomNav />
    </div>
  );
};

export default ActiveHosts;