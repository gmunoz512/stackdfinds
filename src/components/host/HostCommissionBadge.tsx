import { Percent } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatMoney, hostCommissionLabel, hostEarningsOn } from '@/lib/commissions';
import { cn } from '@/lib/utils';

interface Props {
  commission: number | null | undefined;
  showEarnings?: boolean;
  className?: string;
}

/** Host-only: the vendor's affiliate commission. Do not use on guest pages. */
export function HostCommissionBadge({ commission, showEarnings = false, className }: Props) {
  const label = hostCommissionLabel(commission);
  const earns = hostEarningsOn(commission);
  const unset = label === 'Commission not set';
  return (
    <div className={cn('flex flex-col items-end gap-0.5', className)}>
      <Badge
        variant={unset ? 'outline' : 'secondary'}
        className={cn('shrink-0 gap-1 whitespace-nowrap', unset && 'font-normal text-muted-foreground')}
      >
        {!unset && <Percent className="h-3 w-3" aria-hidden />}
        {label}
      </Badge>
      {showEarnings && earns != null && (
        <span className="whitespace-nowrap text-[11px] text-muted-foreground">
          You earn {formatMoney(earns)} per $100
        </span>
      )}
    </div>
  );
}
