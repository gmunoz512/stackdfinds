import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { passwordSchema } from "@/lib/validations";
import { mustChangePassword } from "@/lib/vendorAccounts";
import "./vendor-accounts.css";

// First-login screen for admin-created vendor accounts. No skip, no back link:
// MustChangePasswordGate sends every other route here until this succeeds.
const SetPassword = () => {
  const { user, isAuthenticated, isLoading } = useAuthContext();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  if (!isLoading && !isAuthenticated) return <Navigate to="/auth" replace />;
  if (!isLoading && user && !mustChangePassword(user)) return <Navigate to="/vendor/edit-profile" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    if (password !== confirm) return setError("Passwords don't match");
    setSaving(true);
    const { error: err } = await supabase.auth.updateUser({ password, data: { must_change_password: false } });
    setSaving(false);
    if (err) {
      const leaked = /breach|leaked|been found/i.test(err.message);
      const same = /different from the old|same password/i.test(err.message);
      return setError(leaked ? "That password showed up in a data breach. Pick another one."
        : same ? "Pick a password different from the one you were given."
        : err.message);
    }
    navigate("/vendor/edit-profile", { replace: true });
  };

  return (
    <main className="va-page">
      <form className="va-panel" onSubmit={submit} noValidate>
        <div className="va-wordmark">stackd</div>
        <h1 className="va-title">Set your password</h1>
        <p className="va-sub">You signed in with a temporary password. Choose your own to finish setting up your vendor page.</p>
        <label className="va-field">
          New password
          <input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <span className="va-hint">6 to 72 characters</span>
        </label>
        <label className="va-field">
          Confirm password
          <input type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </label>
        {error && <p className="va-error" role="alert">{error}</p>}
        <button className="va-btn" type="submit" disabled={saving || !password || !confirm}>
          {saving ? "Saving…" : "Save password"}
        </button>
      </form>
    </main>
  );
};

export default SetPassword;
