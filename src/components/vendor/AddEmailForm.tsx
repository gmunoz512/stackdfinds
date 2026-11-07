import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { emailSchema } from "@/lib/validations";
import { isHiddenLoginEmail } from "@/lib/vendorAccounts";

type Props = {
  current: string | null;      // the vendor's confirmed real email, if any
  pending: string | null;      // waiting for confirmation
  username: string | null;
  onSkip?: () => void;         // shown only in the first-login flow
  onDone?: () => void;
};

// Adds or changes a vendor's own email. Supabase emails a confirmation link to
// the new address; until it's clicked, the old login (username) keeps working.
const AddEmailForm = ({ current, pending, username, onSkip, onDone }: Props) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = emailSchema.safeParse(email.trim());
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    if (isHiddenLoginEmail(parsed.data)) return setError("Use an email you can read");
    if (current && parsed.data.toLowerCase() === current.toLowerCase()) return setError("That's already your email");
    setSaving(true);
    const { error: err } = await supabase.auth.updateUser(
      { email: parsed.data },
      { emailRedirectTo: `${window.location.origin}/vendor/account-email?confirmed=1` },
    );
    setSaving(false);
    if (err) return setError(/already|registered|exists/i.test(err.message) ? "That email is already used by another account" : err.message);
    setSentTo(parsed.data);
  };

  if (sentTo) {
    return (
      <div>
        <p className="va-status va-status-success" role="status">Confirmation link sent to <strong>{sentTo}</strong>.</p>
        <p className="va-sub">Open it to finish. Until then, keep signing in with {username ? <>your username <strong>{username}</strong></> : "your current login"}.</p>
        {onDone && <button className="va-btn" type="button" onClick={onDone}>Continue</button>}
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      {(current || pending) && (
        <dl className="va-result">
          {current && <div className="va-row"><div><dt>Email on file</dt><dd>{current}</dd></div></div>}
          {pending && <div className="va-row"><div><dt>Waiting for you to confirm</dt><dd>{pending}</dd></div></div>}
        </dl>
      )}
      <label className="va-field">
        {current ? "New email" : "Your email"}
        <input type="email" autoComplete="email" inputMode="email" value={email} aria-invalid={error ? true : undefined} onChange={(e) => { setEmail(e.target.value); if (error) setError(null); }} placeholder="you@example.com" maxLength={255} />
        <span className="va-hint">For booking updates and password resets. You can still sign in with your username.</span>
      </label>
      {error && <p className="va-status va-status-error" role="alert">{error}</p>}
      <button className="va-btn" type="submit" disabled={saving || !email.trim()}>{saving ? "Sending…" : "Send confirmation link"}</button>
      {onSkip && <button className="va-btn va-btn-ghost" type="button" onClick={onSkip}>Skip for now</button>}
    </form>
  );
};

export default AddEmailForm;
