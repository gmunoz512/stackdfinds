import { Navigate, useLocation } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { mustChangePassword, SET_PASSWORD_PATH } from "@/lib/vendorAccounts";

const ALLOWED = new Set([SET_PASSWORD_PATH, "/signout", "/sign-out"]);

/** While the signed-in user still has a temporary password, every route redirects to Set Your Password. */
const MustChangePasswordGate = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuthContext();
  const { pathname } = useLocation();
  if (mustChangePassword(user) && !ALLOWED.has(pathname)) return <Navigate to={SET_PASSWORD_PATH} replace />;
  return <>{children}</>;
};

export default MustChangePasswordGate;
