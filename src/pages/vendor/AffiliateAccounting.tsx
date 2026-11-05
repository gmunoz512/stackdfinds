import '@/styles/ledger.css';
import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Wallet } from 'lucide-react';
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
  summarizeVendorPayouts,
  type AffiliateBookingRow,
  type AffiliateLedgerStatus,
  parseBookingDate,
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
        console.error('vendor payout read failed', error);
        return [];
      }
      return (data || []) as AffiliateBookingRow[];
    },
    enabled: !!user,
  });

  const summary = useMemo(() => summarizeVendorPayouts(rows), [rows]);
  const visible = useMemo(() => {
    if (filter === 'all') return summary.lines;
    return summary.lines.filter((line) => line.status === filter);
  }, [summary.lines, filter]);

  return (
    <div className="stackd-ledger min-h-screen pb-24">
      <div className="max-w-[375px] mx-auto px-4 py-6 space-y-6">
        <button
          onClick={goBack}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors active:scale-95"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </button>

        <div className="space-y-1">
          <h1 className="text-2xl font-normal">Your payouts</h1>
          <p className="text-sm text-muted-foreground">
            Guests pay your listed price. Host commission and stackd&apos;s fee come out of the
            payout. Money is held until 24 hours after the reservation date, then released.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 border-border/60 ledger-card">
            <p className="text-xs text-muted-foreground">Upcoming</p>
            {isLoading ? (
              <Skeleton className="h-8 w-20 mt-2" />
            ) : (
              <p className="text-2xl font-normal mt-1">
                {formatLedgerMoney(summary.totalUpcoming)}
              </p>
            )}
          </Card>
          <Card className="p-4 border-border/60 ledger-card">
            <p className="text-xs text-muted-foreground">Released</p>
            {isLoading ? (
              <Skeleton className="h-8 w-20 mt-2" />
            ) : (
              <p className="text-2xl font-normal mt-1">
                {formatLedgerMoney(summary.totalReleased)}
              </p>
            )}
          </Card>
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
          <h2 className="text-lg font-normal">Per booking</h2>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <Card className="p-8 text-center space-y-3 ledger-card">
              <Wallet className="h-10 w-10 mx-auto text-muted-foreground" />
              <p className="font-medium">No payouts yet</p>
              <p className="text-sm text-muted-foreground">
                When guests book, you&apos;ll see upcoming and released payouts here — net of host
                commission and stackd&apos;s fee.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {visible.map((line) => (
                <Card key={line.id} className="p-4 border-border/60 space-y-3 ledger-card">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-medium text-sm truncate">{line.experienceName}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Reservation{' '}
                        {parseBookingDate(line.bookingDate).toLocaleDateString('en-US', {
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
                  <div className="flex items-center justify-between text-sm pt-1 border-t border-border/50">
                    <span className="text-muted-foreground">You receive</span>
                    <span className="font-medium">
                      {formatLedgerMoney(line.vendorReceives, line.currency)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="rounded-lg bg-muted/40 p-2">
                      <p className="text-muted-foreground">Host commission</p>
                      <p className="font-medium mt-0.5">
                        {formatLedgerMoney(line.hostCommission, line.currency)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-2">
                      <p className="text-muted-foreground">stackd fee</p>
                      <p className="font-medium mt-0.5">
                        {formatLedgerMoney(line.stackdFee, line.currency)}
                      </p>
                    </div>
                  </div>
                  {line.status === 'upcoming' && (
                    <p className="text-[11px] text-muted-foreground">
                      Releases {line.releaseDate} (24 hours after the reservation).
                    </p>
                  )}
                  {line.status === 'released' && (
                    <p className="text-[11px] text-muted-foreground">
                      Released on {line.releaseDate}.
                    </p>
                  )}
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
