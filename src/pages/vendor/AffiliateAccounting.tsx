import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Receipt } from 'lucide-react';
import VendorBottomNav from '@/components/VendorBottomNav';
import { useSmartBack } from '@/hooks/use-smart-back';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import {
  PRIMARY_LEDGER_STATUSES,
  formatLedgerMoney,
  ledgerStatusLabel,
  ledgerStatusTone,
  summarizeVendorOwed,
  type AffiliateBookingRow,
  type AffiliateLedgerStatus,
} from '@/lib/affiliateAccounting';

type Filter = 'all' | (typeof PRIMARY_LEDGER_STATUSES)[number];

const VendorAffiliateAccounting = () => {
  const goBack = useSmartBack('/vendor/dashboard');
  const { user } = useAuthContext();
  const [filter, setFilter] = useState<Filter>('all');

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['vendorAffiliateAccounting', user?.id],
    queryFn: async (): Promise<AffiliateBookingRow[]> => {
      if (!user) return [];

      const { data: vendorProfile } = await supabase
        .from('vendor_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!vendorProfile) return [];

      const { data, error } = await supabase
        .from('bookings')
        .select(
          'id, experience_name, vendor_name, host_payout_amount, booking_date, guests, total_amount, payment_status, payout_status, status, currency, created_at, host_user_id, vendor_profile_id, platform_fee_amount, vendor_payout_amount',
        )
        .eq('vendor_profile_id', vendorProfile.id)
        .order('booking_date', { ascending: false });

      if (error) {
        console.error('vendor affiliate read failed', error);
        return [];
      }
      return (data || []) as AffiliateBookingRow[];
    },
    enabled: !!user,
  });

  const summary = useMemo(() => summarizeVendorOwed(rows), [rows]);
  const visible = useMemo(() => {
    if (filter === 'all') return summary.lines;
    return summary.lines.filter((line) => line.status === filter);
  }, [summary.lines, filter]);

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
          <h1 className="text-2xl font-bold">Affiliate fees</h1>
          <p className="text-sm text-muted-foreground">
            What you owe hosts and stackd on each booking. Guests still pay your listed price —
            these come out of your payout.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <Card className="p-4 border-border/60">
            <p className="text-xs text-muted-foreground">Owed to hosts</p>
            {isLoading ? (
              <Skeleton className="h-8 w-24 mt-2" />
            ) : (
              <p className="text-2xl font-bold mt-1">
                {formatLedgerMoney(summary.totalOwedToHosts)}
              </p>
            )}
          </Card>
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 border-border/60">
              <p className="text-xs text-muted-foreground">Owed to stackd</p>
              {isLoading ? (
                <Skeleton className="h-7 w-16 mt-2" />
              ) : (
                <p className="text-xl font-bold mt-1">
                  {formatLedgerMoney(summary.totalOwedToStackd)}
                </p>
              )}
            </Card>
            <Card className="p-4 border-border/60">
              <p className="text-xs text-muted-foreground">You keep</p>
              {isLoading ? (
                <Skeleton className="h-7 w-16 mt-2" />
              ) : (
                <p className="text-xl font-bold mt-1">
                  {formatLedgerMoney(summary.totalVendorKeeps)}
                </p>
              )}
            </Card>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['all', ...PRIMARY_LEDGER_STATUSES] as Filter[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className={cn(
                'shrink-0 rounded-full px-3 py-1.5 text-xs border transition-colors',
                filter === key
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-background text-muted-foreground border-border',
              )}
            >
              {key === 'all' ? 'All' : ledgerStatusLabel(key as AffiliateLedgerStatus)}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Per booking</h2>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <Card className="p-8 text-center space-y-3">
              <Receipt className="h-10 w-10 mx-auto text-muted-foreground" />
              <p className="font-medium">No affiliate fees yet</p>
              <p className="text-sm text-muted-foreground">
                When guests book through a host&apos;s guide, you&apos;ll see host commission and
                stackd&apos;s fee for each booking here.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {visible.map((line) => (
                <Card key={line.id} className="p-4 border-border/60 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-sm truncate">{line.experienceName}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(line.bookingDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                        {' · '}
                        Booking {formatLedgerMoney(line.bookingTotal, line.currency)}
                      </p>
                    </div>
                    <Badge variant="outline" className={cn('shrink-0', ledgerStatusTone(line.status))}>
                      {ledgerStatusLabel(line.status)}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="rounded-lg bg-muted/40 p-2">
                      <p className="text-muted-foreground">Host</p>
                      <p className="font-semibold mt-0.5">
                        {formatLedgerMoney(line.owedToHost, line.currency)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-2">
                      <p className="text-muted-foreground">stackd</p>
                      <p className="font-semibold mt-0.5">
                        {formatLedgerMoney(line.owedToStackd, line.currency)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-2">
                      <p className="text-muted-foreground">You keep</p>
                      <p className="font-semibold mt-0.5">
                        {formatLedgerMoney(line.vendorKeeps, line.currency)}
                      </p>
                    </div>
                  </div>
                  {!line.hasHost && (
                    <p className="text-[11px] text-muted-foreground">
                      Direct booking — no host commission on this one.
                    </p>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <VendorBottomNav />
    </div>
  );
};

export default VendorAffiliateAccounting;
