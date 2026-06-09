"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isMockMode } from "@/lib/supabase/config";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isMockMode: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const mock = isMockMode();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!mock);

  useEffect(() => {
    if (mock) {
      setLoading(false);
      return;
    }

    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [mock]);

  const signOut = useCallback(async () => {
    if (mock) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
  }, [mock]);

  return (
    <AuthContext.Provider
      value={{ user, loading, isMockMode: mock, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
