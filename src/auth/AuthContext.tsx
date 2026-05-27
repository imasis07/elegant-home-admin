import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { ADMIN_EMAIL, supabase } from "@/lib/supabase";

const TEST_BYPASS_KEY = "cervizo-test-bypass";

function createTestUser(): User {
  const timestamp = new Date().toISOString();
  return {
    id: "test-bypass-user",
    app_metadata: {},
    user_metadata: { email: ADMIN_EMAIL },
    aud: "authenticated",
    created_at: timestamp,
    updated_at: timestamp,
    email: ADMIN_EMAIL,
    role: "authenticated",
    confirmation_sent_at: null,
    confirmed_at: timestamp,
    last_sign_in_at: timestamp,
    phone: "",
    identities: [],
    factors: [],
    recovery_sent_at: null,
    email_confirmed_at: timestamp,
    phone_confirmed_at: null,
    banned_until: null,
    invited_at: null,
    action_link: null,
    is_anonymous: false,
  } as User;
}

type AuthState = {
  loading: boolean;
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  needsMfa: boolean;
  refresh: () => Promise<void>;
  enableTestBypass: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

async function readState() {
  if (window.sessionStorage.getItem(TEST_BYPASS_KEY) === "1") {
    const user = createTestUser();
    return {
      session: { access_token: "test-bypass", refresh_token: "test-bypass", user } as Session,
      user,
      isAdmin: true,
      needsMfa: false,
    };
  }

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

  const enableTestBypass = async () => {
    window.sessionStorage.setItem(TEST_BYPASS_KEY, "1");
    await refresh();
  };

  const disableTestBypass = async () => {
    window.sessionStorage.removeItem(TEST_BYPASS_KEY);
    await supabase.auth.signOut();
    await refresh();
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
      enableTestBypass,
      signOut: async () => {
        await disableTestBypass();
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

