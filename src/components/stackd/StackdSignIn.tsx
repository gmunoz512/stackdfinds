import { useState, type FormEvent } from "react";
import "@/pages/auth/vendor-accounts.css";
import { stackd } from "@/integrations/stackd/client";
import { normalizeUsername, usernameError, usernameLoginEmail } from "@/lib/vendorAccounts";

/**
 * Signs in against the Stackd project only. It does not call the main app's
 * Supabase client or vendor-username-sign-in on that other project.
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
    const email = value.includes("@")
      ? value
      : (() => {
          const username = normalizeUsername(value);
          return usernameError(username) ? "" : usernameLoginEmail(username);
        })();
    if (!email || password.length < 6) {
      setError("Enter the email or username and password for the Stackd account.");
      return;
    }
    setSaving(true);
    const { error: signError } = await stackd.auth.signInWithPassword({ email, password });
    setSaving(false);
    if (signError) {
      setError("That Stackd sign-in didn't work. The account has to exist on the Stackd project.");
      return;
    }
    onSignedIn?.();
  };

  return (
    <form onSubmit={submit} noValidate>
      <p className="va-note">
        This sign-in is for the Stackd project. It is separate from the account you use on the rest of stackd.
      </p>
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
