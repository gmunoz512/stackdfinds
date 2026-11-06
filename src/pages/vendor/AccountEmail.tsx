import { Link, useSearchParams } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import AddEmailForm from "@/components/vendor/AddEmailForm";
import { preferredEmail } from "@/lib/vendorAccounts";
import "../auth/vendor-accounts.css";

// /vendor/account-email: vendors add or change the email they actually read.
const AccountEmail = () => {
  const { user } = useAuthContext();
  const [params] = useSearchParams();
  const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const username = typeof meta.username === "string" ? meta.username : null;
  const current = preferredEmail(user);
  const pending = (user as { new_email?: string } | null)?.new_email ?? null;

  return (
    <main className="va-page">
      <div className="va-panel">
        <Link to="/vendor/settings" className="va-back">← Settings</Link>
        <h1 className="va-title">Your email</h1>
        {params.get("confirmed") && current
          ? <p className="va-sub">Confirmed. You can now sign in with {current}{username ? ` or ${username}` : ""}.</p>
          : <p className="va-sub">{username ? <>You sign in as <strong>{username}</strong>. </> : null}Add an email so booking updates and password resets reach you.</p>}
        <AddEmailForm current={current} pending={pending} username={username} />
      </div>
    </main>
  );
};

export default AccountEmail;
