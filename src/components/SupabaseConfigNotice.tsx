import { supabaseConfigError } from "@/integrations/supabase/client";

/** Shown instead of the app when a production build has no Supabase env. */
export function SupabaseConfigNotice() {
  return (
    <main
      role="alert"
      style={{
        minHeight: "100vh",
        margin: 0,
        padding: "48px 24px",
        boxSizing: "border-box",
        background: "#0a0a0a",
        color: "#fafafa",
        fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ maxWidth: 520 }}>
        <p style={{ margin: "0 0 12px", letterSpacing: "0.08em", textTransform: "uppercase", fontSize: 12, color: "#a1a1aa" }}>
          stackd
        </p>
        <h1 style={{ margin: "0 0 16px", fontFamily: "'Archivo Black', sans-serif", fontSize: 32, lineHeight: 1.15 }}>
          Supabase is not configured
        </h1>
        <p style={{ margin: "0 0 16px", fontSize: 16, lineHeight: 1.5, color: "#e4e4e7" }}>
          {supabaseConfigError}
        </p>
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "#a1a1aa" }}>
          Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY</code> to the host environment, then run the production build again.
        </p>
      </div>
    </main>
  );
}
