"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { loadUserProfile, isOnboardingComplete } from "@/lib/profile/user-profile";
import { useOptionalAuth } from "@/lib/store/auth-provider";

interface DebugState {
  session: boolean;
  userId: string | null;
  profileLoaded: boolean;
  profileRow: "yes" | "no" | "error" | "n/a";
  cloudOnboarding: boolean | null;
  localOnboarding: boolean;
  onboardingSource: string;
  redirectDecision: string;
  mode: "cloud" | "local";
}

/**
 * Development-only auth state readout. Renders nothing in production.
 * Safe on routes outside AuthProvider (e.g. /onboarding).
 */
export function AuthDebug() {
  if (process.env.NODE_ENV !== "development") return null;
  return <AuthDebugInner />;
}

function AuthDebugInner() {
  const auth = useOptionalAuth();
  const [state, setState] = useState<DebugState | null>(null);
  const [open, setOpen] = useState(true);

  const profileSnapshot = auth?.profileSnapshot ?? null;
  const cloudOnboardingComplete = auth?.cloudOnboardingComplete ?? null;
  const profileReady = auth?.profileReady ?? true;

  useEffect(() => {
    let cancelled = false;

    async function read() {
      const configured = isSupabaseConfigured();
      const local = loadUserProfile();

      if (!configured) {
        if (!cancelled) {
          setState({
            session: false,
            userId: null,
            profileLoaded: true,
            profileRow: "n/a",
            cloudOnboarding: null,
            localOnboarding: local.onboardingComplete,
            onboardingSource: "local",
            redirectDecision: local.onboardingComplete ? "app" : "onboarding",
            mode: "local",
          });
        }
        return;
      }

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      let profileRow: DebugState["profileRow"] = "n/a";
      let cloudOnboarding: boolean | null = null;
      if (user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("onboarding_complete")
          .eq("id", user.id)
          .single();
        profileRow = error ? (error.code === "PGRST116" ? "no" : "error") : data ? "yes" : "no";
        cloudOnboarding =
          data && typeof data.onboarding_complete === "boolean"
            ? data.onboarding_complete
            : null;
      }

      const source = profileSnapshot?.onboardingSource ?? "unknown";
      const onboarded =
        user && cloudOnboardingComplete === true
          ? true
          : isOnboardingComplete();
      const redirect = !profileReady
        ? "wait_hydration"
        : onboarded
          ? "app"
          : "onboarding";

      if (!cancelled) {
        setState({
          session: !!user,
          userId: user?.id ?? null,
          profileLoaded: profileReady,
          profileRow,
          cloudOnboarding: cloudOnboardingComplete ?? cloudOnboarding,
          localOnboarding: loadUserProfile().onboardingComplete,
          onboardingSource: source,
          redirectDecision: redirect,
          mode: "cloud",
        });
      }
    }

    void read();
    const interval = setInterval(() => void read(), 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [profileSnapshot, cloudOnboardingComplete, profileReady]);

  if (!state) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-32 left-2 z-[90] rounded-full bg-gray-900/80 text-white text-[10px] px-2 py-1"
      >
        auth
      </button>
    );
  }

  const Row = ({ label, ok, value }: { label: string; ok: boolean; value?: string }) => (
    <div className="flex items-center justify-between gap-3">
      <span className="text-gray-400">{label}</span>
      <span className={ok ? "text-green-400" : "text-red-400"}>
        {value ?? (ok ? "yes" : "no")}
      </span>
    </div>
  );

  return (
    <div className="fixed bottom-32 left-2 z-[90] rounded-xl bg-gray-900/90 text-white text-[10px] font-mono px-3 py-2 space-y-1 w-52 shadow-lg">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-gray-300">AUTH DEBUG (dev)</span>
        <button type="button" onClick={() => setOpen(false)} className="text-gray-400">
          ×
        </button>
      </div>
      {!auth && (
        <p className="text-amber-400 text-[9px]">no AuthProvider (ok on /onboarding)</p>
      )}
      <Row label="session" ok={state.session} />
      <Row label="user id" ok={!!state.userId} value={state.userId ? state.userId.slice(0, 8) : "none"} />
      <Row label="profile loaded" ok={state.profileLoaded} />
      <Row label="profile row" ok={state.profileRow === "yes"} value={state.profileRow} />
      <Row
        label="cloud onboard"
        ok={state.cloudOnboarding === true}
        value={
          state.cloudOnboarding === null ? "n/a" : state.cloudOnboarding ? "true" : "false"
        }
      />
      <Row label="local onboard" ok={state.localOnboarding} />
      <Row label="source" ok={state.onboardingSource === "cloud"} value={state.onboardingSource} />
      <Row label="redirect" ok={state.redirectDecision === "app"} value={state.redirectDecision} />
    </div>
  );
}
