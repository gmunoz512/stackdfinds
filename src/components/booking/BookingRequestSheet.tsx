import { useMemo, useState, type FormEvent } from "react";
import "@/pages/auth/vendor-accounts.css";
import { useSearchParams } from "react-router-dom";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { stackd, STACKD_NOT_READY } from "@/integrations/stackd/client";
import type { AirbnbExperience } from "@/data/airbnbExperiences.generated";
import {
  guestFacingBreakdown,
  guestLimit,
  prepareBookingRequest,
  timeSlotsFor,
  type CatalogListing,
} from "@/lib/bookingRequest";
import { listingPriceBreakdown } from "@/lib/experiencePrice";
import { resolveHostAttribution } from "@/lib/guestBooking";

function toListing(experience: AirbnbExperience): CatalogListing {
  return {
    id: experience.id,
    username: experience.username,
    title: experience.title,
    price: experience.price,
    groupSize: experience.groupSize,
    times: null,
    commissionPercentage: null,
  };
}

export function BookingRequestButton({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button type="button" className={className ?? "booking-request-button"} onClick={onClick}>
      Request to book
    </button>
  );
}

export function BookingRequestSheet({
  experience,
  open,
  onOpenChange,
}: {
  experience: AirbnbExperience;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [params] = useSearchParams();
  const limits = guestLimit(experience.groupSize);
  const slots = timeSlotsFor(null);
  const [date, setDate] = useState("");
  const [timeSlot, setTimeSlot] = useState(slots[0] ?? "");
  const [guests, setGuests] = useState(limits.min);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sent, setSent] = useState(false);
  const [hostRef] = useState(() => resolveHostAttribution(params.get("host")));
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Cancun" });
  const party = Math.min(limits.max, Math.max(limits.min, guests));
  const summary = experience.price ? listingPriceBreakdown(experience.price, party) : null;
  const listing = useMemo(() => toListing(experience), [experience]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!stackd) {
      setError(STACKD_NOT_READY);
      return;
    }
    const prepared = prepareBookingRequest(
      {
        vendorUsername: experience.username,
        experienceId: experience.id,
        requestedDate: date,
        timeSlot,
        guests: party,
        guestName: name,
        guestEmail: email,
        guestPhone: phone,
        notes,
        hostRef,
      },
      listing,
    );
    if (prepared.ok === false) {
      setError(prepared.error);
      return;
    }
    setSaving(true);
    const { data, error: invokeError } = await stackd.functions.invoke("create-booking-request", {
      body: {
        vendorUsername: experience.username,
        experienceId: experience.id,
        requestedDate: date,
        timeSlot,
        guests: party,
        guestName: name,
        guestEmail: email,
        guestPhone: phone,
        notes,
        hostRef,
      },
    });
    setSaving(false);
    if (invokeError || !data?.id) {
      const message = typeof data?.error === "string" ? data.error : "";
      setError(message || "We couldn't send that request. Try again.");
      return;
    }
    setSent(true);
  };

  const shown = summary ? guestFacingBreakdown({
    priceOnRequest: false,
    guests: summary.guests,
    subtotal: summary.subtotal,
    fees: summary.fees,
    total: summary.total,
    minimum: summary.minimum,
    currency: experience.price?.currency ?? null,
    amountPerGuest: experience.price?.amount ?? null,
    totalAmount: null,
    from: experience.price?.from ?? false,
  }) : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="booking-sheet">
        <SheetHeader>
          <SheetTitle className="booking-sheet-title">{sent ? "Request sent" : "Request to book"}</SheetTitle>
          <SheetDescription className="booking-sheet-copy">
            No payment now. The vendor confirms availability, then you'll get payment details.
          </SheetDescription>
        </SheetHeader>
        {!stackd ? <p className="booking-soon" role="status">{STACKD_NOT_READY}</p> : null}
        {sent ? (
          <p className="va-status va-status-success" role="status">
            {experience.businessName} has your request for {date} at {timeSlot}. Nothing has been charged.
          </p>
        ) : (
          <form className="booking-form" onSubmit={submit} noValidate>
            <label className="va-field">
              Date
              <input type="date" min={today} value={date} required onChange={(event) => setDate(event.target.value)} />
            </label>
            <label className="va-field">
              Time
              <select value={timeSlot} onChange={(event) => setTimeSlot(event.target.value)}>
                {slots.map((slot) => (
                  <option key={slot} value={slot}>{slot}</option>
                ))}
              </select>
            </label>
            <div className="va-field">
              Guests
              <span className="detail-guests">
                <button type="button" aria-label="Fewer guests" onClick={() => setGuests((count) => Math.max(limits.min, count - 1))} disabled={party <= limits.min}>−</button>
                <span>{party}</span>
                <button type="button" aria-label="More guests" onClick={() => setGuests((count) => Math.min(limits.max, count + 1))} disabled={party >= limits.max}>+</button>
              </span>
            </div>
            {shown?.subtotal ? (
              <dl className="booking-breakdown" aria-label="Price summary">
                <div><dt>Guests</dt><dd>{shown.guests}</dd></div>
                <div><dt>Subtotal</dt><dd>{shown.subtotal}</dd></div>
                <div><dt>Service fees</dt><dd>{shown.fees}</dd></div>
                {shown.minimum ? <div><dt>Minimum to book</dt><dd>{shown.minimum}</dd></div> : null}
                <div className="detail-total"><dt>Total</dt><dd>{shown.total}</dd></div>
              </dl>
            ) : (
              <p className="va-note">Price on request. The vendor will confirm the total.</p>
            )}
            <label className="va-field">
              Name
              <input value={name} autoComplete="name" onChange={(event) => setName(event.target.value)} required />
            </label>
            <label className="va-field">
              Email
              <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
            <label className="va-field">
              Phone <span className="va-hint">optional</span>
              <input type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} />
            </label>
            <label className="va-field">
              Note <span className="va-hint">optional</span>
              <textarea maxLength={1000} rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} />
            </label>
            {error ? <p className="va-status va-status-error" role="alert">{error}</p> : null}
            <button className="va-btn" type="submit" disabled={!stackd || saving}>{saving ? "Sending…" : "Send request"}</button>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}

