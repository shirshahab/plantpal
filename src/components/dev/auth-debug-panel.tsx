"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { isOnboardingComplete, loadUserProfile } from "@/lib/profile/user-profile";
import { useOptionalAuth } from "@/lib/store/auth-provider";
import { readClientSession } from "@/lib/auth/session";

interface DebugPanelState {
  sessionExists: boolean;
  userEmail: string | null;
  authLoading: boolean;
  onboardingComplete: boolean;
  redirectTarget: string;
  lastAuthError: string | null;
}

function computeRedirectTarget(input: {
  sessionExists: boolean;
  onboardingComplete: boolean;
}): string {
  if (!input.sessionExists) return "/login";
  if (!input.onboardingComplete) return "/onboarding";
  return "/dashboard";
}

/**
 * Dev-only or ?debugAuth=1 auth readout. No secrets — email only when session exists.
 */
export function AuthDebugPanel() {
  const searchParams = useSearchParams();
  const enabled =
    process.env.NODE_ENV === "development" || searchParams.get("debugAuth") === "1";
  if (!enabled) return null;
  return <AuthDebugPanelInner />;
}

function AuthDebugPanelInner() {
  const auth = useOptionalAuth();
  const [open, setOpen] = useState(true);
  const [state, setState] = useState<DebugPanelState | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function read() {
      const localOnboarded = isOnboardingComplete();
      const authLoading = auth ? auth.loading || !auth.profileReady : false;

      if (!isSupabaseConfigured()) {
        if (!cancelled) {
          setState({
            sessionExists: false,
            userEmail: null,
            authLoading,
            onboardingComplete: localOnboarded,
            redirectTarget: computeRedirectTarget({
              sessionExists: false,
              onboardingComplete: localOnboarded,
            }),
            lastAuthError: null,
          });
        }
        return;
      }

      const supabase = createClient();
      const snapshot = await readClientSession(supabase);
      const cloudOnboarded = auth?.cloudOnboardingComplete === true;
      const onboardingComplete = cloudOnboarded || localOnboarded;

      if (!cancelled) {
        setState({
          sessionExists: snapshot.sessionExists,
          userEmail: snapshot.user?.email ?? null,
          authLoading,
          onboardingComplete,
          redirectTarget: computeRedirectTarget({
            sessionExists: snapshot.sessionExists,
            onboardingComplete,
          }),
          lastAuthError: snapshot.errorMessage,
        });
      }
    }

    void read();
    const interval = setInterval(() => void read(), 4000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [auth]);

  if (!state) return null;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-24 left-2 z-[90] rounded-full bg-gray-900/80 text-white text-[10px] px-2 py-1"
      >
        auth debug
      </button>
    );
  }

  const Row = ({ label, value, ok }: { label: string; value: string; ok?: boolean }) => (
    <div className="flex items-center justify-between gap-2">
      <span className="text-gray-400">{label}</span>
      <span className={ok === undefined ? "text-gray-200" : ok ? "text-green-400" : "text-red-400"}>
        {value}
      </span>
    </div>
  );

  return (
    <div className="fixed bottom-24 left-2 z-[90] rounded-xl bg-gray-900/90 text-white text-[10px] font-mono px-3 py-2 space-y-1 w-56 shadow-lg">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-gray-300">AUTH DEBUG</span>
        <button type="button" onClick={() => setOpen(false)} className="text-gray-400">
          ×
        </button>
      </div>
      {!auth && (
        <p className="text-amber-400 text-[9px]">no AuthProvider on this route</p>
      )}
      <Row label="session" value={state.sessionExists ? "yes" : "no"} ok={state.sessionExists} />
      <Row label="email" value={state.userEmail ?? "none"} ok={!!state.userEmail} />
      <Row label="loading" value={state.authLoading ? "yes" : "no"} ok={!state.authLoading} />
      <Row
        label="onboarded"
        value={state.onboardingComplete ? "yes" : "no"}
        ok={state.onboardingComplete}
      />
      <Row label="redirect" value={state.redirectTarget} />
      <Row label="last error" value={state.lastAuthError ?? "none"} ok={!state.lastAuthError} />
      <Row label="local profile" value={loadUserProfile().ownerUserId?.slice(0, 8) ?? "none"} />
    </div>
  );
}
