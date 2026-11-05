import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { pickVendorEmail } from "@/lib/vendorAccounts";
import "../auth/vendor-accounts.css";

const CATEGORIES = ["experience", "restaurant", "tour", "wellness", "transport", "other"];
type Created = { email: string; password: string };

// Admin-only (wrapped in ProtectedAdminRoute). Calls the create-vendor-account
// edge function; the password lives only in this component's state.
const NewVendorAccount = () => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("experience");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Created | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const preview = pickVendorEmail(name, new Set());

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const { data, error: err } = await supabase.functions.invoke("create-vendor-account", { body: { name, category } });
    setSaving(false);
    if (err || !data?.email) return setError(data?.error ?? "Couldn't create the account. Is the function deployed?");
    setCreated({ email: data.email, password: data.password });
  };

  const copy = async (label: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  const reset = () => { setCreated(null); setName(""); setCopied(null); };

  return (
    <main className="va-page">
      <div className="va-panel">
        <div className="va-wordmark">stackd admin</div>
        {created ? (
          <>
            <h1 className="va-title">Vendor account ready</h1>
            <p className="va-sub">Send these to the vendor. They'll be asked to pick their own password the first time they sign in.</p>
            <dl className="va-result">
              {([["Email", created.email], ["Temporary password", created.password]] as const).map(([label, value]) => (
                <div className="va-row" key={label}>
                  <div><dt>{label}</dt><dd>{value}</dd></div>
                  <button type="button" className="va-copy" onClick={() => copy(label, value)}>{copied === label ? "Copied" : "Copy"}</button>
                </div>
              ))}
            </dl>
            <p className="va-note">This password is shown once and isn't saved anywhere. If it's lost, create a new account or send a password reset.</p>
            <button className="va-btn va-btn-ghost" type="button" onClick={reset}>Add another vendor</button>
          </>
        ) : (
          <form onSubmit={submit} noValidate>
            <h1 className="va-title">Add a vendor</h1>
            <p className="va-sub">Creates their login and a draft vendor page they can fill in.</p>
            <label className="va-field">
              Vendor name
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tacos Numero Uno" maxLength={120} />
              <span className="va-hint">{preview ? `Login: ${preview} (a number is added if it's taken)` : "Letters or numbers needed"}</span>
            </label>
            <label className="va-field">
              Category
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>)}
              </select>
            </label>
            {error && <p className="va-error" role="alert">{error}</p>}
            <button className="va-btn" type="submit" disabled={saving || !preview}>{saving ? "Creating…" : "Create account"}</button>
          </form>
        )}
      </div>
    </main>
  );
};

export default NewVendorAccount;
