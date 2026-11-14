import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Separate client for the owner's Stackd project (lryeshzwwhcdtzemeyzk).
 * The main client in src/integrations/supabase/client.ts stays on its own project.
 * Sessions use a different storage key so the two logins do not overwrite each other.
 * The anon key is public. Never put a service-role key in a VITE_ variable.
 */
const url = import.meta.env.VITE_STACKD_SUPABASE_URL || "";
const key = import.meta.env.VITE_STACKD_SUPABASE_ANON_KEY || "";

export const isStackdConfigured = Boolean(url && key);

export const STACKD_NOT_READY = "Booking requests opening soon.";

export const stackd: SupabaseClient | null = isStackdConfigured
  ? createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: "stackd-auth",
      },
    })
  : null;
