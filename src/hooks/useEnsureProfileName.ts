import { useEffect } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useProfile } from "@/contexts/ProfileContext";
import { supabase } from "@/integrations/supabase/client";

type EnsureProfileNameInput = {
  firstName?: string | null;
  lastName?: string | null;
};

/**
 * Ensures `profiles.full_name` is populated for the currently signed-in user.
 * This is required for public pages (like /guide/:hostId) which read the host name from the backend.
 */
export function useEnsureProfileName({ firstName, lastName }: EnsureProfileNameInput) {
  const { user } = useAuthContext();
  const { profile } = useProfile();

  useEffect(() => {
    const derived = `${(firstName || "").trim()} ${(lastName || "").trim()}`.trim();
    if (!user) return;
    if (!derived) return;
    if (profile?.full_name && profile.full_name.trim()) return;

    (async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: derived })
        .eq("user_id", user.id);

      if (error) {
        // eslint-disable-next-line no-console
        console.error("useEnsureProfileName: failed to set full_name", error);
      }
    })();
  }, [user, profile?.full_name, firstName, lastName]);
}
