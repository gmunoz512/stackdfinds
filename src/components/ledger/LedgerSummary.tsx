import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type LedgerSummaryProps = {
  released: string;
  upcoming: string;
  loading: boolean;
  releasedNote: string;
  upcomingNote: string;
};

/** Released is the figure you read first. Upcoming sits under it, quieter. */
export function LedgerSummary({
  released,
  upcoming,
  loading,
  releasedNote,
  upcomingNote,
}: LedgerSummaryProps) {
  return (
    <Card className="ledger-card border-border/60 p-4">
      <p className="text-sm text-muted-foreground">Released</p>
      {loading ? <Skeleton className="mt-2 h-9 w-28" /> : <p className="ledger-figure">{released}</p>}
      <p className="mt-1 text-xs leading-snug text-muted-foreground">{releasedNote}</p>
      <div className="mt-4 flex items-end justify-between gap-3 border-t border-border/60 pt-3">
        <div className="min-w-0">
          <p className="text-sm text-muted-foreground">Upcoming</p>
          <p className="text-xs leading-snug text-muted-foreground">{upcomingNote}</p>
        </div>
        {loading ? <Skeleton className="h-6 w-16 shrink-0" /> : <p className="ledger-figure-quiet">{upcoming}</p>}
      </div>
    </Card>
  );
}
