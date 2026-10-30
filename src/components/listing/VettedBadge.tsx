import { format } from "date-fns";
import stackdSeal from "@/assets/stackd-verified-seal.png";
import { isVettedListing } from "@/lib/vetting";

interface VettedBadgeProps {
  verificationStatus?: string | null;
  verifiedAt?: string | null;
  category?: string | null;
}

export function VettedBadge({ verificationStatus, verifiedAt, category }: VettedBadgeProps) {
  if (!isVettedListing({ verificationStatus, verifiedAt })) return null;

  const when = verifiedAt ? format(new Date(verifiedAt), "MMM d, yyyy") : "";
  const kind = category?.trim() || "listing";

  return (
    <div className="py-8 space-y-3 text-center items-center bg-muted/50 rounded-2xl px-6">
      <img
        src={stackdSeal}
        alt="stackd vetted seal"
        className="h-52 w-52 object-contain mx-auto drop-shadow-lg"
      />
      <h2 className="text-[22px] font-semibold">Vetted</h2>
      <p className="text-[15px] leading-relaxed text-muted-foreground">
        An admin approved this {kind.toLowerCase()} on {when}. Approval is recorded on the listing.
      </p>
    </div>
  );
}

export default VettedBadge;
