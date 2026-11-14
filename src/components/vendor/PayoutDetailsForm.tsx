import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import "@/pages/auth/vendor-accounts.css";
import { stackd } from "@/integrations/stackd/client";
import { useStackdSession } from "@/contexts/StackdSessionContext";
import { stackdVendorUsername } from "@/lib/stackdUser";
import { StackdSignIn } from "@/components/stackd/StackdSignIn";
import {
  maskAccountNumber,
  validatePayoutDetails,
  type PayoutDraft,
  type PayoutMethod,
} from "@/lib/payoutDetails";

const EMPTY: PayoutDraft = {
  payoutMethod: "",
  accountHolderName: "",
  country: "",
  currency: "",
  bankName: "",
  clabe: "",
  routingNumber: "",
  accountNumber: "",
  iban: "",
  swift: "",
  payoutEmail: "",
};

export function PayoutDetailsForm({ onSkip, onSaved }: { onSkip?: () => void; onSaved?: () => void }) {
  const { configured, ready, user } = useStackdSession();
  const username = stackdVendorUsername(user);
  const [draft, setDraft] = useState<PayoutDraft>(EMPTY);
  const savedSecrets = useRef({ clabe: "", routingNumber: "", accountNumber: "", iban: "" });
  const [savedMask, setSavedMask] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!stackd || !username) return;
    let live = true;
    stackd
      .from("vendor_payout_details")
      .select("payout_method, account_holder_name, country, currency, bank_name, clabe, routing_number, account_number, iban, swift, payout_email")
      .eq("vendor_username", username)
      .maybeSingle()
      .then(({ data }) => {
        if (!live || !data) return;
        const secret = data.clabe || data.account_number || data.iban;
        savedSecrets.current = {
          clabe: data.clabe || "",
          routingNumber: data.routing_number || "",
          accountNumber: data.account_number || "",
          iban: data.iban || "",
        };
        setSavedMask(maskAccountNumber(secret));
        setDraft((current) => ({
          ...current,
          payoutMethod: (data.payout_method as PayoutMethod) || "",
          accountHolderName: data.account_holder_name || "",
          country: data.country || "",
          currency: data.currency || "",
          bankName: data.bank_name || "",
          swift: data.swift || "",
          payoutEmail: data.payout_email || "",
          clabe: "",
          routingNumber: "",
          accountNumber: "",
          iban: "",
        }));
      });
    return () => {
      live = false;
    };
  }, [username]);

  const set = (key: keyof PayoutDraft) => (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setDraft((current) => ({ ...current, [key]: event.target.value }));
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setStatus(null);
    if (!configured || !stackd) {
      setError("Payout details opening soon.");
      return;
    }
    if (!username) {
      setError("This account isn't linked to a vendor listing yet. Contact stackd to link it.");
      return;
    }
    const parsed = validatePayoutDetails({
      ...draft,
      clabe: draft.clabe || savedSecrets.current.clabe,
      routingNumber: draft.routingNumber || savedSecrets.current.routingNumber,
      accountNumber: draft.accountNumber || savedSecrets.current.accountNumber,
      iban: draft.iban || savedSecrets.current.iban,
    });
    if (parsed.ok === false) {
      setError(parsed.error);
      return;
    }
    setSaving(true);
    const { error: writeError } = await stackd.from("vendor_payout_details").upsert({
      vendor_username: username,
      ...parsed.row,
    });
    setSaving(false);
    if (writeError) {
      setError("We couldn't save those details. Check the numbers and try again.");
      return;
    }
    const secret = parsed.row.clabe || parsed.row.account_number || parsed.row.iban;
    savedSecrets.current = {
      clabe: parsed.row.clabe || "",
      routingNumber: parsed.row.routing_number || "",
      accountNumber: parsed.row.account_number || "",
      iban: parsed.row.iban || "",
    };
    setSavedMask(maskAccountNumber(secret));
    setDraft((current) => ({ ...current, clabe: "", routingNumber: "", accountNumber: "", iban: "" }));
    setStatus("Saved. The account number is hidden except for the last 4 digits.");
    onSaved?.();
  };

  if (!ready) return <p className="va-note">Loading payout details…</p>;
  if (!configured) return <p className="va-note" role="status">Payout details opening soon.</p>;

  return (
    <div className="payout-details">
      <p className="va-note">Payouts are sent after the experience, 24h after the reservation.</p>
      <p className="va-note">These details stay private. Guests and hosts never see them.</p>
      {!user ? <StackdSignIn /> : null}
      {user && !username ? (
        <p className="va-status va-status-error" role="alert">
          Signed in on Stackd, but this user has no app_metadata.vendor_username. That claim is set on the server, the same way vendor username logins work, and it has to match the catalog username.
        </p>
      ) : null}
      {user && username ? (
        <form onSubmit={save} noValidate>
          {savedMask ? <p className="va-status va-status-success" role="status">Saved account ending {savedMask}</p> : null}
          <label className="va-field">
            How you get paid
            <select value={draft.payoutMethod} onChange={set("payoutMethod")} required>
              <option value="">Choose one</option>
              <option value="bank_transfer_mx_clabe">Mexican bank (CLABE)</option>
              <option value="bank_transfer_us_ach">US bank (ACH)</option>
              <option value="bank_transfer_iban">IBAN</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="va-field">
            Name on the account
            <input value={draft.accountHolderName} onChange={set("accountHolderName")} autoComplete="name" />
          </label>
          <label className="va-field">
            Country <span className="va-hint">optional, two letters</span>
            <input value={draft.country} onChange={set("country")} maxLength={2} />
          </label>
          <label className="va-field">
            Currency <span className="va-hint">optional, three letters</span>
            <input value={draft.currency} onChange={set("currency")} maxLength={3} />
          </label>
          <label className="va-field">
            Bank <span className="va-hint">optional</span>
            <input value={draft.bankName} onChange={set("bankName")} />
          </label>
          {draft.payoutMethod === "bank_transfer_mx_clabe" ? (
            <label className="va-field">
              CLABE
              <input inputMode="numeric" autoComplete="off" value={draft.clabe} onChange={set("clabe")} />
            </label>
          ) : null}
          {draft.payoutMethod === "bank_transfer_us_ach" ? (
            <>
              <label className="va-field">
                Routing number
                <input inputMode="numeric" autoComplete="off" value={draft.routingNumber} onChange={set("routingNumber")} />
              </label>
              <label className="va-field">
                Account number
                <input inputMode="numeric" autoComplete="off" value={draft.accountNumber} onChange={set("accountNumber")} />
              </label>
            </>
          ) : null}
          {draft.payoutMethod === "bank_transfer_iban" ? (
            <>
              <label className="va-field">
                IBAN
                <input autoComplete="off" value={draft.iban} onChange={set("iban")} />
              </label>
              <label className="va-field">
                SWIFT <span className="va-hint">optional</span>
                <input value={draft.swift} onChange={set("swift")} />
              </label>
            </>
          ) : null}
          <label className="va-field">
            Payout email <span className="va-hint">optional</span>
            <input type="email" value={draft.payoutEmail} onChange={set("payoutEmail")} />
          </label>
          {error ? <p className="va-status va-status-error" role="alert">{error}</p> : null}
          {status ? <p className="va-status va-status-success" role="status">{status}</p> : null}
          <button className="va-btn" type="submit" disabled={saving}>{saving ? "Saving…" : "Save payout details"}</button>
        </form>
      ) : null}
      {onSkip ? <button className="va-btn va-btn-ghost" type="button" onClick={onSkip}>Add later</button> : null}
    </div>
  );
}
