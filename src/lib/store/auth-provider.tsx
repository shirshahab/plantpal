"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isMockMode } from "@/lib/supabase/config";
import { clearLocalProfile } from "@/lib/profile/user-profile";
import { hydrateProfileFromCloud } from "@/lib/profile/cloud-profile";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  /**
   * True once the local profile has been synced with the cloud profile for
   * the current session. Guards must wait for this before deciding whether
   * the user needs onboarding, otherwise a freshly signed-in user with an
   * empty localStorage gets bounced to onboarding before hydration lands.
   */
  profileReady: boolean;
  isMockMode: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const mock = isMockMode();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!mock);
  const [profileReady, setProfileReady] = useState(mock);
  // Avoid re-hydrating on every TOKEN_REFRESHED event for the same user.
  const hydratedForUser = useRef<string | null>(null);

  useEffect(() => {
    if (mock) {
      setLoading(false);
      setProfileReady(true);
      return;
    }

    const supabase = createClient();

    async function syncFor(nextUser: User | null) {
      if (!nextUser) {
        hydratedForUser.current = null;
        setProfileReady(true);
        return;
      }
      if (hydratedForUser.current === nextUser.id) {
        setProfileReady(true);
        return;
      }
      const snapshot = await hydrateProfileFromCloud();
      if (snapshot.status === "error") {
        console.warn("[auth] profile hydration failed:", snapshot.error);
      } else {
        hydratedForUser.current = nextUser.id;
      }
      setProfileReady(true);
    }

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
      void syncFor(data.user);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      setLoading(false);
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        void syncFor(nextUser);
      }
    });

    return () => subscription.unsubscribe();
  }, [mock]);

  const signOut = useCallback(async () => {
    if (mock) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    clearLocalProfile();
    hydratedForUser.current = null;
    setUser(null);
  }, [mock]);

  return (
    <AuthContext.Provider
      value={{ user, loading, profileReady, isMockMode: mock, signOut }}
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
