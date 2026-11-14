import { useEffect, useState } from "react";
import "@/pages/auth/vendor-accounts.css";
import { stackd } from "@/integrations/stackd/client";
import { useStackdSession } from "@/contexts/StackdSessionContext";
import { stackdVendorUsername } from "@/lib/stackdUser";
import { StackdSignIn } from "@/components/stackd/StackdSignIn";

interface RequestRow {
  id: string;
  experience_title: string | null;
  requested_date: string;
  time_slot: string | null;
  guests: number;
  guest_name: string;
  guest_email: string;
  status: string;
}

export function BookingRequestsPanel() {
  const { configured, ready, user } = useStackdSession();
  const username = stackdVendorUsername(user);
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async (name: string) => {
    if (!stackd) return;
    setLoading(true);
    const { data, error: readError } = await stackd
      .from("booking_requests")
      .select("id, experience_title, requested_date, time_slot, guests, guest_name, guest_email, status")
      .eq("vendor_username", name)
      .order("created_at", { ascending: false })
      .limit(50);
    setLoading(false);
    if (readError) {
      setError("Booking requests couldn't be loaded.");
      return;
    }
    setRows((data ?? []) as RequestRow[]);
  };

  useEffect(() => {
    if (username) void load(username);
  }, [username]);

  const decide = async (id: string, status: "accepted" | "declined") => {
    if (!stackd || !username) return;
    const { error: writeError } = await stackd.from("booking_requests").update({ status }).eq("id", id);
    if (writeError) {
      setError("That status couldn't be saved.");
      return;
    }
    setRows((current) => current.map((row) => (row.id === id ? { ...row, status } : row)));
  };

  return (
    <section className="booking-requests" aria-labelledby="booking-requests-heading">
      <h2 id="booking-requests-heading">Booking requests</h2>
      <p className="va-note">No payment is taken here. Accept or decline, then send the guest payment details yourself.</p>
      {!ready ? <p className="va-note">Loading…</p> : null}
      {ready && !configured ? <p role="status">Booking requests opening soon.</p> : null}
      {ready && configured && !user ? (
        <>
          <p className="va-note">
            Sign in with your vendor username and password to see your booking requests.
          </p>
          <StackdSignIn />
        </>
      ) : null}
      {ready && configured && user && !username ? (
        <p className="va-status va-status-error" role="alert">
          This account isn't linked to a vendor listing yet. Contact stackd to link it.
        </p>
      ) : null}
      {error ? <p className="va-status va-status-error" role="alert">{error}</p> : null}
      {loading ? <p className="va-note">Loading requests…</p> : null}
      {username && !loading && rows.length === 0 ? <p className="va-note">No booking requests yet.</p> : null}
      <ul className="booking-request-list">
        {rows.map((row) => (
          <li key={row.id}>
            <p className="booking-request-title">{row.experience_title || "Experience"}</p>
            <p>{row.requested_date}{row.time_slot ? ` · ${row.time_slot}` : ""} · {row.guests} {row.guests === 1 ? "guest" : "guests"}</p>
            <p>{row.guest_name} · {row.guest_email}</p>
            <p className="booking-request-status">{row.status}</p>
            {row.status === "pending" ? (
              <div className="booking-request-actions">
                <button type="button" className="va-btn" onClick={() => void decide(row.id, "accepted")}>Accept</button>
                <button type="button" className="va-btn va-btn-ghost" onClick={() => void decide(row.id, "declined")}>Decline</button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
