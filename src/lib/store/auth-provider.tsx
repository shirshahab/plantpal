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
import { clearLocalProfile, clearAllUserLocalData } from "@/lib/profile/user-profile";
import { hydrateProfileFromCloud, type CloudProfileSnapshot } from "@/lib/profile/cloud-profile";
import { repairProfileOnLogin } from "@/lib/social/repair-profile";
import { migrateLocalDataToCloud } from "@/lib/storage/local-to-cloud-migration";
import { hydrateHealthReportsFromCloud } from "@/lib/health/report-storage";
import { purgeCorruptPlantPalStorage } from "@/lib/storage/safe-local-storage";

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
  /** Cloud onboarding flag after hydration. Logged-in users: cloud always wins. */
  cloudOnboardingComplete: boolean | null;
  profileSnapshot: CloudProfileSnapshot | null;
  isMockMode: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const mock = isMockMode();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(!mock);
  const [profileReady, setProfileReady] = useState(mock);
  const [profileSnapshot, setProfileSnapshot] = useState<CloudProfileSnapshot | null>(
    mock ? { status: "local", onboardingComplete: false } : null
  );
  // Avoid re-hydrating on every TOKEN_REFRESHED event for the same user.
  const hydratedForUser = useRef<string | null>(null);

  useEffect(() => {
    if (mock) {
      setLoading(false);
      setProfileReady(true);
      return;
    }

    const supabase = createClient();
    purgeCorruptPlantPalStorage();

    async function syncFor(nextUser: User | null) {
      if (!nextUser) {
        hydratedForUser.current = null;
        setProfileSnapshot(null);
        setProfileReady(true);
        return;
      }
      if (hydratedForUser.current === nextUser.id) {
        setProfileReady(true);
        return;
      }
      const snapshot = await hydrateProfileFromCloud();
      setProfileSnapshot(snapshot);
      await repairProfileOnLogin();
      if (nextUser.id) {
        void migrateLocalDataToCloud(nextUser.id);
        void hydrateHealthReportsFromCloud(nextUser.id);
      }
      if (snapshot.status === "error") {
        console.warn("[auth] profile hydration failed:", snapshot.error);
      } else {
        hydratedForUser.current = nextUser.id;
      }
      setProfileReady(true);
    }

    async function resolveSession() {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          console.warn("[auth] session check failed:", error.message);
          purgeCorruptPlantPalStorage();
          await supabase.auth.signOut({ scope: "local" });
          setUser(null);
          setProfileReady(true);
          setLoading(false);
          return;
        }
        setUser(data.user);
        setLoading(false);
        await syncFor(data.user);
      } catch (err) {
        console.warn("[auth] session recovery:", err);
        purgeCorruptPlantPalStorage();
        setUser(null);
        setProfileReady(true);
        setLoading(false);
      }
    }

    void resolveSession();

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
    clearAllUserLocalData();
    hydratedForUser.current = null;
    setUser(null);
  }, [mock]);

  const cloudOnboardingComplete =
    profileSnapshot?.onboardingComplete ??
    (profileSnapshot?.status === "local" ? null : null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        profileReady,
        cloudOnboardingComplete,
        profileSnapshot,
        isMockMode: mock,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useOptionalAuth(): AuthContextValue | null {
  return useContext(AuthContext);
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
