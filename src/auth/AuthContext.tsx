import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { ADMIN_EMAIL, supabase } from "@/lib/supabase";

type AuthState = {
  loading: boolean;
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  needsMfa: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

async function readState() {
  const [{ data: sessionData }, { data: aalData }] = await Promise.all([
    supabase.auth.getSession(),
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
  ]);
  const session = sessionData.session;
  const user = session?.user ?? null;
  const email = user?.email?.toLowerCase() ?? "";
  const isAdmin = email === ADMIN_EMAIL;
  const needsMfa = !!user && isAdmin && aalData.currentLevel !== "aal2";
  return { session, user, isAdmin, needsMfa };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [needsMfa, setNeedsMfa] = useState(false);

  const refresh = async () => {
    setLoading(true);
    const state = await readState();
    setSession(state.session);
    setUser(state.user);
    setIsAdmin(state.isAdmin);
    setNeedsMfa(state.needsMfa);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
    const { data } = supabase.auth.onAuthStateChange(() => {
      refresh();
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      loading,
      user,
      session,
      isAdmin,
      needsMfa,
      refresh,
      signOut: async () => {
        await supabase.auth.signOut();
      },
    }),
    [loading, user, session, isAdmin, needsMfa]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

