import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const configuredUrl = import.meta.env.VITE_SUPABASE_URL || "";
const configuredKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";

export const isSupabaseConfigured = Boolean(configuredUrl && configuredKey);

const missingVars = [
  configuredUrl ? null : "VITE_SUPABASE_URL",
  configuredKey ? null : "VITE_SUPABASE_PUBLISHABLE_KEY",
].filter((name): name is string => Boolean(name));

export const supabaseConfigError = isSupabaseConfigured
  ? null
  : `Missing ${missingVars.join(" and ")}. Set both in the environment and rebuild.`;

if (supabaseConfigError) {
  console.error(
    `[stackd] ${supabaseConfigError}` +
      (import.meta.env.DEV
        ? " Dev is using the local Supabase fallback at http://127.0.0.1:54321."
        : " Production will not call Supabase until both values are set."),
  );
}

const devFallbackUrl = "http://127.0.0.1:54321";
const devFallbackKey = "missing-publishable-key";

export const SUPABASE_URL =
  configuredUrl || (import.meta.env.DEV ? devFallbackUrl : "");
export const SUPABASE_PUBLISHABLE_KEY =
  configuredKey || (import.meta.env.DEV ? devFallbackKey : "");

export const supabase = createClient<Database>(
  SUPABASE_URL || "https://supabase-not-configured.invalid",
  SUPABASE_PUBLISHABLE_KEY || "supabase-not-configured",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  },
);
