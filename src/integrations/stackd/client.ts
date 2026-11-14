import type { SupabaseClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/integrations/supabase/client";

/**
 * The whole app now runs on the Stackd project (lryeshzwwhcdtzemeyzk), so the
 * booking request, payout and host page features share the main client and
 * its single login session. This module stays as a thin alias so those
 * features keep their imports.
 */
export const isStackdConfigured = isSupabaseConfigured;

export const STACKD_NOT_READY = "Booking requests opening soon.";

export const stackd: SupabaseClient | null = isStackdConfigured
  ? (supabase as unknown as SupabaseClient)
  : null;
