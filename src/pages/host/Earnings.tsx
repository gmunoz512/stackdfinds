import { useMemo, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, DollarSign, Receipt } from 'lucide-react';
import HostBottomNav from '@/components/HostBottomNav';
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
  summarizeHostEarnings,
  type AffiliateBookingRow,
  type AffiliateLedgerStatus,
  parseBookingDate,
} from '@/lib/affiliateAccounting';

type Filter = 'all' | (typeof PRIMARY_LEDGER_STATUSES)[number];

const HostEarnings = () => {
  const goBack = useSmartBack('/host/dashboard');
  const { user } = useAuthContext();
  const [filter, setFilter] = useState<Filter>('all');

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['hostAffiliateEarnings', user?.id],
    queryFn: async (): Promise<AffiliateBookingRow[]> => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('bookings')
        .select(
          'id, experience_name, vendor_name, host_payout_amount, booking_date, guests, total_amount, payment_status, payout_status, status, currency, created_at, host_user_id, vendor_profile_id, platform_fee_amount, vendor_payout_amount',
        )
        .eq('host_user_id', user.id)
        .order('booking_date', { ascending: false });

      if (error) {
        console.error('host earnings read failed', error);
        return [];
      }
      return (data || []) as AffiliateBookingRow[];
    },
    enabled: !!user,
  });

  const summary = useMemo(() => summarizeHostEarnings(rows), [rows]);
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
          <h1 className="text-2xl font-bold">Your earnings</h1>
          <p className="text-sm text-muted-foreground">
            Commission from guests who booked through your guide. You keep the full host commission —
            stackd&apos;s fee comes from the vendor.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 border-border/60">
            <p className="text-xs text-muted-foreground">Total earned</p>
            {isLoading ? (
              <Skeleton className="h-8 w-20 mt-2" />
            ) : (
              <p className="text-2xl font-bold mt-1">{formatLedgerMoney(summary.totalEarned)}</p>
            )}
          </Card>
          <Card className="p-4 border-border/60">
            <p className="text-xs text-muted-foreground">Attributed bookings</p>
            {isLoading ? (
              <Skeleton className="h-8 w-12 mt-2" />
            ) : (
              <p className="text-2xl font-bold mt-1">{summary.bookingCount}</p>
            )}
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {PRIMARY_LEDGER_STATUSES.map((status) => (
            <Card key={status} className="p-3 border-border/60">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {ledgerStatusLabel(status)}
              </p>
              {isLoading ? (
                <Skeleton className="h-5 w-12 mt-1" />
              ) : (
                <p className="text-sm font-semibold mt-1">
                  {formatLedgerMoney(summary.byStatus[status])}
                </p>
              )}
            </Card>
          ))}
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
          <h2 className="text-lg font-semibold">Bookings</h2>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <Card className="p-8 text-center space-y-3">
              <Receipt className="h-10 w-10 mx-auto text-muted-foreground" />
              <p className="font-medium text-foreground">No earnings yet</p>
              <p className="text-sm text-muted-foreground">
                When a guest books a vendor from your guide, their commission shows up here —
                pending until paid, confirmed while held, paid after payout.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {visible.map((line) => (
                <Card key={line.id} className="p-4 border-border/60">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm leading-tight truncate">
                        {line.experienceName}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">{line.vendorName}</p>
                    </div>
                    <Badge variant="outline" className={cn('shrink-0', ledgerStatusTone(line.status))}>
                      {ledgerStatusLabel(line.status)}
                    </Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {parseBookingDate(line.bookingDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                      {' · '}
                      {line.guests} {line.guests === 1 ? 'guest' : 'guests'}
                    </span>
                    <span>Booking {formatLedgerMoney(line.bookingTotal, line.currency)}</span>
                  </div>
                  <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Your commission</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                      <DollarSign className="h-3.5 w-3.5" />
                      {formatLedgerMoney(line.commissionEarned, line.currency)}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <HostBottomNav />
    </div>
  );
};

export default HostEarnings;
