import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import {
  PRIMARY_LEDGER_STATUSES,
  formatLedgerMoney,
  ledgerStatusLabel,
  summarizeStackd,
  type AffiliateBookingRow,
} from '@/lib/affiliateAccounting';

const AffiliateSummary = () => {
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['adminAffiliateSummary'],
    queryFn: async (): Promise<AffiliateBookingRow[]> => {
      const { data, error } = await supabase
        .from('bookings')
        .select(
          'id, experience_name, vendor_name, host_payout_amount, booking_date, guests, total_amount, payment_status, payout_status, status, currency, created_at, host_user_id, vendor_profile_id, platform_fee_amount, vendor_payout_amount',
        )
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) {
        console.error('admin affiliate summary failed', error);
        return [];
      }
      return (data || []) as AffiliateBookingRow[];
    },
  });

  const summary = useMemo(() => summarizeStackd(rows), [rows]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <Link
          to="/admin/settings"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to admin
        </Link>

        <div className="space-y-1">
          <h1 className="text-2xl font-bold">Affiliate summary</h1>
          <p className="text-sm text-muted-foreground">
            Read-only view of host commissions and stackd fees from existing bookings. No payouts
            are sent from this screen.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Booking volume', value: formatLedgerMoney(summary.totalBookingVolume) },
            { label: 'stackd fees', value: formatLedgerMoney(summary.totalStackdFees) },
            { label: 'Host commissions', value: formatLedgerMoney(summary.totalHostCommissions) },
            { label: 'Vendor payouts', value: formatLedgerMoney(summary.totalVendorPayouts) },
          ].map((card) => (
            <Card key={card.label} className="p-4 border-border/60">
              <p className="text-xs text-muted-foreground">{card.label}</p>
              {isLoading ? (
                <Skeleton className="h-7 w-20 mt-2" />
              ) : (
                <p className="text-xl font-bold mt-1">{card.value}</p>
              )}
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 border-border/60">
            <p className="text-xs text-muted-foreground">Bookings counted</p>
            {isLoading ? (
              <Skeleton className="h-7 w-12 mt-2" />
            ) : (
              <p className="text-xl font-bold mt-1">{summary.bookingCount}</p>
            )}
          </Card>
          <Card className="p-4 border-border/60">
            <p className="text-xs text-muted-foreground">With host attribution</p>
            {isLoading ? (
              <Skeleton className="h-7 w-12 mt-2" />
            ) : (
              <p className="text-xl font-bold mt-1">{summary.attributedBookingCount}</p>
            )}
          </Card>
        </div>

        <Card className="p-4 border-border/60 space-y-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold">stackd fees by status</h2>
          </div>
          {isLoading ? (
            <Skeleton className="h-16 w-full" />
          ) : summary.bookingCount === 0 && rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No bookings yet. Fees appear here after guests pay.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {PRIMARY_LEDGER_STATUSES.map((status) => (
                <div key={status} className="rounded-lg bg-muted/40 p-3">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {ledgerStatusLabel(status)}
                  </p>
                  <p className="font-semibold mt-1">
                    {formatLedgerMoney(summary.byStatusFees[status])}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default AffiliateSummary;
