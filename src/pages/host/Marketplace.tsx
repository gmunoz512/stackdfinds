import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, Heart, Loader2, Percent, Search, Store } from 'lucide-react';
import { toast } from 'sonner';
import HostBottomNav from '@/components/HostBottomNav';
import { GoogleRating } from '@/components/GoogleRating';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuthContext } from '@/contexts/AuthContext';
import { useSmartBack } from '@/hooks/use-smart-back';
import {
  MARKETPLACE_CATEGORY_FILTERS,
  marketplaceBucketFor,
  type MarketplaceCategoryFilter,
} from '@/lib/commissions';
import { resolveGoogleRating } from '@/lib/googleRating';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface MarketplaceVendor {
  id: string;
  name: string;
  category: string | null;
  commission_percentage: number | null;
  photos: string[] | null;
  google_rating: number | null;
  description: string | null;
  price_per_person: number | null;
  listing_type: string | null;
}

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

const HostMarketplace = () => {
  const goBack = useSmartBack('/host/dashboard');
  const queryClient = useQueryClient();
  const { user } = useAuthContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [category, setCategory] = useState<MarketplaceCategoryFilter>('All');

  const { data: linkedIds = new Set<string>(), isLoading: isLoadingLinks } = useQuery({
    queryKey: ['hostLinkedVendorIds', user?.id],
    queryFn: async () => {
      if (!user) return new Set<string>();
      const { data, error } = await supabase
        .from('host_vendor_links')
        .select('vendor_profile_id')
        .eq('host_user_id', user.id);

      if (error) {
        if (isMissingRelation(error)) return new Set<string>();
        console.error('host_vendor_links read failed', error);
        return new Set<string>();
      }
      return new Set((data || []).map((row) => row.vendor_profile_id));
    },
    enabled: !!user,
  });

  const {
    data: vendors = [],
    isLoading: isLoadingVendors,
    isError,
  } = useQuery({
    queryKey: ['marketplaceVendors', searchQuery],
    queryFn: async () => {
      let query = supabase
        .from('vendor_profiles')
        .select(
          'id, name, category, commission_percentage, photos, google_rating, description, price_per_person, listing_type',
        )
        .eq('is_published', true)
        .not('commission_percentage', 'is', null)
        .gt('commission_percentage', 0)
        .order('commission_percentage', { ascending: false })
        .limit(60);

      if (searchQuery.trim()) {
        query = query.ilike('name', `%${searchQuery.trim()}%`);
      }

      const { data, error } = await query;
      if (error) {
        if (isMissingRelation(error)) return [] as MarketplaceVendor[];
        console.error('marketplace vendors read failed', error);
        return [] as MarketplaceVendor[];
      }
      return (data || []) as MarketplaceVendor[];
    },
  });

  const filteredVendors = useMemo(() => {
    return vendors.filter((vendor) => {
      if (category === 'All') return true;
      return marketplaceBucketFor(vendor.category) === category;
    });
  }, [vendors, category]);

  const addVendor = useMutation({
    mutationFn: async (vendorProfileId: string) => {
      if (!user) throw new Error('Not signed in');
      const { error } = await supabase.from('host_vendor_links').insert({
        host_user_id: user.id,
        vendor_profile_id: vendorProfileId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostLinkedVendorIds'] });
      queryClient.invalidateQueries({ queryKey: ['hostLinkedVendors'] });
      toast.success('Added to your guide');
    },
    onError: (error) => {
      console.error('add vendor failed', error);
      toast.error('Could not add this vendor');
    },
  });

  const removeVendor = useMutation({
    mutationFn: async (vendorProfileId: string) => {
      if (!user) throw new Error('Not signed in');
      const { error } = await supabase
        .from('host_vendor_links')
        .delete()
        .eq('host_user_id', user.id)
        .eq('vendor_profile_id', vendorProfileId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostLinkedVendorIds'] });
      queryClient.invalidateQueries({ queryKey: ['hostLinkedVendors'] });
      toast.success('Removed from your guide');
    },
    onError: (error) => {
      console.error('remove vendor failed', error);
      toast.error('Could not remove this vendor');
    },
  });

  const isLoading = isLoadingVendors || isLoadingLinks;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-3xl px-4 py-6 space-y-5">
        <div className="space-y-3">
          <button
            type="button"
            onClick={goBack}
            className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Vendor marketplace</h1>
            <p className="text-sm text-muted-foreground">
              Browse businesses in the affiliate program and add them to your guest guide.
            </p>
          </div>
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by name"
            className="pl-10"
            aria-label="Search vendors"
          />
        </div>

        <div className="-mx-4 overflow-x-auto px-4">
          <div className="flex gap-2 pb-1">
            {MARKETPLACE_CATEGORY_FILTERS.map((chip) => {
              const active = category === chip;
              return (
                <button
                  key={chip}
                  type="button"
                  onClick={() => setCategory(chip)}
                  className={cn(
                    'shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-muted-foreground hover:text-foreground',
                  )}
                >
                  {chip}
                </button>
              );
            })}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-2xl" />
            ))}
          </div>
        ) : isError ? (
          <Card className="p-8 text-center">
            <Store className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="font-medium">Marketplace unavailable</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Vendor listings could not be loaded. Try again in a moment.
            </p>
          </Card>
        ) : filteredVendors.length === 0 ? (
          <Card className="p-8 text-center">
            <Store className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="font-medium">No affiliate vendors yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchQuery || category !== 'All'
                ? 'Try another search or category.'
                : 'Published vendors who set a host commission will show up here.'}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredVendors.map((vendor) => {
              const linked = linkedIds.has(vendor.id);
              const rating = resolveGoogleRating({ googleRating: vendor.google_rating });
              const busy =
                (addVendor.isPending && addVendor.variables === vendor.id) ||
                (removeVendor.isPending && removeVendor.variables === vendor.id);

              return (
                <Card key={vendor.id} className="overflow-hidden p-0">
                  <div className="flex gap-3 p-3">
                    <Link
                      to={`/vendor/${vendor.id}`}
                      className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-muted"
                    >
                      {vendor.photos?.[0] ? (
                        <img
                          src={vendor.photos[0]}
                          alt={vendor.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Store className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </Link>

                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link
                            to={`/vendor/${vendor.id}`}
                            className="block truncate font-semibold text-foreground hover:underline"
                          >
                            {vendor.name}
                          </Link>
                          <p className="truncate text-xs text-muted-foreground">
                            {vendor.category ||
                              (vendor.listing_type === 'restaurant' ? 'Restaurant' : 'Experience')}
                          </p>
                        </div>
                        <Badge variant="secondary" className="shrink-0 gap-1">
                          <Percent className="h-3 w-3" />
                          {vendor.commission_percentage}%
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <GoogleRating
                          value={rating}
                          showCount={false}
                          className="text-xs"
                          starClassName="h-3 w-3"
                        />
                        {vendor.price_per_person != null && (
                          <>
                            <span aria-hidden>•</span>
                            <span>Avg ${vendor.price_per_person}/person</span>
                          </>
                        )}
                      </div>

                      {vendor.description && (
                        <p className="line-clamp-2 text-xs text-muted-foreground">{vendor.description}</p>
                      )}

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <Button
                          size="sm"
                          variant={linked ? 'outline' : 'default'}
                          className="gap-1.5"
                          disabled={busy}
                          onClick={() =>
                            linked
                              ? removeVendor.mutate(vendor.id)
                              : addVendor.mutate(vendor.id)
                          }
                        >
                          {busy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : linked ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Heart className="h-4 w-4" />
                          )}
                          {linked ? 'In your guide' : 'Add to guide'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        <Card className="border-dashed bg-muted/40 p-4">
          <p className="text-sm font-medium text-foreground">How this works</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Only vendors who joined the affiliate program appear here. When a guest books through
            your guide, you earn that vendor&apos;s host commission.
          </p>
          <Link
            to="/host/vendors"
            className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
          >
            View your saved vendors
          </Link>
        </Card>
      </div>

      <HostBottomNav />
    </div>
  );
};

export default HostMarketplace;
