import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { normalizeUsername, suggestUsername, usernameError } from "@/lib/vendorAccounts";
import "../auth/vendor-accounts.css";

const CATEGORIES = ["experience", "restaurant", "tour", "wellness", "transport", "other"];
type Created = { username: string; password: string };

// Admin-only (wrapped in ProtectedAdminRoute). Calls the create-vendor-account
// edge function; the password lives only in this component's state.
const NewVendorAccount = () => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("experience");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<Created | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  // Suggested from the name until the admin edits it by hand.
  const [usernameInput, setUsernameInput] = useState("");
  const [edited, setEdited] = useState(false);
  const username = normalizeUsername(edited ? usernameInput : suggestUsername(name));
  const usernameProblem = username ? usernameError(username) : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const { data, error: err } = await supabase.functions.invoke("create-vendor-account", { body: { name, category, username } });
    setSaving(false);
    if (err || !data?.username) return setError(data?.error ?? "Couldn't create the account. Is the function deployed?");
    setCreated({ username: data.username, password: data.password });
  };

  const copy = async (label: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  const reset = () => { setCreated(null); setName(""); setUsernameInput(""); setEdited(false); setCopied(null); };

  return (
    <main className="va-page">
      <div className="va-panel">
        <div className="va-wordmark">stackd admin</div>
        {created ? (
          <>
            <h1 className="va-title">Vendor account ready</h1>
            <p className="va-sub">Give these to the vendor. They sign in at stackdfinds.com/auth with the username, then pick their own password.</p>
            <dl className="va-result">
              {([["Username", created.username], ["Temporary password", created.password]] as const).map(([label, value]) => (
                <div className="va-row" key={label}>
                  <div><dt>{label}</dt><dd>{value}</dd></div>
                  <button type="button" className="va-copy" onClick={() => copy(label, value)}>{copied === label ? "Copied" : "Copy"}</button>
                </div>
              ))}
            </dl>
            <p className="va-note">This password is shown once and isn't saved anywhere. If it's lost, make a new account for them.</p>
            <button className="va-btn va-btn-ghost" type="button" onClick={reset}>Add another vendor</button>
          </>
        ) : (
          <form onSubmit={submit} noValidate>
            <h1 className="va-title">Add a vendor</h1>
            <p className="va-sub">Creates a username login and a draft vendor page they can fill in. No email needed.</p>
            <label className="va-field">
              Vendor name
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tacos Numero Uno" maxLength={120} />
            </label>
            <label className="va-field">
              Username
              <input value={edited ? usernameInput : username} onChange={(e) => { setEdited(true); setUsernameInput(e.target.value); }}
                placeholder="tacos-numero-uno" maxLength={30} autoCapitalize="none" autoComplete="off" spellCheck={false} />
              <span className="va-hint">{usernameProblem ?? "Lowercase letters, numbers and dashes. You can change it."}</span>
            </label>
            <label className="va-field">
              Category
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>)}
              </select>
            </label>
            {error && <p className="va-error" role="alert">{error}</p>}
            <button className="va-btn" type="submit" disabled={saving || !name.trim() || !username || !!usernameProblem}>{saving ? "Creating…" : "Create account"}</button>
          </form>
        )}
      </div>
    </main>
  );
};

export default NewVendorAccount;
