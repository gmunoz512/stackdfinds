import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { passwordSchema } from "@/lib/validations";
import { mustChangePassword, preferredEmail } from "@/lib/vendorAccounts";
import AddEmailForm from "@/components/vendor/AddEmailForm";
import { PayoutDetailsForm } from "@/components/vendor/PayoutDetailsForm";
import { VendorSetupSteps } from "@/components/vendor/VendorSetupSteps";
import "./vendor-accounts.css";

// First-login screen for admin-created vendor accounts. Step 1 (password) has
// no skip: MustChangePasswordGate sends every other route here until it's done.
// Step 2 (add your email) is optional.
const SetPassword = () => {
  const { user, isAuthenticated, isLoading } = useAuthContext();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<"password" | "email" | "payout">("password");
  const finish = () => navigate("/vendor/edit-profile", { replace: true });
  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const username = typeof meta.username === "string" ? meta.username : null;

  if (step === "payout") {
    return (
      <main className="va-page">
        <div className="va-panel">
          <div className="va-wordmark">stackd</div>
          <VendorSetupSteps step={3} />
          <p className="va-steps">Step 3 of 3 · optional</p>
          <h1 className="va-title">How you get paid</h1>
          <PayoutDetailsForm onSkip={finish} onSaved={finish} />
        </div>
      </main>
    );
  }

  if (step === "email") {
    return (
      <main className="va-page">
        <div className="va-panel">
          <div className="va-wordmark">stackd</div>
          <VendorSetupSteps step={2} />
          <p className="va-steps">Step 2 of 3 · optional</p>
          <h1 className="va-title">Add your email</h1>
          <p className="va-status va-status-success" role="status">Password saved.</p>
          <p className="va-sub">Add an email so booking updates and password resets reach you. You can do this later in Settings.</p>
          <AddEmailForm current={preferredEmail(user)} pending={null} username={username} onSkip={() => setStep("payout")} onDone={() => setStep("payout")} />
        </div>
      </main>
    );
  }

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
    if (preferredEmail(user)) return setStep("payout");
    setStep("email");
  };

  return (
    <main className="va-page">
      <form className="va-panel" onSubmit={submit} noValidate>
        <div className="va-wordmark">stackd</div>
        <VendorSetupSteps step={1} />
        <p className="va-steps">Step 1 of 3</p>
        <h1 className="va-title">Set your password</h1>
        <p className="va-sub">{username ? <>Signed in as <strong>{username}</strong>. </> : null}You used a temporary password. Choose your own to finish setting up your vendor page.</p>
        <label className="va-field">
          New password
          <input type="password" autoComplete="new-password" value={password} aria-invalid={error ? true : undefined} onChange={(e) => { setPassword(e.target.value); if (error) setError(null); }} />
          <span className="va-hint">6 to 72 characters</span>
        </label>
        <label className="va-field">
          Confirm password
          <input type="password" autoComplete="new-password" value={confirm} aria-invalid={error ? true : undefined} onChange={(e) => { setConfirm(e.target.value); if (error) setError(null); }} />
        </label>
        {error && <p className="va-status va-status-error" role="alert">{error}</p>}
        <button className="va-btn" type="submit" disabled={saving || !password || !confirm}>
          {saving ? "Saving…" : "Save password"}
        </button>
      </form>
    </main>
  );
};

export default SetPassword;
