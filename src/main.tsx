import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { SupabaseConfigNotice } from "@/components/SupabaseConfigNotice";
import { isSupabaseConfigured } from "@/integrations/supabase/client";
import "./index.css";

const root = document.getElementById("root")!;
const showConfigNotice = !isSupabaseConfigured && !import.meta.env.DEV;

createRoot(root).render(showConfigNotice ? <SupabaseConfigNotice /> : <App />);
