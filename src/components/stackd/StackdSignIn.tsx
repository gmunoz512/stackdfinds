import { useState, type FormEvent } from "react";
import "@/pages/auth/vendor-accounts.css";
import { stackd } from "@/integrations/stackd/client";
import { signInWithIdentifier } from "@/lib/vendorSignIn";

/**
 * Inline sign-in for booking requests, payouts and host pages. Uses the same
 * login as the rest of the site (email, or vendor username via
 * vendor-username-sign-in).
 */
export function StackdSignIn({
  onSignedIn,
}: {
  onSignedIn?: () => void;
}) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!stackd) return;
    setError(null);
    const value = identifier.trim();
    if (!value || password.length < 6) {
      setError("Enter your email or username and your password.");
      return;
    }
    setSaving(true);
    const { error: signError } = await signInWithIdentifier(value, password);
    setSaving(false);
    if (signError) {
      setError("That email or username and password didn't match.");
      return;
    }
    onSignedIn?.();
  };

  return (
    <form onSubmit={submit} noValidate>
      <label className="va-field">
        Email or username
        <input value={identifier} autoComplete="username" onChange={(event) => setIdentifier(event.target.value)} />
      </label>
      <label className="va-field">
        Password
        <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} />
      </label>
      {error ? <p className="va-status va-status-error" role="alert">{error}</p> : null}
      <button className="va-btn" type="submit" disabled={saving}>{saving ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}
