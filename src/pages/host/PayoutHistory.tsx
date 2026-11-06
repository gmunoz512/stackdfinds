import '@/styles/ledger.css';
import { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Receipt } from 'lucide-react';
import HostBottomNav from '@/components/HostBottomNav';
import { useSmartBack } from '@/hooks/use-smart-back';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  formatLedgerMoney,
  ledgerStatusLabel,
  ledgerStatusTone,
  summarizeHostEarnings,
  type AffiliateBookingRow,
  parseBookingDate,
} from '@/lib/affiliateAccounting';

const PayoutHistory = () => {
  const goBack = useSmartBack('/host/profile');
  const { user } = useAuthContext();

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['hostPayoutHistory', user?.id],
    queryFn: async (): Promise<AffiliateBookingRow[]> => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('bookings')
        .select(
          'id, booking_date, experience_name, total_amount, host_payout_amount, payout_status, payment_status, status, currency, created_at, vendor_name, guests, host_user_id, vendor_profile_id, platform_fee_amount, vendor_payout_amount',
        )
        .eq('host_user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('host payout history failed', error);
        return [];
      }
      return (data || []) as AffiliateBookingRow[];
    },
    enabled: !!user,
  });

  const summary = useMemo(() => summarizeHostEarnings(rows), [rows]);

  return (
    <div className="stackd-ledger min-h-screen pb-24">
      <div className="max-w-[375px] mx-auto px-4 py-6 space-y-6">
        <button
          onClick={goBack}
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors active:scale-95"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Profile
        </button>

        <div className="space-y-1">
          <h1 className="text-2xl font-normal">Payout history</h1>
          <p className="text-sm text-muted-foreground">
            Same bookings as{' '}
            <Link to="/host/earnings" className="underline underline-offset-2">
              Your earnings
            </Link>
            . Commission is held until 24 hours after the reservation, then released. Read-only —
            nothing is paid out from here.
          </p>
        </div>

        {!isLoading && summary.lines.length > 0 && (
          <Card className="p-4 border-border/60 ledger-card">
            <p className="text-sm text-muted-foreground">Total earned</p>
            <p className="text-2xl font-normal">{formatLedgerMoney(summary.totalEarned)}</p>
          </Card>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : summary.lines.length === 0 ? (
          <Card className="p-8 text-center space-y-4">
            <Receipt className="h-12 w-12 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-semibold">No payouts yet</h3>
            <p className="text-sm text-muted-foreground">
              Payouts appear after guests book through your guide.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {summary.lines.map((line) => (
              <Card key={line.id} className="p-4 border-border/60 space-y-2">
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <h3 className="font-medium truncate">{line.experienceName}</h3>
                    <p className="text-xs text-muted-foreground">via {line.vendorName}</p>
                  </div>
                  <Badge variant="outline" className={cn(ledgerStatusTone(line.status))}>
                    {ledgerStatusLabel(line.status)}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-border/50">
                  <span className="text-muted-foreground">
                    {parseBookingDate(line.bookingDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                  <span className="font-medium">
                    {formatLedgerMoney(line.commissionEarned, line.currency)}
                  </span>
                </div>
                {(line.status === 'upcoming' || line.status === 'released') && (
                  <p className="text-[11px] text-muted-foreground">
                    {line.status === 'upcoming' ? `Releases ${line.releaseDate}` : `Released ${line.releaseDate}`}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
      <HostBottomNav />
    </div>
  );
};

export default PayoutHistory;
