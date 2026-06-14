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
import { clearAllUserLocalData } from "@/lib/profile/user-profile";
import { hydrateProfileFromCloud, type CloudProfileSnapshot } from "@/lib/profile/cloud-profile";
import { repairProfileOnLogin } from "@/lib/social/repair-profile";
import { migrateLocalDataToCloud } from "@/lib/storage/local-to-cloud-migration";
import { hydrateHealthReportsFromCloud } from "@/lib/health/report-storage";
import { readClientSession } from "@/lib/auth/session";
import {
  startSessionWatchdog,
  traceAuthEvent,
} from "@/lib/auth/lifecycle-trace";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  /** True after the first session read finishes — gates route access. */
  sessionReady: boolean;
  profileReady: boolean;
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
  const [sessionReady, setSessionReady] = useState(mock);
  const [profileReady, setProfileReady] = useState(mock);
  const [profileSnapshot, setProfileSnapshot] = useState<CloudProfileSnapshot | null>(
    mock ? { status: "local", onboardingComplete: false } : null
  );
  const hydratedForUser = useRef<string | null>(null);
  const syncInFlight = useRef<string | null>(null);

  useEffect(() => {
    if (mock) {
      setLoading(false);
      setSessionReady(true);
      setProfileReady(true);
      return;
    }

    const supabase = createClient();

    async function syncFor(nextUser: User | null) {
      if (!nextUser) {
        hydratedForUser.current = null;
        setProfileSnapshot(null);
        setProfileReady(true);
        return;
      }

      if (
        hydratedForUser.current === nextUser.id &&
        syncInFlight.current !== nextUser.id
      ) {
        setProfileReady(true);
        return;
      }

      syncInFlight.current = nextUser.id;
      try {
        const snapshot = await hydrateProfileFromCloud();
        setProfileSnapshot(snapshot);
        await repairProfileOnLogin();
        void migrateLocalDataToCloud(nextUser.id);
        void hydrateHealthReportsFromCloud(nextUser.id);
        hydratedForUser.current = nextUser.id;
      } catch (err) {
        console.warn("[auth] profile sync failed:", err);
      } finally {
        syncInFlight.current = null;
        setProfileReady(true);
      }
    }

    async function resolveSession() {
      try {
        const snapshot = await readClientSession(supabase);
        traceAuthEvent({
          event: snapshot.sessionExists ? "SESSION_CONFIRMED" : "ONBOARDING_STATUS",
          hasSession: snapshot.sessionExists,
          userId: snapshot.user?.id,
          reason: snapshot.errorMessage ?? "initial read",
        });

        if (snapshot.sessionExists && snapshot.user) {
          setUser(snapshot.user);
          setLoading(false);
          setSessionReady(true);
          queueMicrotask(() => {
            void syncFor(snapshot.user);
          });
          return;
        }

        setUser(null);
        setProfileReady(true);
        setLoading(false);
        setSessionReady(true);
      } catch (err) {
        console.warn("[auth] session read failed:", err);
        setUser(null);
        setProfileReady(true);
        setLoading(false);
        setSessionReady(true);
      }
    }

    void resolveSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const nextUser = session?.user ?? null;

      traceAuthEvent({
        event: "AUTH_STATE_CHANGED",
        hasSession: Boolean(session),
        userId: nextUser?.id,
        reason: event,
      });

      if (event === "SIGNED_OUT") {
        hydratedForUser.current = null;
        setUser(null);
        setProfileSnapshot(null);
        setProfileReady(true);
        setLoading(false);
        setSessionReady(true);
        return;
      }

      if (nextUser) {
        setUser(nextUser);
        setLoading(false);
        setSessionReady(true);
      }

      if (event === "TOKEN_REFRESHED") {
        return;
      }

      if (
        event === "SIGNED_IN" ||
        event === "INITIAL_SESSION" ||
        event === "USER_UPDATED"
      ) {
        if (event === "SIGNED_IN" && nextUser) {
          traceAuthEvent({
            event: "SIGN_IN_SUCCESS",
            hasSession: true,
            userId: nextUser.id,
          });
          startSessionWatchdog(
            async () => {
              const { data } = await supabase.auth.getSession();
              return Boolean(data.session?.user?.id);
            },
            { userId: nextUser.id }
          );
        }

        // Never call Supabase auth APIs synchronously inside this callback (deadlock).
        queueMicrotask(() => {
          void syncFor(nextUser);
        });
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
    setProfileSnapshot(null);
    setProfileReady(true);
    setSessionReady(true);
  }, [mock]);

  const cloudOnboardingComplete = profileSnapshot?.onboardingComplete ?? null;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        sessionReady,
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
