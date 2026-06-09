import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase as createSupabaseClient } from "@/lib/supabase";
import { isSupabaseConfigured as isConfigured } from "@/lib/config";

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  mockMode: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const mockMode = !isConfigured();

  useEffect(() => {
    const supabase = createSupabaseClient();
    if (!supabase) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = createSupabaseClient();
    if (!supabase) return { error: "Supabase not configured" };
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const supabase = createSupabaseClient();
    if (!supabase) return { error: "Supabase not configured" };
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message };
  }, []);

  const signOut = useCallback(async () => {
    const supabase = createSupabaseClient();
    await supabase?.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      session,
      loading,
      mockMode,
      signIn,
      signUp,
      signOut,
    }),
    [session, loading, mockMode, signIn, signUp, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
