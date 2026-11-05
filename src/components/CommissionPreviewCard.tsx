import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  formatMoney,
  previewBookingSplit,
  tierLabel,
  type HostCommissionTier,
} from '@/lib/commissions';

interface CommissionPreviewCardProps {
  hostCommissionPercent: number | null | undefined;
  sampleTotal?: number;
  title?: string;
  className?: string;
}

/**
 * Shows how a sample booking splits between host, stackd, and vendor.
 * Used on vendor create-profile and the vendor dashboard.
 */
export function CommissionPreviewCard({
  hostCommissionPercent,
  sampleTotal = 100,
  title = 'Sample $100 booking',
  className,
}: CommissionPreviewCardProps) {
  const split = previewBookingSplit(sampleTotal, hostCommissionPercent ?? 0);
  const hasTier = split.hostCommissionPercent > 0;

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>
          {hasTier
            ? tierLabel(split.hostCommissionPercent as HostCommissionTier)
            : 'Pick a host commission to preview the split.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {hasTier ? (
          <dl className="grid grid-cols-1 gap-2 text-sm">
            <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2">
              <dt className="text-muted-foreground">Guest pays</dt>
              <dd className="font-semibold text-foreground">{formatMoney(split.bookingTotal)}</dd>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2">
              <dt className="text-muted-foreground">Host earns ({split.hostCommissionPercent}%)</dt>
              <dd className="font-semibold text-foreground">{formatMoney(split.hostEarns)}</dd>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-2">
              <dt className="text-muted-foreground">stackd fee ({split.platformFeePercent}%)</dt>
              <dd className="font-semibold text-foreground">{formatMoney(split.stackdEarns)}</dd>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-border px-3 py-2">
              <dt className="font-medium text-foreground">You keep</dt>
              <dd className="font-bold text-primary">{formatMoney(split.vendorKeeps)}</dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">
            Guests always pay your listed price. Host commission and the stackd fee come out of your payout.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export default CommissionPreviewCard;
