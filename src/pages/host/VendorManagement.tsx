import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, Plus, Trash2, Store, Percent, Check, X, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";
import HostBottomNav from "@/components/HostBottomNav";
import { GoogleRating } from "@/components/GoogleRating";
import { resolveGoogleRating } from "@/lib/googleRating";

interface VendorProfile {
  id: string;
  name: string;
  category: string;
  commission_percentage: number | null;
  photos: string[] | null;
  google_rating: number | null;
  description: string | null;
}

const HostVendorManagement = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // Fetch host's linked vendors
  const { data: linkedVendors, isLoading: isLoadingLinked } = useQuery({
    queryKey: ['hostLinkedVendors', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('host_vendor_links')
        .select(`
          id,
          vendor_profile_id,
          vendor_profiles (
            id,
            name,
            category,
            commission_percentage,
            photos,
            google_rating,
            description
          )
        `)
        .eq('host_user_id', user.id);

      if (error) throw error;
      return data?.map(link => ({
        linkId: link.id,
        ...link.vendor_profiles as VendorProfile
      })) || [];
    },
    enabled: !!user,
  });

  // Fetch available vendors to add (published, with commission set)
  const { data: availableVendors, isLoading: isLoadingAvailable } = useQuery({
    queryKey: ['availableVendors', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('vendor_profiles')
        .select('id, name, category, commission_percentage, photos, google_rating, description')
        .eq('is_published', true)
        .not('commission_percentage', 'is', null)
        .gt('commission_percentage', 0);

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      const { data, error } = await query.limit(20);
      if (error) throw error;
      return data as VendorProfile[];
    },
    enabled: showSearch,
  });

  // Add vendor mutation
  const addVendor = useMutation({
    mutationFn: async (vendorProfileId: string) => {
      if (!user) throw new Error("Not authenticated");
      
      const { error } = await supabase
        .from('host_vendor_links')
        .insert({
          host_user_id: user.id,
          vendor_profile_id: vendorProfileId,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostLinkedVendors'] });
      toast.success('Vendor added to your profile!');
    },
    onError: (error) => {
      console.error('Error adding vendor:', error);
      toast.error('Failed to add vendor');
    },
  });

  // Remove vendor mutation
  const removeVendor = useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase
        .from('host_vendor_links')
        .delete()
        .eq('id', linkId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostLinkedVendors'] });
      toast.success('Vendor removed from your profile');
    },
    onError: (error) => {
      console.error('Error removing vendor:', error);
      toast.error('Failed to remove vendor');
    },
  });

  const linkedVendorIds = linkedVendors?.map(v => v.id) || [];
  const filteredAvailable = availableVendors?.filter(v => !linkedVendorIds.includes(v.id)) || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 pb-24">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-br from-brand to-hot px-4 pt-6 pb-8 rounded-b-3xl shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl bg-paper/10 backdrop-blur-sm hover:bg-paper/20 transition-all"
            >
              <ArrowLeft className="h-5 w-5 text-paper" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-paper">My Vendors</h1>
              <p className="text-sm text-paper/70">Manage vendors you earn commissions from</p>
            </div>
          </div>

          {/* Add Vendor Button */}
          <Button
            onClick={() => setShowSearch(!showSearch)}
            className="w-full bg-paper/20 backdrop-blur-sm hover:bg-paper/30 text-paper border-paper/30 gap-2"
            variant="outline"
          >
            {showSearch ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {showSearch ? 'Close Search' : 'Add Vendor'}
          </Button>
        </div>

        <div className="px-4 py-6 space-y-6">
          {/* Search Section */}
          {showSearch && (
            <Card className="p-4 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search vendors..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {isLoadingAvailable ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-xl" />
                  ))}
                </div>
              ) : filteredAvailable.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {searchQuery ? 'No vendors found' : 'All available vendors are already added'}
                </p>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {filteredAvailable.map((vendor) => (
                    <div
                      key={vendor.id}
                      className="flex items-center gap-3 p-3 rounded-xl border hover:bg-muted/50 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                        {vendor.photos && vendor.photos.length > 0 ? (
                          <img
                            src={vendor.photos[0]}
                            alt={vendor.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Store className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{vendor.name}</p>
                        <p className="text-xs text-muted-foreground">{vendor.category}</p>
                      </div>

                      <Badge className="bg-gradient-to-r from-warning to-brand text-paper">
                        {vendor.commission_percentage}%
                      </Badge>

                      <Button
                        size="sm"
                        onClick={() => addVendor.mutate(vendor.id)}
                        disabled={addVendor.isPending}
                        className="gap-1"
                      >
                        {addVendor.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                        Add
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Linked Vendors */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Your Linked Vendors</h2>
            <p className="text-sm text-muted-foreground">
              When guests book through your guide or storefront, you'll earn these commissions
            </p>

            {isLoadingLinked ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))}
              </div>
            ) : linkedVendors?.length === 0 ? (
              <Card className="p-8 text-center">
                <Store className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="font-medium mb-1">No vendors linked yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Add vendors to start earning commissions
                </p>
                <Button onClick={() => setShowSearch(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Your First Vendor
                </Button>
              </Card>
            ) : (
              <div className="space-y-3">
                {linkedVendors?.map((vendor) => (
                  <Card
                    key={vendor.id}
                    className="p-4 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
                        {vendor.photos && vendor.photos.length > 0 ? (
                          <img
                            src={vendor.photos[0]}
                            alt={vendor.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Store className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold">{vendor.name}</p>
                            <p className="text-xs text-muted-foreground">{vendor.category}</p>
                          </div>
                          <Badge className="bg-gradient-to-r from-success to-mint text-paper text-lg px-3">
                            {vendor.commission_percentage}%
                          </Badge>
                        </div>

                        <div className="flex items-center gap-3 mt-2">
                          <GoogleRating
                            value={resolveGoogleRating({ googleRating: vendor.google_rating })}
                            showCount={false}
                            className="text-xs text-muted-foreground"
                            starClassName="h-3 w-3"
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1 ml-auto"
                            onClick={() => removeVendor.mutate(vendor.linkId)}
                            disabled={removeVendor.isPending}
                          >
                            {removeVendor.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Info Card */}
          <Card className="p-4 bg-muted/50 border-dashed">
            <div className="flex items-start gap-3">
              <Percent className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div className="text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">How commissions work</p>
                <p>
                  When a guest books through your guest guide or storefront link, you automatically earn the vendor's set commission percentage. Payments are sent directly to your connected Stripe account.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <HostBottomNav />
    </div>
  );
};

export default HostVendorManagement;
