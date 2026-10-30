import { Link } from "react-router-dom";

interface RefundPolicyProps {
  cancellationHours?: number | null;
}

export function RefundPolicy({ cancellationHours }: RefundPolicyProps) {
  const hasWindow = typeof cancellationHours === "number" && Number.isFinite(cancellationHours);

  return (
    <section className="py-6 space-y-3" aria-labelledby="refund-policy-heading">
      <h2 id="refund-policy-heading" className="text-[22px] font-semibold">
        Refund policy
      </h2>
      <p className="text-[15px] leading-relaxed text-muted-foreground">
        {hasWindow
          ? `This listing uses a ${cancellationHours}-hour cancellation window. A refund depends on that window and the platform policy.`
          : "A refund depends on the cancellation window stored for this listing and the platform policy."}
      </p>
      <Link
        to="/terms#cancellation"
        className="inline-block text-[15px] font-semibold underline underline-offset-4"
      >
        Read the refund and cancellation policy
      </Link>
    </section>
  );
}
