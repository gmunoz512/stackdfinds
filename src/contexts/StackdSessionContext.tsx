import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { isStackdConfigured, stackd } from "@/integrations/stackd/client";

interface StackdSessionValue {
  configured: boolean;
  ready: boolean;
  user: User | null;
}

const StackdSessionContext = createContext<StackdSessionValue>({
  configured: false,
  ready: false,
  user: null,
});

export function StackdSessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!isStackdConfigured);

  useEffect(() => {
    if (!stackd) return;
    let live = true;
    stackd.auth.getSession().then(({ data }) => {
      if (!live) return;
      setUser(data.session?.user ?? null);
      setReady(true);
    });
    const { data } = stackd.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setReady(true);
    });
    return () => {
      live = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return (
    <StackdSessionContext.Provider value={{ configured: isStackdConfigured, ready, user }}>
      {children}
    </StackdSessionContext.Provider>
  );
}

export function useStackdSession() {
  return useContext(StackdSessionContext);
}
