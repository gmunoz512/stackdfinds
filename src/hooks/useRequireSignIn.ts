import { useLocation, useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { SIGN_IN_COPY, signInPath, type SignInAction } from "@/lib/authGate";

/**
 * Signed-out guests can browse. Call this only for book, save, and pay.
 * Returns true when the action may continue.
 */
export function useRequireSignIn() {
  const { isAuthenticated, isLoading } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();

  const requireSignIn = (action: SignInAction) => {
    if (isLoading) return false;
    if (isAuthenticated) return true;
    toast("Sign in required", { description: SIGN_IN_COPY[action] });
    navigate(signInPath(`${location.pathname}${location.search}`));
    return false;
  };

  return { isAuthenticated, isLoading, requireSignIn };
}
